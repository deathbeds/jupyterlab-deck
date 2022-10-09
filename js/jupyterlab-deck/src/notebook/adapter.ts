import { Cell, ICellModel } from '@jupyterlab/cells';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';

import {
  DIRECTION,
  IDeckAdapter,
  TDirection,
  CSS,
  IDeckManager,
  TSlideType,
  EMOJI,
} from '../tokens';

/** An adapter for working with notebooks */
export class NotebookAdapter implements IDeckAdapter<NotebookPanel> {
  public readonly id = 'notebooks';
  public readonly rank = 100;
  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;

  constructor(options: NotebookAdapter.IOptions) {
    this._manager = options.manager;
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

  /** move around */
  public go = async (notebook: NotebookPanel, direction: TDirection): Promise<void> => {
    switch (direction) {
      case DIRECTION.forward:
        notebook.content.activeCellIndex += 1;
        break;
      case DIRECTION.back:
        notebook.content.activeCellIndex -= 1;
        break;
      case DIRECTION.up:
      case DIRECTION.down:
        console.warn(
          EMOJI + this._manager.__('Going "%1" in Deck not implemented yet', direction)
        );
        break;
    }
  };

  protected async _onActiveCellChanged(
    notebook: Notebook,
    cell: Cell<ICellModel>
  ): Promise<void> {
    const extents = this._getNotebookExtents(notebook);

    const { activeCellIndex } = notebook;
    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent) {
      let offset = this._previousActiveCellIndex > activeCellIndex ? -1 : 1;
      notebook.activeCellIndex = activeCellIndex + offset;
      return;
    }

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

  /** Build a model of what would be on-screen(s) for a given index */
  protected _getNotebookExtents(notebook: Notebook): NotebookAdapter.TExtentMap {
    let idx = 0;
    let extents: NotebookAdapter.TExtentMap = new Map();
    let currentSlide: NotebookAdapter.IExtent = {
      onScreen: [],
      visible: [],
      notes: [],
    };
    let currentExtents: NotebookAdapter.TExtentMap = new Map();
    let fragmentExtent: NotebookAdapter.IExtent | null = null;
    let nullExtent: NotebookAdapter.IExtent | null = null;
    let lastAnnotated = -1;
    for (const cell of notebook.widgets) {
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
}

export namespace NotebookAdapter {
  export interface IOptions {
    manager: IDeckManager;
  }
  export interface IExtent {
    onScreen: number[];
    visible: number[];
    notes: number[];
  }
  export type TExtentMap = Map<number, IExtent>;
}
