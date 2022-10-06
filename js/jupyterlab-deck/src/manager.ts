import { NotebookPanel } from '@jupyterlab/notebook';
import { IDeckManager, CSS, TSlideType, DATA, CommandIds } from './tokens';
import { Cell } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { each } from '@lumino/algorithm';
import screenfull from 'screenfull';
import { StatusBar } from '@jupyterlab/statusbar';
import { LabShell } from '@jupyterlab/application';
import { Widget, DockPanel } from '@lumino/widgets';
import { TranslationBundle } from '@jupyterlab/translation';
import { ICONS } from './icons';

export class DeckManager implements IDeckManager {
  private _active = false;
  private _previousActiveCellIndex: number = -1;
  private _activeWidget: Widget | null;
  private _shell: LabShell;
  private _trans: TranslationBundle;
  private _commands: CommandRegistry;
  private _statusbar: StatusBar | null;
  private _statusBarWasEnabled = false;
  private _dockPanelMode: DockPanel.Mode | null = null;

  constructor(options: DeckManager.IOptions) {
    this._commands = options.commands;
    this._shell = options.shell;
    this._statusbar = options.statusbar;
    this._trans = options.translator;

    this._shell.activeChanged.connect(this.onActiveWidgetChanged, this);
    this._activeWidget = this._shell.activeWidget;
    this.registerCommands();
  }

  protected registerCommands() {
    this._commands.addCommand(CommandIds.start, {
      label: this.__('Start Deck'),
      icon: ICONS.deck,
      execute: () => this.start(),
    });
    this._commands.addCommand(CommandIds.stop, {
      label: this.__('Stop Deck'),
      icon: ICONS.deck,
      execute: () => this.stop(),
    });
  }

  /** translate a string by message id, potentially with positional arguments. */
  __ = (msgid: string, ...args: string[]): string => {
    return this._trans.__(msgid, ...args);
  };

  /** public API for enabling deck mode */
  async start(): Promise<void> {
    this._active = true;
    if (this._statusbar) {
      this._statusBarWasEnabled = this._statusbar.isVisible;
      this._statusbar.hide();
    }
    this._dockPanelMode = this._dockpanel.mode;
    screenfull.request(document.body);
    screenfull.on('change', this.onScreenfull);
    window.addEventListener('resize', this.onScreenfull);
    document.body.dataset[DATA.deckMode] = DATA.presenting;
    this._shell.collapseLeft();
    this._shell.collapseRight();
    each(this._dockpanel.tabBars(), (bar) => {
      bar.hide();
    });
    this._shell.mode = 'single-document';
    this._shell.update();
    await this.onActiveWidgetChanged();
  }

  private get _dockpanel(): DockPanel {
    return (this._shell as any)._dockPanel as DockPanel;
  }

  /** public API for disabling deck mode */
  async stop(): Promise<void> {
    if (this._dockPanelMode) {
      this._dockpanel.mode = this._dockPanelMode;
    }
    if (this._statusbar && this._statusBarWasEnabled) {
      this._statusbar.show();
    }
    each(this._dockpanel.tabBars(), (bar) => {
      bar.show();
    });
    await this._stopNotebook();
    this._activeWidget = null;
    this._active = false;
    window.removeEventListener('resize', this.addDeckStyles);
    delete document.body.dataset[DATA.deckMode];
  }

  onScreenfull = async (event: Event): Promise<void> => {
    if (screenfull.isFullscreen) {
      this.addDeckStyles();
      setTimeout(() => this.addDeckStyles(), 10);
    } else {
      screenfull.off('change', this.onScreenfull);
      await this.stop();
    }
  };

  async _stopNotebook(): Promise<void> {
    const { notebook } = this;
    if (!notebook) {
      return;
    }
    notebook.removeClass(CSS.deck);
    notebook.content.activeCellChanged.disconnect(this.onActiveCellChanged, this);
    notebook.update();
  }

  /** handle the active widget changing */
  async onActiveWidgetChanged(): Promise<void> {
    if (!this._active) {
      return;
    }
    if (!this._shell.activeWidget || this._shell.activeWidget === this._activeWidget) {
      /* modals and stuff? */
      return;
    }

    if (this._activeWidget) {
      this._stopNotebook();
    }

    this._activeWidget = this._shell.activeWidget;

    let { notebook } = this;

    if (notebook) {
      notebook.content.activeCellChanged.connect(this.onActiveCellChanged, this);
      await this.onActiveCellChanged();
    }

    this.addDeckStyles();
  }

  get notebook(): NotebookPanel | null {
    if (this._activeWidget instanceof NotebookPanel) {
      return this._activeWidget;
    }
    return null;
  }

  /** Build a model of what would be on-screen(s) for a given index */
  getNotebookExtents(notebook: NotebookPanel): DeckManager.TExtentMap {
    let idx = 0;
    let extents: DeckManager.TExtentMap = new Map();
    let currentSlide: DeckManager.IExtent = { onScreen: [], visible: [], notes: [] };
    let currentExtents: DeckManager.TExtentMap = new Map();
    let fragmentExtent: DeckManager.IExtent | null = null;
    let nullExtent: DeckManager.IExtent | null = null;
    let lastAnnotated = -1;
    for (const cell of notebook.content.widgets) {
      let slideType = this.getSlideType(cell);
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

  async onActiveCellChanged(): Promise<void> {
    let notebook = this._activeWidget;

    if (!(notebook instanceof NotebookPanel)) {
      return;
    }
    const { content } = notebook;
    const extents = this.getNotebookExtents(notebook);

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

  getSlideType(cell: Cell): TSlideType {
    return ((cell.model.metadata.get('slideshow') || {}) as any)['slide_type'] || null;
  }

  addDeckStyles = () => {
    const { notebook } = this;
    if (notebook) {
      notebook.addClass(CSS.deck);
      notebook.update();
      notebook.toolbar.node.style.top = 'unset';
      notebook.toolbar.node.style.bottom = '0';
      notebook.toolbar.node.style.right = '0';
      notebook.toolbar.node.style.width = 'unset';
    }
    this._shell.presentationMode = true;
  };
}

export namespace DeckManager {
  export interface IOptions {
    commands: CommandRegistry;
    shell: LabShell;
    translator: TranslationBundle;
    statusbar: StatusBar | null;
  }
  export interface IExtent {
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
