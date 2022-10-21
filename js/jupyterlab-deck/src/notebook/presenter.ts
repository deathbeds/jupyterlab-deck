import { ICellModel } from '@jupyterlab/cells';
import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { toArray } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { JSONExt } from '@lumino/coreutils';
import { ElementExt } from '@lumino/domutils';
import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import {
  DIRECTION,
  IPresenter,
  TDirection,
  CSS,
  IDeckManager,
  TSlideType,
  EMOJI,
  CommandIds,
  DIRECTION_KEYS,
  TCanGoDirection,
  COMPOUND_KEYS,
} from '../tokens';

/** An presenter for working with notebooks */
export class NotebookPresenter implements IPresenter<NotebookPanel> {
  public readonly id = 'notebooks';
  public readonly rank = 100;
  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;
  protected _activeChanged = new Signal<IPresenter<NotebookPanel>, void>(this);
  protected _extents = new Map<INotebookModel, NotebookPresenter.TExtentMap>();

  constructor(options: NotebookPresenter.IOptions) {
    this._manager = options.manager;
    this._commands = options.commands;
    this._addKeyBindings();
  }

  public accepts(widget: Widget): NotebookPanel | null {
    if (widget instanceof NotebookPanel) {
      return widget;
    }
    return null;
  }

  public style(panel: NotebookPanel): void {
    panel.addClass(CSS.deck);
    this._manager.cacheStyle(panel.node);
    this._manager.cacheStyle(panel.content.node);
  }

  public async stop(panel: NotebookPanel): Promise<void> {
    const { _manager } = this;
    const notebookModel = panel.content.model;
    if (notebookModel) {
      this._extents.delete(notebookModel);
    }
    panel.removeClass(CSS.deck);
    _manager.uncacheStyle(panel.content.node);
    _manager.uncacheStyle(panel.node);
    panel.content.activeCellChanged.disconnect(this._onActiveCellChanged, this);
    panel.update();

    const { activeCell } = panel.content;

    if (activeCell) {
      setTimeout(() => {
        if (this._manager.activeWidget !== panel) {
          return;
        }
        ElementExt.scrollIntoViewIfNeeded(panel.content.node, activeCell.node);
      }, 100);
    }
  }

  public async start(panel: NotebookPanel): Promise<void> {
    const { model, content: notebook } = panel;
    if (model) {
      const _watchPanel = async (change: any) => {
        /* istanbul ignore if */
        if (panel.isDisposed) {
          model.stateChanged.disconnect(_watchPanel);
          return;
        }
        await this._onActiveCellChanged(panel.content);
      };
      model.stateChanged.connect(_watchPanel);
    }
    const { model: notebookModel } = notebook;
    if (notebookModel) {
      notebookModel.contentChanged.connect(this._onNotebookContentChanged, this);
    }

    panel.content.activeCellChanged.connect(this._onActiveCellChanged, this);
    await this._onActiveCellChanged(panel.content);
  }

  public get activeChanged(): ISignal<IPresenter<NotebookPanel>, void> {
    return this._activeChanged;
  }

  protected _onNotebookContentChanged(notebookModel: INotebookModel) {
    /* istanbul ignore if */
    if (notebookModel.isDisposed) {
      notebookModel.contentChanged.disconnect(this._onNotebookContentChanged, this);
      return;
    }
    this._extents.delete(notebookModel);
  }

  /** overload the stock notebook keyboard shortcuts */
  protected _addKeyBindings() {
    for (const direction of Object.values(DIRECTION)) {
      this._commands.addKeyBinding({
        command: CommandIds[direction],
        keys: DIRECTION_KEYS[direction],
        selector: `.${CSS.deck} .jp-Notebook.jp-mod-commandMode:focus`,
      });
    }
    for (const [directions, keys] of COMPOUND_KEYS.entries()) {
      const [direction, alternate] = directions;
      this._commands.addKeyBinding({
        command: CommandIds.go,
        args: { direction, alternate },
        keys,
        selector: `.${CSS.deck} .jp-Notebook.jp-mod-commandMode:focus`,
      });
    }
  }

  public canGo(panel: NotebookPanel): Partial<TCanGoDirection> {
    const { activeCellIndex } = panel.content;
    const notebookModel = panel.content.model;
    if (notebookModel) {
      const extents = this._getExtents(notebookModel);
      const activeExtent = extents.get(activeCellIndex);
      if (activeExtent) {
        const { up, down, forward, back } = activeExtent;
        return {
          up: up != null,
          down: down != null,
          forward: forward != null,
          back: back != null,
        };
      }
    }
    return JSONExt.emptyObject;
  }

  /** move around */
  public go = async (
    panel: NotebookPanel,
    direction: TDirection,
    alternate?: TDirection
  ): Promise<void> => {
    const { activeCellIndex } = panel.content;
    const notebookModel = panel.content.model;
    /* istanbul ignore if */
    if (!notebookModel) {
      return;
    }
    const extents = this._getExtents(notebookModel);
    const activeExtent = extents.get(activeCellIndex);

    const fromExtent = activeExtent && activeExtent[direction];
    const fromExtentAlternate = alternate && activeExtent && activeExtent[alternate];

    if (fromExtent != null) {
      panel.content.activeCellIndex = fromExtent;
    } else if (fromExtentAlternate != null) {
      panel.content.activeCellIndex = fromExtentAlternate;
    } else {
      console.warn(
        EMOJI,
        this._manager.__(`Can go "%1" from cell %2`, direction, `${activeCellIndex}`)
      );
    }
  };

  protected async _onActiveCellChanged(notebook: Notebook): Promise<void> {
    const notebookModel = notebook.model;
    /* istanbul ignore if */
    if (!notebookModel) {
      return;
    }
    const extents = this._getExtents(notebookModel);

    const { activeCellIndex, activeCell } = notebook;
    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent) {
      let offset = this._previousActiveCellIndex > activeCellIndex ? -1 : 1;
      notebook.activeCellIndex = activeCellIndex + offset;
      return;
    }

    this._previousActiveCellIndex = activeCellIndex;

    let idx = 0;
    for (const cell of notebook.widgets) {
      if (activeExtent.visible.includes(idx)) {
        cell.addClass(CSS.visible);
        cell.editorWidget.update();
      } else {
        cell.removeClass(CSS.visible);
      }
      if (activeExtent.onScreen.includes(idx)) {
        cell.addClass(CSS.onScreen);
      } else {
        cell.removeClass(CSS.onScreen);
      }
      idx++;
    }

    if (activeCell) {
      ElementExt.scrollIntoViewIfNeeded(notebook.node, activeCell.node);
    }
    this._activeChanged.emit(void 0);
  }

  protected _getSlideType(cell: ICellModel): TSlideType {
    return (
      ((cell.metadata.get('slideshow') || JSONExt.emptyObject) as any)['slide_type'] ||
      null
    );
  }

  protected _initExtent(
    index: number,
    slideType: TSlideType,
    extent: Partial<NotebookPresenter.IExtent> = JSONExt.emptyObject
  ): NotebookPresenter.IExtent {
    return {
      parent: null,
      onScreen: [],
      visible: [],
      notes: [],
      forward: null,
      back: null,
      up: null,
      down: null,
      ...extent,
      index,
      slideType,
    };
  }

  protected _lastOnScreenOf(
    index: number,
    extents: NotebookPresenter.TExtentMap
  ): null | NotebookPresenter.IExtent {
    let e = extents.get(index);
    /* istanbul ignore if */
    if (!e) {
      return null;
    }
    return extents.get(e.onScreen[0]) || null;
  }

  /** Build a cell index (not id) map of what would be on-screen(s) for a given index
   *
   * gather:
   * - the index
   * - what is forward/back/up/down
   *   - fragments advance on down|forward, reverse on up|back
   * - what is onscreen
   * - what is visible
   * - what are the notes
   */
  protected _getExtents(
    notebookModel: INotebookModel | null
  ): NotebookPresenter.TExtentMap {
    /* istanbul ignore if */
    if (!notebookModel) {
      return new Map();
    }
    const cachedExtents = this._extents.get(notebookModel);
    if (cachedExtents && cachedExtents.size) {
      return cachedExtents;
    }
    const extents: NotebookPresenter.TExtentMap = new Map();
    const stacks: Record<NotebookPresenter.TStackType, NotebookPresenter.IExtent[]> = {
      slides: [],
      subslides: [],
      fragments: [],
      nulls: [],
      onScreen: [],
    };

    let index = -1;
    for (const cell of toArray(notebookModel.cells)) {
      index++;
      let slideType = this._getSlideType(cell);
      if (index === 0 && (slideType == null || slideType === 'subslide')) {
        slideType = 'slide';
      }
      let extent = this._initExtent(index, slideType);
      let s0: NotebookPresenter.IExtent | null = stacks.slides[0] || null;
      let ss0: NotebookPresenter.IExtent | null = stacks.subslides[0] || null;
      let f0: NotebookPresenter.IExtent | null = stacks.fragments[0] || null;
      let n0: NotebookPresenter.IExtent | null = stacks.nulls[0] || null;
      let a0 = n0 || f0 || ss0 || s0;
      switch (slideType) {
        case 'skip':
          continue;
        case null:
          if (n0) {
            for (let n of stacks.nulls) {
              n.visible.unshift(index);
            }
            if (!f0) {
              let a = ss0 || s0;
              if (a) {
                a.visible.unshift(index);
              }
            }
            n0.forward = n0.down = index;
            extent.back = extent.up = n0.index;
          } else if (f0) {
            f0.visible.unshift(index);
            f0.forward = f0.down = index;
            extent.back = extent.up = f0.index;
          } else if (ss0) {
            ss0.visible.unshift(index);
            ss0.forward = ss0.down = index;
            extent.back = extent.up = ss0.index;
          } else if (s0) {
            s0.visible.unshift(index);
            s0.forward = s0.down = index;
            extent.back = extent.up = s0.index;
          }
          for (let n of stacks.onScreen) {
            n.onScreen.unshift(index);
          }
          stacks.onScreen.unshift(extent);
          stacks.nulls.unshift(extent);
          extent.onScreen.unshift(
            ...(a0?.onScreen || /* istanbul ignore next */ JSONExt.emptyArray)
          );
          extent.visible.unshift(
            ...(a0?.visible || /* istanbul ignore next */ JSONExt.emptyArray)
          );
          break;
        case 'slide':
          if (stacks.subslides.length && s0) {
            // this is not strictly accurate, needs state for `y` in previous subslide stack
            extent.back = s0.index;
            for (let s of [...stacks.subslides, s0]) {
              let lastOnScreen = this._lastOnScreenOf(s.index, extents);
              if (lastOnScreen) {
                lastOnScreen.forward = index;
              }
            }
          } else if (n0) {
            n0.forward = index;
            extent.back = n0.index;
          } else if (f0) {
            f0.forward = index;
            extent.back = f0.index;
          } else if (s0) {
            let lastOnScreen = this._lastOnScreenOf(s0.index, extents);
            if (lastOnScreen) {
              lastOnScreen.forward = index;
              extent.back = lastOnScreen.index;
            }
          }
          stacks.subslides = [];
          stacks.nulls = [];
          stacks.fragments = [];
          stacks.onScreen = [extent];
          stacks.slides.unshift(extent);
          extent.onScreen.unshift(index);
          extent.visible.unshift(index);
          break;
        case 'subslide':
          if (n0) {
            n0.down = index;
            extent.up = n0.index;
          } else if (f0) {
            f0.down = index;
            extent.up = f0.index;
          } else if (s0) {
            let lastOnScreen = this._lastOnScreenOf(s0.index, extents);
            if (lastOnScreen) {
              lastOnScreen.down = index;
              extent.up = lastOnScreen.index;
            }
            extent.back = s0.back;
          }
          stacks.fragments = [];
          stacks.nulls = [];
          stacks.onScreen = [extent];
          stacks.subslides.unshift(extent);
          extent.onScreen.unshift(index);
          extent.visible.unshift(index);
          break;
        case 'fragment':
          for (let n of stacks.onScreen) {
            n.onScreen.unshift(index);
          }
          stacks.onScreen.unshift(extent);
          if (n0) {
            n0.down = n0.forward = index;
            extent.up = extent.back = n0.index;
          } else if (f0) {
            f0.down = f0.forward = index;
            extent.up = extent.back = f0.index;
          } else if (ss0) {
            ss0.down = ss0.forward = index;
            extent.up = extent.back = ss0.index;
          } else if (s0) {
            s0.down = s0.forward = index;
            extent.up = extent.back = s0.index;
          }
          stacks.nulls = [];
          stacks.onScreen.unshift(extent);
          extent.onScreen.unshift(...(a0?.onScreen || JSONExt.emptyArray));
          extent.visible.unshift(index, ...(a0?.visible || JSONExt.emptyArray));
          stacks.fragments.unshift(extent);
          break;
        case 'notes':
          if (a0) {
            a0.notes.unshift(index);
          }
          break;
      }
      extents.set(index, extent);
    }

    this._extents.set(notebookModel, extents);

    return extents;
  }
}

export namespace NotebookPresenter {
  export interface IOptions {
    manager: IDeckManager;
    commands: CommandRegistry;
  }
  export type TStackType = 'nulls' | 'fragments' | 'slides' | 'subslides' | 'onScreen';
  export interface IExtent {
    slideType: TSlideType;
    parent: IExtent | null;
    index: number;
    up: number | null;
    down: number | null;
    forward: number | null;
    back: number | null;
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
