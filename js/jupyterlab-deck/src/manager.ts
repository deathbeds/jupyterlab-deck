import { LabShell } from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { StatusBar } from '@jupyterlab/statusbar';
import { TranslationBundle } from '@jupyterlab/translation';
import { each } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { Widget, DockPanel, BoxLayout } from '@lumino/widgets';

import { ICONS } from './icons';
import { DeckRemote } from './remote';
import { IDeckManager, DATA, CommandIds, TDirection, IDeckAdapter } from './tokens';

export class DeckManager implements IDeckManager {
  constructor(options: DeckManager.IOptions) {
    this._commands = options.commands;
    this._shell = options.shell;
    this._statusbar = options.statusbar;
    this._trans = options.translator;
    this._settings = options.settings;

    this._shell.activeChanged.connect(this._onActiveWidgetChanged, this);
    this._shell.layoutModified.connect(this._addDeckStylesLater, this);
    this._activeWidget = this._shell.activeWidget;
    this._registerCommands();
    void this._settings.then(async (settings) => {
      settings.changed.connect(this._onSettingsChanged, this);
      await this._onSettingsChanged();
    });
  }

  /** translate a string by message id, potentially with positional arguments. */
  public __ = (msgid: string, ...args: string[]): string => {
    return this._trans.__(msgid, ...args);
  };

  public addAdapter(id: string, adapter: IDeckAdapter<any>): void {
    this._adapters.set(id, adapter);
  }

  /** enable deck mode */
  public async start(): Promise<void> {
    if (this._active) {
      return;
    }
    this._active = true;
    void this._settings.then((settings) => settings.set('active', true));
    if (this._statusbar) {
      this._statusBarWasEnabled = this._statusbar.isVisible;
      this._statusbar.hide();
    }
    this._shell.presentationMode = false;
    document.body.dataset[DATA.deckMode] = DATA.presenting;
    each(this._dockpanel.tabBars(), (bar) => bar.hide());
    this._shell.mode = 'single-document';
    this._shell.update();
    this._remote = new DeckRemote({ manager: this });
    (this._shell.layout as BoxLayout).addWidget(this._remote);
    window.addEventListener('resize', this._addDeckStylesLater);
    await this._onActiveWidgetChanged();
    this._addDeckStylesLater();

    if (this._activeWidget) {
      for (const adapter of this._adapters.values()) {
        const accepted = adapter.accepts(this._activeWidget);
        if (accepted) {
          await adapter.start(accepted);
          break;
        }
      }
    }
  }

  /** disable deck mode */
  public async stop(): Promise<void> {
    if (!this._active) {
      return;
    }

    if (this._activeWidget) {
      for (const adapter of this._adapters.values()) {
        const accepted = adapter.accepts(this._activeWidget);
        if (accepted) {
          await adapter.stop(accepted);
          break;
        }
      }
    }

    if (this._statusbar && this._statusBarWasEnabled) {
      this._statusbar.show();
    }

    each(this._dockpanel.tabBars(), (bar) => bar.show());

    if (this._remote) {
      this._remote.dispose();
      this._remote = null;
    }
    this._shell.presentationMode = false;
    this._shell.mode = 'multiple-document';
    window.removeEventListener('resize', this._addDeckStylesLater);
    delete document.body.dataset[DATA.deckMode];
    this._activeWidget = null;
    this._active = false;
    void this._settings.then((settings) => settings.set('active', false));
  }

  /** move around */
  public go = (direction: TDirection): void => {
    if (!this._activeWidget) {
      return;
    }
    for (const adapter of this._adapters.values()) {
      const accepted = adapter.accepts(this._activeWidget);
      if (accepted) {
        adapter.go(accepted, direction);
        break;
      }
    }
  };

  protected _registerCommands() {
    this._commands.addCommand(CommandIds.start, {
      label: this.__('Start Deck'),
      icon: ICONS.deckStart,
      execute: () => this.start(),
    });
    this._commands.addCommand(CommandIds.stop, {
      label: this.__('Stop Deck'),
      icon: ICONS.deckStop,
      execute: () => this.stop(),
    });
  }

  protected get _dockpanel(): DockPanel {
    return (this._shell as any)._dockPanel as DockPanel;
  }

  /** handle the active widget changing */
  protected async _onActiveWidgetChanged(): Promise<void> {
    if (!this._active) {
      return;
    }

    const { activeWidget } = this._shell;

    if (
      !activeWidget ||
      activeWidget === this._activeWidget ||
      activeWidget === this._remote
    ) {
      /* modals and stuff? */
      return;
    }

    if (this._activeWidget) {
      for (const adapter of this._adapters.values()) {
        const accepted = adapter.accepts(this._activeWidget);
        if (accepted) {
          await adapter.start(accepted);
          break;
        }
      }
    }

    this._activeWidget = activeWidget;

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
    if (this._activeWidget) {
      for (const adapter of this._adapters.values()) {
        const accepted = adapter.accepts(this._activeWidget);
        if (accepted) {
          adapter.style(accepted);
          break;
        }
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
    this._shell.collapseLeft();
    this._shell.collapseRight();
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
  protected _shell: LabShell;
  protected _trans: TranslationBundle;
  protected _commands: CommandRegistry;
  protected _statusbar: StatusBar | null;
  protected _statusBarWasEnabled = false;
  protected _remote: DeckRemote | null = null;
  protected _settings: Promise<ISettingRegistry.ISettings>;
  protected _styleCache = new Map<HTMLElement, string>();
  protected _adapters = new Map<string, IDeckAdapter<Widget>>();
}

export namespace DeckManager {
  export interface IOptions {
    commands: CommandRegistry;
    shell: LabShell;
    translator: TranslationBundle;
    statusbar: StatusBar | null;
    settings: Promise<ISettingRegistry.ISettings>;
  }
  export interface IExtent {
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
