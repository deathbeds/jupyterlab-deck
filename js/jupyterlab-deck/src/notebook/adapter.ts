import { Cell, ICellModel } from '@jupyterlab/cells';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { Widget } from '@lumino/widgets';

import {
  DIRECTION,
  IDeckAdapter,
  TDirection,
  CSS,
  IDeckManager,
  TSlideType,
  EMOJI,
  CommandIds,
  DIRECTION_KEYS,
} from '../tokens';

/** An adapter for working with notebooks */
export class NotebookAdapter implements IDeckAdapter<NotebookPanel> {
  public readonly id = 'notebooks';
  public readonly rank = 100;
  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;

  constructor(options: NotebookAdapter.IOptions) {
    this._manager = options.manager;
    this._commands = options.commands;
    this._addKeyBindings();
  }

  accepts(widget: Widget): NotebookPanel | null {
    if (widget instanceof NotebookPanel) {
      return widget;
    }
    return null;
  }

  style(notebook: NotebookPanel): void {
    notebook.addClass(CSS.deck);
    this._manager.cacheStyle(notebook.node);
    this._manager.cacheStyle(notebook.content.node);
  }

  async stop(notebook: NotebookPanel): Promise<void> {
    const { _manager } = this;
    notebook.removeClass(CSS.deck);
    _manager.uncacheStyle(notebook.content.node);
    _manager.uncacheStyle(notebook.node);
    notebook.content.activeCellChanged.disconnect(this._onActiveCellChanged, this);
    notebook.update();
  }

  async start(notebook: NotebookPanel): Promise<void> {
    notebook.content.activeCellChanged.connect(this._onActiveCellChanged, this);
    if (notebook.content.activeCell) {
      await this._onActiveCellChanged(notebook.content, notebook.content.activeCell);
    }
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
        this._manager.__('Fallback transition'),
        activeCellIndex,
        direction
      );
      switch (direction) {
        case 'up':
        case 'back':
          notebook.content.activeCellIndex--;
          break;
        case 'forward':
        case 'down':
          notebook.content.activeCellIndex++;
          break;
        default:
          console.error(
            EMOJI,
            this._manager.__('Unhandled transition'),
            activeCellIndex,
            direction
          );
          break;
      }
    }
  };

  protected async _onActiveCellChanged(
    notebook: Notebook,
    cell: Cell<ICellModel>
  ): Promise<void> {
    const extents = this._getExtents(notebook);

    const { activeCellIndex } = notebook;
    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent) {
      let offset = this._previousActiveCellIndex > activeCellIndex ? -1 : 1;
      notebook.activeCellIndex = activeCellIndex + offset;
      return;
    }
    console.warn(
      this._previousActiveCellIndex,
      activeCellIndex,
      activeExtent.onScreen,
      activeExtent.visible
    );

    this._previousActiveCellIndex = activeCellIndex;

    let idx = 0;
    for (const cell of notebook.widgets) {
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

  protected _startExtent(
    index: number,
    slideType: TSlideType,
    extent: Partial<NotebookAdapter.IExtent> = {}
  ): NotebookAdapter.IExtent {
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
    extents: NotebookAdapter.TExtentMap
  ): null | NotebookAdapter.IExtent {
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
  protected _getExtents(notebook: Notebook): NotebookAdapter.TExtentMap {
    const extents: NotebookAdapter.TExtentMap = new Map();
    const stacks: Record<string, NotebookAdapter.IExtent[]> = {
      slides: [],
      subslides: [],
      fragments: [],
    };

    let index = -1;
    for (const cell of notebook.widgets) {
      index++;
      let slideType = this._getSlideType(cell);
      let extent = this._startExtent(index, slideType);
      let s0: NotebookAdapter.IExtent | null = stacks.slides[0];
      let ss0: NotebookAdapter.IExtent | null = stacks.subslides[0];
      let f0: NotebookAdapter.IExtent | null = stacks.fragments[0];
      let a0 = f0 || ss0 || s0;
      if (index === 0 && (slideType == null || slideType === 'subslide')) {
        slideType = 'slide';
      }
      switch (slideType) {
        case 'skip':
          continue;
        case null:
          if (f0) {
            for (let f of stacks.fragments) {
              f.onScreen.unshift(index);
            }
            f0.visible.unshift(index);
            f0.forward = f0.down = index;
            extent.back = extent.up = f0.index;
          } else if (ss0) {
            ss0.onScreen.unshift(index);
            ss0.visible.unshift(index);
            ss0.forward = index;
            extent.forward = extent.down = ss0.index;
          } else if (s0) {
            s0.onScreen.unshift(index);
            s0.visible.unshift(index);
            s0.forward = s0.down = index;
          }
          stacks.fragments.unshift(extent);
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
          } else if (f0 && s0) {
            f0.forward = index;
            extent.back = f0.index;
          } else if (s0) {
            let lastOnScreen = this._lastOnScreenOf(s0.index, extents);
            if (lastOnScreen) {
              lastOnScreen.forward = index;
              extent.back = lastOnScreen.index;
            }
          }
          stacks.fragments = [];
          stacks.subslides = [];
          stacks.slides.unshift(extent);
          extent.onScreen.unshift(index);
          extent.visible.unshift(index);
          break;
        case 'subslide':
          if (f0) {
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
          stacks.subslides.unshift(extent);
          extent.onScreen.unshift(index);
          extent.visible.unshift(index);
          break;
        case 'fragment':
          if (f0) {
            f0.down = f0.forward = index;
            extent.back = f0.index;
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
          extent.onScreen.unshift(...(a0?.onScreen || []));
          extent.visible.unshift(index, ...(a0?.visible || []));
          stacks.fragments.unshift(extent);
          break;
        case 'notes':
          if (f0) {
            f0.notes.push(index);
          } else if (ss0) {
            ss0.notes.push(index);
          } else if (s0) {
            s0.notes.push(index);
          }
          break;
      }
      extents.set(index, extent);
    }
    return extents;
  }
}

export namespace NotebookAdapter {
  export interface IOptions {
    manager: IDeckManager;
    commands: CommandRegistry;
  }
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
