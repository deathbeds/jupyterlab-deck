import { IFontManager } from '@deathbeds/jupyterlab-fonts';
import { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import type { INotebookShell } from '@jupyter-notebook/application';
import { LabShell, JupyterFrontEnd, ILabShell } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { StatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import { CommandRegistry } from '@lumino/commands';
import { Signal, ISignal } from '@lumino/signaling';
import { Widget, DockPanel } from '@lumino/widgets';

import { ICONS } from './icons';
import { getSelectedWidget, getTabBars } from './labcompat';
import {
  IDeckManager,
  DATA,
  CommandIds,
  TDirection,
  IPresenter,
  DIRECTION,
  DIRECTION_LABEL,
  EMOJI,
  TCanGoDirection,
  DIRECTION_KEYS,
  CSS,
  COMPOUND_KEYS,
  IStylePreset,
  IDeckSettings,
  TSlideType,
  TLayerScope,
} from './tokens';
import { DesignTools } from './tools/design';
import type { Layover } from './tools/layover';
import { DeckRemote } from './tools/remote';

export class DeckManager implements IDeckManager {
  protected _active = false;
  protected _activeChanged = new Signal<IDeckManager, void>(this);
  protected _activeWidget: Widget | null = null;
  protected _presenters: IPresenter<any>[] = [];
  protected _appStarted: () => Promise<void>;
  protected _commands: CommandRegistry;
  protected _remote: DeckRemote | null = null;
  protected _designTools: DesignTools | null = null;
  protected _settings: Promise<ISettingRegistry.ISettings>;
  protected _labShell?: LabShell | null;
  protected _dockPanel: DockPanel | null = null;
  protected _shell: JupyterFrontEnd.IShell;
  protected _statusbar: StatusBar | null;
  protected _statusBarWasEnabled = false;
  protected _styleCache = new Map<HTMLElement, string>();
  protected _trans: TranslationBundle;
  protected _stylePresets = new Map<string, IStylePreset>();
  protected _stylePresetsChanged = new Signal<IDeckManager, void>(this);
  protected _layoverChanged = new Signal<IDeckManager, void>(this);
  protected _fonts: IFontManager;
  protected _layover: Layover | null = null;
  protected _activePresenter: IPresenter<Widget> | null = null;
  protected _activeWidgetStack: Widget[] = [];

  constructor(options: DeckManager.IOptions) {
    this._appStarted = options.appStarted;
    this._commands = options.commands;
    this._shell = options.shell;
    this._labShell = options.labShell || null;
    this._statusbar = options.statusbar;
    this._trans = options.translator;
    this._settings = options.settings;
    this._fonts = options.fonts;
    if (this._labShell) {
      this._dockPanel = (this._shell as any)._dockPanel;
      this._labShell.activeChanged.connect(this._onActiveWidgetChanged, this);
      this._labShell.layoutModified.connect(this._addDeckStylesLater, this);
    }

    this._addCommands();
    this._addKeyBindings();
    this._settings
      .then(async (settings) => {
        settings.changed.connect(this._onSettingsChanged, this);
        await this._onSettingsChanged();
      })
      .catch(console.warn);
  }

  public get activePresenter() {
    return this._activePresenter;
  }

  public get layover() {
    return this._layover;
  }

  public get fonts() {
    return this._fonts;
  }

  public get activeChanged(): ISignal<IDeckManager, void> {
    return this._activeChanged;
  }

  public get stylePresetsChanged(): ISignal<IDeckManager, void> {
    return this._stylePresetsChanged;
  }

  public get layoverChanged(): ISignal<IDeckManager, void> {
    return this._layoverChanged;
  }

  /**
   * translate a string by message id (usually the en-US string), potentially
   * with positional arguments, starting with %1.
   */
  public __ = (msgid: string, ...args: string[]): string => {
    return this._trans.__(msgid, ...args);
  };

  public addPresenter(presenter: IPresenter<any>): void {
    let newPresenters = [...this._presenters, presenter];
    newPresenters.sort(this._sortByRank);
    this._presenters = newPresenters;
    presenter.activeChanged.connect(() => this._activeChanged.emit(void 0));
  }

  public addStylePreset(preset: IStylePreset): void {
    this._stylePresets.set(preset.key, preset);
    this._stylePresetsChanged.emit(void 0);
  }

  public get stylePresets(): IStylePreset[] {
    return [...this._stylePresets.values()];
  }

  /** enable deck mode */
  public start = async (force: boolean = false): Promise<void> => {
    await this._appStarted();
    const wasActive = this._active;

    /* istanbul ignore if */
    if (wasActive && !force) {
      return;
    }

    if (!this._activeWidget) {
      const { _shellActiveWidget } = this;
      if (_shellActiveWidget) {
        this._activeWidget = _shellActiveWidget;
      } else {
        setTimeout(async () => await this.start(), 10);
        return;
      }
    }

    const { _labShell, _shell, _activeWidget } = this;

    if (!wasActive) {
      this._active = true;
      void this._settings.then((settings) => settings.set('active', true));
      if (this._statusbar) {
        this._statusBarWasEnabled = this._statusbar.isVisible;
        this._statusbar.hide();
      }
      if (_labShell) {
        _labShell.presentationMode = false;
      }
      document.body.dataset[DATA.deckMode] = DATA.presenting;
      if (this._dockPanel) {
        for (const bar of getTabBars(this._dockPanel)) {
          bar.hide();
        }
      }
      if (_labShell) {
        _labShell.mode = 'single-document';
      }
      this._remote = new DeckRemote({ manager: this });
      this._designTools = new DesignTools({ manager: this });
      window.addEventListener('resize', this._addDeckStylesLater);
    }
    _shell.update();

    await this._onActiveWidgetChanged();

    if (_activeWidget) {
      await this._fonts.ensureJss();
      this._activePresenter = this._getPresenter(_activeWidget);
      if (this._activePresenter) {
        await this._activePresenter.start(_activeWidget);
      }
    }

    if (_labShell) {
      _labShell.expandLeft();
      _labShell.expandRight();
      _labShell.collapseLeft();
      _labShell.collapseRight();
      setTimeout(() => {
        _labShell.collapseLeft();
        _labShell.collapseRight();
      }, 1000);
    }

    if (!wasActive) {
      await this._addDeckStyles();
    }
    this._activeChanged.emit(void 0);
  };

  public get activeWidget(): Widget | null {
    return this._activeWidget;
  }

  /** disable deck mode */
  public stop = async (): Promise<void> => {
    /* istanbul ignore if */
    if (!this._active) {
      return;
    }

    const {
      _activeWidget,
      _labShell,
      _statusbar,
      _remote,
      _layover,
      _designTools,
      _dockPanel,
    } = this;

    /* istanbul ignore if */
    if (_layover) {
      await this.hideLayover();
    }

    if (_activeWidget) {
      const presenter = this._getPresenter(_activeWidget);
      if (presenter) {
        await presenter.stop(_activeWidget);
      }
    }

    if (_statusbar && this._statusBarWasEnabled) {
      _statusbar.show();
    }

    if (_dockPanel) {
      for (const bar of getTabBars(_dockPanel)) {
        bar.show();
      }
    }

    if (_remote) {
      _remote.dispose();
      this._remote = null;
    }
    if (_designTools) {
      _designTools.dispose();
      this._designTools = null;
    }
    if (_labShell) {
      _labShell.presentationMode = false;
      _labShell.mode = 'multiple-document';
    }
    window.removeEventListener('resize', this._addDeckStylesLater);
    delete document.body.dataset[DATA.deckMode];
    this._activeWidget = null;
    this._active = false;
    this._activeWidgetStack = [];
    void this._settings.then(async (settings) => {
      await settings.set('active', false);
      this._shell.update();
      const _main = (this._shell as any)._main;
      if (_main && typeof _main.update == 'function') {
        _main.update();
      }
    });
  };

  /** move around */
  public go = async (direction: TDirection, alternate?: TDirection): Promise<void> => {
    /* istanbul ignore if */
    if (!this._activeWidget) {
      return;
    }
    const presenter = this._getPresenter(this._activeWidget);
    /* istanbul ignore if */
    if (!presenter) {
      return;
    }
    await presenter.go(this._activeWidget, direction, alternate);
    this._activeChanged.emit(void 0);
  };

  public async canGo(): Promise<Partial<TCanGoDirection>> {
    const { _active, _activeWidget } = this;
    if (_active && _activeWidget) {
      const presenter = this._getPresenter(_activeWidget);
      if (presenter) {
        return await presenter.canGo(_activeWidget);
      }
    }
    return {};
  }

  protected _sortByRank(a: IPresenter<any>, b: IPresenter<any>) {
    return a.rank - b.rank || a.id.localeCompare(b.id);
  }

  protected _getPresenter(widget: Widget | null): IPresenter<Widget> | null {
    if (widget) {
      for (const presenter of this._presenters) {
        if (presenter.accepts(widget)) {
          return presenter;
        }
      }
    }
    /* istanbul ignore next */
    return null;
  }

  /** overload the stock notebook keyboard shortcuts */
  protected _addKeyBindings() {
    for (const direction of Object.values(DIRECTION)) {
      this._commands.addKeyBinding({
        command: CommandIds[direction],
        args: {},
        keys: DIRECTION_KEYS[direction],
        selector: `.${CSS.remote}`,
      });
    }
    for (const [directions, keys] of COMPOUND_KEYS.entries()) {
      const [direction, alternate] = directions;
      this._commands.addKeyBinding({
        command: CommandIds.go,
        args: { direction, alternate },
        keys,
        selector: `.${CSS.remote}`,
      });
    }
  }

  public async showLayover() {
    if (!this._layover) {
      this._layover = new (await import('./tools/layover')).Layover({ manager: this });
      this._layoverChanged.emit(void 0);
    }
    await this.start(true);
  }

  public async hideLayover() {
    if (this._layover) {
      this._layover.dispose();
      this._layover = null;
      this._layoverChanged.emit(void 0);
    }
  }

  public getSlideType(): TSlideType {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.getSlideType) {
      return _activePresenter.getSlideType(_activeWidget) || null;
    }
    /* istanbul ignore next */
    return null;
  }

  public setSlideType(slideType: TSlideType): void {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.setSlideType) {
      _activePresenter.setSlideType(_activeWidget, slideType);
    }
  }

  public getLayerScope(): TLayerScope | null {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.getLayerScope) {
      return _activePresenter.getLayerScope(_activeWidget) || null;
    }
    /* istanbul ignore next */
    return null;
  }

  public setLayerScope(layerScope: TLayerScope | null): void {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.setLayerScope) {
      _activePresenter.setLayerScope(_activeWidget, layerScope);
    }
  }

  public getPartStyles(): GlobalStyles | null {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.getPartStyles) {
      const styles = _activePresenter.getPartStyles(_activeWidget) || null;
      return styles;
    }
    /* istanbul ignore next */
    return null;
  }
  public setPartStyles(styles: GlobalStyles | null): void {
    let { _activeWidget, _activePresenter } = this;
    if (_activeWidget && _activePresenter?.setPartStyles) {
      _activePresenter.setPartStyles(_activeWidget, styles);
    }
  }

  public activateWidget(widget: Widget): void {
    this._shell.activateById(widget.node.id);
  }

  public get activeWidgetStack(): Widget[] {
    return [...this._activeWidgetStack];
  }

  protected _addCommands() {
    let { _commands, __, go } = this;
    _commands.addCommand(CommandIds.start, {
      label: __('Start Deck'),
      icon: ICONS.deckStart,
      execute: () => this.start(),
    });
    _commands.addCommand(CommandIds.stop, {
      label: __('Stop Deck'),
      icon: ICONS.deckStop,
      execute: this.stop,
    });
    _commands.addCommand(CommandIds.toggle, {
      label: __('Toggle Deck'),
      icon: ICONS.deckStop,
      execute: async () => {
        await (this._active ? this.stop() : this.start());
      },
    });

    this._commands.addCommand(CommandIds.showLayover, {
      icon: ICONS.transformStart,
      label: this.__('Show Slide Layout'),
      execute: () => this.showLayover(),
    });

    this._commands.addCommand(CommandIds.hideLayover, {
      icon: ICONS.transformStop,
      label: this.__('Hide Slide Layout'),
      execute: () => this.hideLayover(),
    });

    _commands.addCommand(CommandIds.go, {
      label: __('Go direction in Deck'),
      execute: async (args: any) => {
        const direction = DIRECTION[args.direction];
        const alternate = DIRECTION[args.alternate];
        if (direction) {
          await go(direction, alternate);
        } else {
          console.warn(EMOJI + __(`Can't go "%1" in Deck`, args.direction));
        }
      },
    });
    for (const [direction, label] of Object.entries(DIRECTION_LABEL)) {
      _commands.addCommand(CommandIds[direction as TDirection], {
        label: __(label),
        execute: () => go(direction as TDirection),
      });
    }
  }

  /** handle the active widget changing */
  protected async _onActiveWidgetChanged(): Promise<void> {
    if (!this._active) {
      this._activeWidget = null;
      return;
    }

    const { _activeWidget, _shellActiveWidget } = this;

    if (!_shellActiveWidget || _shellActiveWidget === _activeWidget) {
      /* modals and stuff? */
      return;
    }

    if (_activeWidget) {
      const presenter = this._getPresenter(_activeWidget);
      if (presenter) {
        await presenter.stop(_activeWidget);
      }
      if (!this._activeWidgetStack.includes(_activeWidget)) {
        this._activeWidgetStack.push(_activeWidget);
      }
    }

    this._activeWidget = _shellActiveWidget;

    this._activePresenter = null;

    if (_shellActiveWidget) {
      if (this._activeWidgetStack.includes(_shellActiveWidget)) {
        this._activeWidgetStack.splice(
          this._activeWidgetStack.indexOf(_shellActiveWidget),
          1,
        );
      }
      this._activePresenter = this._getPresenter(_shellActiveWidget);
      if (this._activePresenter) {
        await this._activePresenter.start(_shellActiveWidget);
      }
    }

    await this._addDeckStyles();
    this._activeChanged.emit(void 0);
  }

  protected get _shellActiveWidget(): Widget | null {
    const { _labShell, _shell, _dockPanel } = this;
    if (_labShell && _dockPanel) {
      if (_labShell.activeWidget) {
        return _labShell.activeWidget;
      }
      return getSelectedWidget(_dockPanel);
    } else {
      return (_shell as INotebookShell).currentWidget || null;
    }
  }

  protected async _onSettingsChanged() {
    const settings = await this._settings;
    let composite: IDeckSettings;
    composite = settings.composite as IDeckSettings;
    const active = composite.active === true;

    if (active && !this._active) {
      void this.start();
    } else if (!active && this._active) {
      void this.stop();
    }

    if (composite.stylePresets) {
      for (let keyPreset of Object.entries(composite.stylePresets)) {
        let [key, preset] = keyPreset;
        let { scope, label, styles } = preset;
        if (!styles || !label) {
          continue;
        }
        this._stylePresets.set(key, {
          key,
          scope: scope || 'any',
          styles,
          label,
        });
        this._stylePresetsChanged.emit(void 0);
      }
    }
  }

  cacheStyle(...nodes: HTMLElement[]) {
    for (const node of nodes) {
      if (!this._styleCache.get(node)) {
        this._styleCache.set(node, node.getAttribute('style') || '');
      }
      node.setAttribute('style', '');
    }
  }

  uncacheStyle(...nodes: HTMLElement[]) {
    for (const node of nodes) {
      const style = this._styleCache.get(node);
      if (style) {
        node.setAttribute('style', style);
        this._styleCache.delete(node);
      }
    }
  }

  protected _addDeckStyles = async () => {
    const { _activeWidget } = this;
    if (_activeWidget) {
      const presenter = this._getPresenter(this._activeWidget);
      if (presenter) {
        await presenter.style(_activeWidget);
      }
    }
    const { _remote } = this;
    let clearStyles: HTMLElement[] = [];

    if (_remote) {
      clearStyles.push(_remote.node);
    }
    for (const clear of clearStyles) {
      clear.setAttribute('style', '');
    }
  };

  protected _addDeckStylesLater = () => {
    if (!this._active) {
      return;
    }
    this._shell.update();
    this._shell.fit();
    setTimeout(this._addDeckStyles, 10);
  };
}

export namespace DeckManager {
  export interface IOptions {
    commands: CommandRegistry;
    labShell: ILabShell | null;
    shell: JupyterFrontEnd.IShell;
    translator: TranslationBundle;
    statusbar: StatusBar | null;
    settings: Promise<ISettingRegistry.ISettings>;
    appStarted: () => Promise<any>;
    fonts: IFontManager;
  }
  export interface IExtent {
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
