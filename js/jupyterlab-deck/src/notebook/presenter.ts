import { Cell } from '@jupyterlab/cells';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
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
} from '../tokens';

/** An presenter for working with notebooks */
export class NotebookPresenter implements IPresenter<NotebookPanel> {
  public readonly id = 'notebooks';
  public readonly rank = 100;
  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;
  protected _activeChanged = new Signal<IPresenter<NotebookPanel>, void>(this);

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

  public style(notebook: NotebookPanel): void {
    notebook.addClass(CSS.deck);
    this._manager.cacheStyle(notebook.node);
    this._manager.cacheStyle(notebook.content.node);
  }

  public async stop(notebook: NotebookPanel): Promise<void> {
    const { _manager } = this;
    notebook.removeClass(CSS.deck);
    _manager.uncacheStyle(notebook.content.node);
    _manager.uncacheStyle(notebook.node);
    notebook.content.activeCellChanged.disconnect(this._onActiveCellChanged, this);
    notebook.update();
  }

  public async start(notebook: NotebookPanel): Promise<void> {
    const { model } = notebook;
    if (model) {
      const _watchModel = async () => {
        if (notebook.isDisposed) {
          model.stateChanged.disconnect(_watchModel);
          return;
        }
        await this._onActiveCellChanged(notebook.content);
      };
      model.stateChanged.connect(_watchModel);
    }
    notebook.content.activeCellChanged.connect(this._onActiveCellChanged, this);
    await this._onActiveCellChanged(notebook.content);
  }

  public get activeChanged(): ISignal<IPresenter<NotebookPanel>, void> {
    return this._activeChanged;
  }

  /** overload the stock notebook keyboard shortcuts */
  protected _addKeyBindings() {
    for (const direction of Object.values(DIRECTION)) {
      this._commands.addKeyBinding({
        command: CommandIds[direction],
        args: {},
        keys: DIRECTION_KEYS[direction],
        selector: `.${CSS.deck} .jp-Notebook.jp-mod-commandMode:focus`,
      });
    }
  }

  public canGo(notebook: NotebookPanel): Partial<TCanGoDirection> {
    const { activeCellIndex } = notebook.content;
    const extents = this._getExtents(notebook.content);
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
    return {};
  }

  /** move around */
  public go = async (notebook: NotebookPanel, direction: TDirection): Promise<void> => {
    const { activeCellIndex } = notebook.content;
    const extents = this._getExtents(notebook.content);
    const activeExtent = extents.get(activeCellIndex);

    const fromExtent = activeExtent && activeExtent[direction];

    if (fromExtent != null) {
      notebook.content.activeCellIndex = fromExtent;
    } else {
      console.warn(
        EMOJI,
        this._manager.__(`Can go "%1" from cell %2`, direction, `${activeCellIndex}`)
      );
    }
  };

  protected async _onActiveCellChanged(notebook: Notebook): Promise<void> {
    console.log(notebook.widgets.length, notebook.model?.cells.length);
    const extents = this._getExtents(notebook);

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

  protected _getSlideType(cell: Cell): TSlideType {
    return ((cell.model.metadata.get('slideshow') || {}) as any)['slide_type'] || null;
  }

  protected _initExtent(
    index: number,
    slideType: TSlideType,
    extent: Partial<NotebookPresenter.IExtent> = {}
  ): NotebookPresenter.IExtent {
    return {
      index,
      slideType,
      parent: extent.parent ? extent.parent : null,
      onScreen: extent.onScreen != null ? extent.onScreen : [],
      visible: extent.visible ? extent.visible : [],
      notes: [],
      forward: extent.forward != null ? extent.forward : null,
      back: extent.back != null ? extent.back : null,
      up: extent.up != null ? extent.up : null,
      down: extent.down != null ? extent.down : null,
    };
  }

  protected _lastOnScreenOf(
    index: number,
    extents: NotebookPresenter.TExtentMap
  ): null | NotebookPresenter.IExtent {
    let e = extents.get(index);
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
  protected _getExtents(notebook: Notebook): NotebookPresenter.TExtentMap {
    const extents: NotebookPresenter.TExtentMap = new Map();
    const stacks: Record<NotebookPresenter.TStackType, NotebookPresenter.IExtent[]> = {
      slides: [],
      subslides: [],
      fragments: [],
      nulls: [],
    };

    let index = -1;
    for (const cell of notebook.widgets) {
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
            for (let n of [...stacks.nulls, ...stacks.fragments, ss0 || s0]) {
              n.onScreen.unshift(index);
            }
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
            for (let f of [...stacks.fragments, ss0 || s0]) {
              f.onScreen.unshift(index);
            }
            f0.forward = f0.down = index;
            extent.back = extent.up = f0.index;
          } else if (ss0) {
            ss0.onScreen.unshift(index);
            ss0.visible.unshift(index);
            ss0.forward = index;
            extent.back = extent.up = ss0.index;
          } else if (s0) {
            s0.onScreen.unshift(index);
            s0.visible.unshift(index);
            s0.forward = s0.down = index;
            extent.back = extent.up = s0.index;
          }
          stacks.nulls.unshift(extent);
          extent.onScreen.unshift(...(a0?.onScreen || []));
          extent.visible.unshift(...(a0?.visible || []));
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
            s0.down = index;
            extent.up = s0.index;
            if (s0.back != null) {
              extent.back = s0.back;
            }
          }
          stacks.fragments = [];
          stacks.nulls = [];
          stacks.subslides.unshift(extent);
          extent.onScreen.unshift(index);
          extent.visible.unshift(index);
          break;
        case 'fragment':
          if (n0) {
            n0.down = n0.forward = index;
            extent.up = extent.back = n0.index;
            for (let n of [...stacks.nulls, ...stacks.fragments, ss0 || s0]) {
              n.onScreen.unshift(index);
            }
          } else if (f0) {
            f0.down = f0.forward = index;
            extent.up = extent.back = f0.index;
            for (let f of [...stacks.fragments, ss0 || s0]) {
              f.onScreen.unshift(index);
            }
          } else if (ss0) {
            ss0.onScreen.unshift(index);
            ss0.down = ss0.forward = index;
            extent.up = extent.back = ss0.index;
          } else if (s0) {
            s0.onScreen.unshift(index);
            s0.down = s0.forward = index;
            extent.up = extent.back = s0.index;
          }
          stacks.nulls = [];
          extent.onScreen.unshift(...(a0?.onScreen || []));
          extent.visible.unshift(index, ...(a0?.visible || []));
          stacks.fragments.unshift(extent);
          break;
        case 'notes':
          if (a0) {
            a0.notes.push(index);
          }
          break;
      }
      extents.set(index, extent);
    }
    return extents;
  }
}

export namespace NotebookPresenter {
  export interface IOptions {
    manager: IDeckManager;
    commands: CommandRegistry;
  }
  export type TStackType = 'nulls' | 'fragments' | 'slides' | 'subslides';
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
