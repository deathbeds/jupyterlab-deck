import { LabShell } from '@jupyterlab/application';
import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
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
  private _active = false;
  private _previousActiveCellIndex: number = -1;
  private _activeWidget: Widget | null;
  private _shell: LabShell;
  private _trans: TranslationBundle;
  private _commands: CommandRegistry;
  private _statusbar: StatusBar | null;
  private _statusBarWasEnabled = false;
  private _dockPanelMode: DockPanel.Mode | null = null;
  private _remote: DeckRemote | null = null;

  constructor(options: DeckManager.IOptions) {
    this._commands = options.commands;
    this._shell = options.shell;
    this._statusbar = options.statusbar;
    this._trans = options.translator;

    this._shell.activeChanged.connect(this.onActiveWidgetChanged, this);
    this._shell.layoutModified.connect(this.addDeckStylesLater, this);
    this._activeWidget = this._shell.activeWidget;
    this.registerCommands();
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
    if (this._statusbar) {
      this._statusBarWasEnabled = this._statusbar.isVisible;
      this._statusbar.hide();
    }
    this._dockPanelMode = this._dockpanel.mode;
    window.addEventListener('resize', this.addDeckStylesLater);
    document.body.dataset[DATA.deckMode] = DATA.presenting;
    this._shell.collapseLeft();
    this._shell.collapseRight();
    each(this._dockpanel.tabBars(), (bar) => {
      bar.hide();
    });
    // this._shell.mode = 'single-document';
    this._shell.update();
    this._remote = new DeckRemote({ manager: this });
    (this._shell.layout as BoxLayout).addWidget(this._remote);
    await this.onActiveWidgetChanged();
    this.addDeckStylesLater();
  }

  /** disable deck mode */
  public async stop(): Promise<void> {
    if (!this._active) {
      return;
    }
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
    if (this._remote) {
      this._remote.dispose();
      this._remote = null;
    }
    window.removeEventListener('resize', this.addDeckStylesLater);
    delete document.body.dataset[DATA.deckMode];
  }

  /** move around */
  public go = (direction: TDirection): void => {
    const { notebook } = this;
    if (notebook) {
      switch (direction) {
        case DIRECTION.forward:
          notebook.content.activeCellIndex += 1;
          break;
        case DIRECTION.back:
          notebook.content.activeCellIndex -= 1;
          break;
        case DIRECTION.up:
        case DIRECTION.down:
          console.warn('not implemented yet');
          break;
      }
    }
  };

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

  private get _dockpanel(): DockPanel {
    return (this._shell as any)._dockPanel as DockPanel;
  }

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
    const { notebook, _remote } = this;
    let clearStyles: HTMLElement[] = [];
    if (notebook) {
      notebook.addClass(CSS.deck);
      clearStyles.push(notebook.toolbar.node, notebook.node, notebook.content.node);
    }
    if (_remote) {
      clearStyles.push(_remote.node);
    }
    this._shell.presentationMode = true;
    for (const clear of clearStyles) {
      clear.setAttribute('style', '');
    }
  };

  addDeckStylesLater = () => {
    if (!this._active) {
      return;
    }
    this._shell.update();
    this._shell.fit();
    setTimeout(this.addDeckStyles, 100);
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
