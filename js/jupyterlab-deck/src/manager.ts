import { LabShell } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { StatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import { each } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { Widget, DockPanel, BoxLayout } from '@lumino/widgets';

import { ICONS } from './icons';
import { DeckRemote } from './remote';
import {
  IDeckManager,
  DATA,
  CommandIds,
  TDirection,
  IDeckAdapter,
  DIRECTION,
  DIRECTION_LABEL,
  EMOJI,
} from './tokens';

export class DeckManager implements IDeckManager {
  constructor(options: DeckManager.IOptions) {
    this._appStarted = options.appStarted;
    this._commands = options.commands;
    this._shell = options.shell;
    this._statusbar = options.statusbar;
    this._trans = options.translator;
    this._settings = options.settings;

    this._shell.activeChanged.connect(this._onActiveWidgetChanged, this);
    this._shell.layoutModified.connect(this._addDeckStylesLater, this);
    this._activeWidget = this._shell.activeWidget;
    this._registerCommands();
    this._settings
      .then(async (settings) => {
        settings.changed.connect(this._onSettingsChanged, this);
        await this._onSettingsChanged();
      })
      .catch(console.warn);
  }

  /**
   * translate a string by message id (usually the en-US string), potentially
   * with positional arguments, starting with %1.
   */
  public __ = (msgid: string, ...args: string[]): string => {
    return this._trans.__(msgid, ...args);
  };

  public addAdapter(adapter: IDeckAdapter<any>): void {
    let newAdapters = [...this._adapters, adapter];
    newAdapters.sort(this._sortByRank);
    this._adapters = newAdapters;
  }

  protected _sortByRank(a: IDeckAdapter<any>, b: IDeckAdapter<any>) {
    return a.rank - b.rank || a.id.localeCompare(b.id);
  }

  /** enable deck mode */
  public start = async (): Promise<void> => {
    if (this._active) {
      return;
    }
    const { _shell, _activeWidget } = this;
    await this._appStarted;
    this._active = true;
    void this._settings.then((settings) => settings.set('active', true));
    if (this._statusbar) {
      this._statusBarWasEnabled = this._statusbar.isVisible;
      this._statusbar.hide();
    }
    _shell.presentationMode = false;
    document.body.dataset[DATA.deckMode] = DATA.presenting;
    each(this._dockpanel.tabBars(), (bar) => bar.hide());
    _shell.mode = 'single-document';
    _shell.update();
    this._remote = new DeckRemote({ manager: this });
    (_shell.layout as BoxLayout).addWidget(this._remote);
    window.addEventListener('resize', this._addDeckStylesLater);
    await this._onActiveWidgetChanged();
    this._addDeckStylesLater();

    if (_activeWidget) {
      const adapter = this._getAdapter(_activeWidget);
      if (adapter) {
        await adapter.start(_activeWidget);
      }
    }

    _shell.expandLeft();
    _shell.expandRight();
    _shell.collapseLeft();
    _shell.collapseRight();
    setTimeout(() => {
      _shell.collapseLeft();
      _shell.collapseRight();
    }, 1000);
  };

  /** disable deck mode */
  public stop = async (): Promise<void> => {
    if (!this._active) {
      return;
    }

    const { _activeWidget, _shell, _statusbar, _remote } = this;

    if (_activeWidget) {
      const adapter = this._getAdapter(_activeWidget);
      if (adapter) {
        await adapter.stop(_activeWidget);
      }
    }

    if (_statusbar && this._statusBarWasEnabled) {
      _statusbar.show();
    }

    each(this._dockpanel.tabBars(), (bar) => bar.show());

    if (_remote) {
      _remote.dispose();
      this._remote = null;
    }
    _shell.presentationMode = false;
    _shell.mode = 'multiple-document';
    window.removeEventListener('resize', this._addDeckStylesLater);
    delete document.body.dataset[DATA.deckMode];
    this._activeWidget = null;
    this._active = false;
    void this._settings.then((settings) => settings.set('active', false));
  };

  /** move around */
  public go = async (direction: TDirection): Promise<void> => {
    if (!this._activeWidget) {
      return;
    }
    const adapter = this._getAdapter(this._activeWidget);
    if (!adapter) {
      return;
    }
    await adapter.go(this._activeWidget, direction);
  };

  protected _getAdapter(widget: Widget | null): IDeckAdapter<Widget> | null {
    if (widget) {
      for (const adapter of this._adapters) {
        if (adapter.accepts(widget)) {
          return adapter;
        }
      }
    }
    return null;
  }

  protected _registerCommands() {
    let { _commands, __, go } = this;
    _commands.addCommand(CommandIds.start, {
      label: __('Start Deck'),
      icon: ICONS.deckStart,
      execute: this.start,
    });
    _commands.addCommand(CommandIds.stop, {
      label: __('Stop Deck'),
      icon: ICONS.deckStop,
      execute: this.stop,
    });
    _commands.addCommand(CommandIds.go, {
      label: __('Go direction in Deck'),
      execute: async (args: any) => {
        const direction = DIRECTION[args.direction];
        if (direction) {
          await go(direction);
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

  protected get _dockpanel(): DockPanel {
    return (this._shell as any)._dockPanel as DockPanel;
  }

  /** handle the active widget changing */
  protected async _onActiveWidgetChanged(): Promise<void> {
    if (!this._active) {
      return;
    }

    const { _activeWidget } = this;
    const { activeWidget } = this._shell;

    if (
      !activeWidget ||
      activeWidget === _activeWidget ||
      activeWidget === this._remote
    ) {
      /* modals and stuff? */
      return;
    }

    if (_activeWidget) {
      const adapter = this._getAdapter(_activeWidget);
      if (adapter) {
        await adapter.stop(_activeWidget);
      }
    }

    this._activeWidget = activeWidget;

    if (activeWidget) {
      const adapter = this._getAdapter(activeWidget);
      if (adapter) {
        await adapter.start(activeWidget);
      }
    }

    this._addDeckStyles();
  }

  protected async _onSettingsChanged() {
    const settings = await this._settings;
    const { composite } = settings;
    const active = composite['active'] === true;
    if (active && !this._active) {
      void this.start();
    } else if (!active && this._active) {
      void this.stop();
    }
  }

  cacheStyle(node: HTMLElement) {
    if (!this._styleCache.get(node)) {
      this._styleCache.set(node, node.getAttribute('style') || '');
    }
    node.setAttribute('style', '');
  }

  uncacheStyle(node: HTMLElement) {
    const style = this._styleCache.get(node);
    if (style) {
      node.setAttribute('style', style);
      this._styleCache.delete(node);
    }
  }

  protected _addDeckStyles = () => {
    const { _activeWidget } = this;
    if (_activeWidget) {
      const adapter = this._getAdapter(this._activeWidget);
      if (adapter) {
        adapter.style(_activeWidget);
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

  protected _active = false;
  protected _activeWidget: Widget | null;
  protected _adapters: IDeckAdapter<any>[] = [];
  protected _appStarted: Promise<void>;
  protected _commands: CommandRegistry;
  protected _remote: DeckRemote | null = null;
  protected _settings: Promise<ISettingRegistry.ISettings>;
  protected _shell: LabShell;
  protected _statusbar: StatusBar | null;
  protected _statusBarWasEnabled = false;
  protected _styleCache = new Map<HTMLElement, string>();
  protected _trans: TranslationBundle;
}

export namespace DeckManager {
  export interface IOptions {
    commands: CommandRegistry;
    shell: LabShell;
    translator: TranslationBundle;
    statusbar: StatusBar | null;
    settings: Promise<ISettingRegistry.ISettings>;
    appStarted: Promise<void>;
  }
  export interface IExtent {
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
