import { LabShell } from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
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
  CSS,
  TSlideType,
  DATA,
  CommandIds,
  TDirection,
  DIRECTION,
} from './tokens';

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
    window.addEventListener('resize', this._addDeckStylesLater);
    document.body.dataset[DATA.deckMode] = DATA.presenting;
    each(this._dockpanel.tabBars(), (bar) => bar.hide());
    this._shell.mode = 'single-document';
    this._shell.update();
    this._remote = new DeckRemote({ manager: this });
    (this._shell.layout as BoxLayout).addWidget(this._remote);
    await this._onActiveWidgetChanged();
    this._addDeckStylesLater();
  }

  /** disable deck mode */
  public async stop(): Promise<void> {
    if (!this._active) {
      return;
    }
    if (this._statusbar && this._statusBarWasEnabled) {
      this._statusbar.show();
    }
    each(this._dockpanel.tabBars(), (bar) => bar.show());
    await this._stopNotebook();
    this._activeWidget = null;
    if (this._remote) {
      this._remote.dispose();
      this._remote = null;
    }
    this._shell.presentationMode = false;
    this._shell.mode = 'multiple-document';
    window.removeEventListener('resize', this._addDeckStylesLater);
    delete document.body.dataset[DATA.deckMode];
    this._active = false;
    void this._settings.then((settings) => settings.set('active', false));
  }

  /** move around */
  public go = (direction: TDirection): void => {
    const { _notebook } = this;
    if (_notebook) {
      switch (direction) {
        case DIRECTION.forward:
          _notebook.content.activeCellIndex += 1;
          break;
        case DIRECTION.back:
          _notebook.content.activeCellIndex -= 1;
          break;
        case DIRECTION.up:
        case DIRECTION.down:
          console.warn('not implemented yet');
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

  protected async _stopNotebook(): Promise<void> {
    const { _notebook } = this;
    if (!_notebook) {
      return;
    }
    _notebook.removeClass(CSS.deck);
    this._uncacheStyle(_notebook.content.node);
    this._uncacheStyle(_notebook.node);
    _notebook.content.activeCellChanged.disconnect(this._onActiveCellChanged, this);
    _notebook.update();
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
      await this._stopNotebook();
    }

    this._activeWidget = activeWidget;

    let { _notebook } = this;

    if (_notebook) {
      _notebook.content.activeCellChanged.connect(this._onActiveCellChanged, this);
      await this._onActiveCellChanged();
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

  protected get _notebook(): NotebookPanel | null {
    if (this._activeWidget instanceof NotebookPanel) {
      return this._activeWidget;
    }
    return null;
  }

  /** Build a model of what would be on-screen(s) for a given index */
  protected _getNotebookExtents(notebook: NotebookPanel): DeckManager.TExtentMap {
    let idx = 0;
    let extents: DeckManager.TExtentMap = new Map();
    let currentSlide: DeckManager.IExtent = { onScreen: [], visible: [], notes: [] };
    let currentExtents: DeckManager.TExtentMap = new Map();
    let fragmentExtent: DeckManager.IExtent | null = null;
    let nullExtent: DeckManager.IExtent | null = null;
    let lastAnnotated = -1;
    for (const cell of notebook.content.widgets) {
      let slideType = this._getSlideType(cell);
      switch (slideType) {
        case 'subslide':
        case 'slide':
          currentSlide = { onScreen: [idx], visible: [idx], notes: [] };
          currentExtents = new Map();
          currentExtents.set(idx, currentSlide);
          extents.set(idx, currentSlide);
          lastAnnotated = idx;
          fragmentExtent = null;
          nullExtent = null;
          break;
        case null:
          for (let otherExtent of currentExtents.values()) {
            otherExtent.onScreen.push(idx);
          }
          if (fragmentExtent) {
            fragmentExtent.visible.push(idx);
          } else {
            currentSlide.visible.push(idx);
          }
          nullExtent = {
            onScreen: [...currentSlide.onScreen, idx],
            visible: [
              ...currentSlide.visible,
              ...((nullExtent && nullExtent.visible) || []),
              ...((fragmentExtent && fragmentExtent.visible) || []),
              idx,
            ],
            notes: [],
          };
          currentExtents.set(idx, nullExtent);
          extents.set(idx, nullExtent);
          lastAnnotated = idx;
          break;
        case 'fragment':
          for (let otherExtent of currentExtents.values()) {
            otherExtent.onScreen.push(idx);
          }
          fragmentExtent = {
            onScreen: [...currentSlide.onScreen, idx],
            visible: [
              ...currentSlide.visible,
              ...((fragmentExtent && fragmentExtent.visible) || []),
              idx,
            ],
            notes: [],
          };
          currentExtents.set(idx, fragmentExtent);
          extents.set(idx, fragmentExtent);
          break;
        case 'notes':
          if (lastAnnotated !== -1) {
            extents.get(lastAnnotated)?.notes.push(idx);
          }
          break;
        case 'skip':
          break;
      }
      idx += 1;
    }
    return extents;
  }

  protected async _onActiveCellChanged(): Promise<void> {
    let notebook = this._activeWidget;

    if (!(notebook instanceof NotebookPanel)) {
      return;
    }
    const { content } = notebook;
    const extents = this._getNotebookExtents(notebook);

    const { activeCellIndex } = content;
    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent) {
      let offset = this._previousActiveCellIndex > activeCellIndex ? -1 : 1;
      notebook.content.activeCellIndex = activeCellIndex + offset;
      return;
    }

    this._previousActiveCellIndex = activeCellIndex;

    let idx = 0;
    for (const cell of notebook.content.widgets) {
      if (activeExtent.onScreen.includes(idx)) {
        cell.addClass(CSS.onScreen);
      } else {
        cell.removeClass(CSS.onScreen);
      }
      if (activeExtent.visible.includes(idx)) {
        cell.addClass(CSS.visible);
      } else {
        cell.removeClass(CSS.visible);
      }
      idx++;
    }
  }

  protected _getSlideType(cell: Cell): TSlideType {
    return ((cell.model.metadata.get('slideshow') || {}) as any)['slide_type'] || null;
  }

  protected _cacheStyle(node: HTMLElement) {
    if (!this._styleCache.get(node)) {
      this._styleCache.set(node, node.getAttribute('style') || '');
    }
    node.setAttribute('style', '');
  }

  protected _uncacheStyle(node: HTMLElement) {
    const style = this._styleCache.get(node);
    if (style) {
      node.setAttribute('style', style);
      this._styleCache.delete(node);
    }
  }

  protected _addDeckStyles = () => {
    const { _notebook: notebook, _remote } = this;
    let clearStyles: HTMLElement[] = [];
    if (notebook) {
      notebook.addClass(CSS.deck);
      this._cacheStyle(notebook.node);
      this._cacheStyle(notebook.content.node);
    }
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
  protected _previousActiveCellIndex: number = -1;
  protected _activeWidget: Widget | null;
  protected _shell: LabShell;
  protected _trans: TranslationBundle;
  protected _commands: CommandRegistry;
  protected _statusbar: StatusBar | null;
  protected _statusBarWasEnabled = false;
  protected _remote: DeckRemote | null = null;
  protected _settings: Promise<ISettingRegistry.ISettings>;
  protected _styleCache = new Map<HTMLElement, string>();
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
