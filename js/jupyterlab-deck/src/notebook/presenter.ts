import { ISettings, Stylist } from '@deathbeds/jupyterlab-fonts';
import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { Cell, ICellModel } from '@jupyterlab/cells';
import {
  INotebookModel,
  INotebookTools,
  Notebook,
  NotebookPanel,
} from '@jupyterlab/notebook';
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
  META,
  ICellDeckMetadata,
  TLayerScope,
} from '../tokens';
import type { Layover } from '../tools/layover';

import { NotebookMetaTools } from './metadata';

const emptyMap = Object.freeze(new Map());

/** An presenter for working with notebooks */
export class NotebookPresenter implements IPresenter<NotebookPanel> {
  public readonly id = 'notebooks';
  public readonly rank = 100;
  public readonly capabilities = {
    layout: true,
    slideType: true,
    layerScope: true,
    stylePart: true,
    styleDeck: true,
  };

  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;
  protected _activeChanged = new Signal<IPresenter<NotebookPanel>, void>(this);
  protected _extents = new Map<INotebookModel, NotebookPresenter.TExtentMap>();
  protected _layers = new Map<INotebookModel, NotebookPresenter.TLayerMap>();

  constructor(options: NotebookPresenter.IOptions) {
    this._manager = options.manager;
    this._commands = options.commands;
    this._makeDeckTools(options.notebookTools);
    this._addKeyBindings();
    this._addWindowListeners();
  }

  public accepts(widget: Widget): NotebookPanel | null {
    if (widget instanceof NotebookPanel) {
      return widget;
    }
    return null;
  }

  public style(panel: NotebookPanel): void {
    panel.addClass(CSS.deck);
    this._manager.cacheStyle(panel.node, panel.content.node);
  }

  public async stop(panel: NotebookPanel): Promise<void> {
    const notebookModel = panel.content.model;
    if (notebookModel) {
      this._extents.delete(notebookModel);
      this._layers.delete(notebookModel);
    }
    this._removeStyle(panel);
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
    this._forceStyle();
  }

  public get activeChanged(): ISignal<IPresenter<NotebookPanel>, void> {
    return this._activeChanged;
  }

  public getSlideType(panel: NotebookPanel): TSlideType {
    let { activeCell } = panel.content;
    if (activeCell) {
      const meta = (activeCell.model.metadata.get(META.slideshow) || {}) as any;
      return (meta[META.slideType] || null) as TSlideType;
    }
    return null;
  }

  public setSlideType(panel: NotebookPanel, slideType: TSlideType): void {
    let { activeCell } = panel.content;
    /* istanbul ignore if */
    if (!activeCell) {
      return;
    }
    let oldMeta =
      (activeCell.model.metadata.get(META.slideshow) as Record<string, any>) || null;
    if (slideType == null) {
      if (oldMeta == null) {
        activeCell.model.metadata.delete(META.slideshow);
      } else {
        activeCell.model.metadata.set(META.slideshow, {
          ...oldMeta,
          [META.slideType]: slideType,
        });
      }
    } else {
      if (oldMeta == null) {
        oldMeta = {};
      }
      activeCell.model.metadata.set(META.slideshow, {
        ...oldMeta,
        [META.slideType]: slideType,
      });
    }
    if (panel.content.model) {
      this._onNotebookContentChanged(panel.content.model);
    }
    void this._onActiveCellChanged(panel.content);
  }

  public getLayerScope(panel: NotebookPanel): string | null {
    let { activeCell } = panel.content;
    if (activeCell) {
      const meta = (activeCell.model.metadata.get(META.deck) || {}) as any;
      return (meta[META.layer] || null) as TLayerScope;
    }
    return null;
  }

  public setLayerScope(panel: NotebookPanel, layerScope: TLayerScope): void {
    let { activeCell } = panel.content;
    if (!activeCell) {
      return;
    }
    let oldMeta =
      (activeCell.model.metadata.get(META.deck) as Record<string, any>) || null;
    if (layerScope == null) {
      if (oldMeta == null) {
        activeCell.model.metadata.delete(META.layer);
      } else {
        activeCell.model.metadata.set(META.deck, {
          ...oldMeta,
          [META.layer]: layerScope,
        });
      }
    } else {
      if (oldMeta == null) {
        oldMeta = {};
      }
      activeCell.model.metadata.set(META.deck, {
        ...oldMeta,
        [META.layer]: layerScope,
      });
    }
    if (panel.content.model) {
      this._onNotebookContentChanged(panel.content.model);
    }
    void this._onActiveCellChanged(panel.content);
  }

  public getPartStyles(panel: NotebookPanel): GlobalStyles | null {
    let { activeCell } = panel.content;
    if (!activeCell) {
      return null;
    }
    return this._getCellStyles(activeCell);
  }

  public setPartStyles(panel: NotebookPanel, styles: GlobalStyles | null): void {
    let { activeCell } = panel.content;
    /* istanbul ignore if */
    if (!activeCell) {
      return;
    }
    return this._setCellStyles(activeCell, styles);
  }

  public preparePanel(panel: NotebookPanel) {
    let notebook = panel.content;
    let oldSetFragment = notebook.setFragment;
    notebook.setFragment = (fragment: string): void => {
      oldSetFragment.call(notebook, fragment);
      if (this._manager.activePresenter === this) {
        void Promise.all(notebook.widgets.map((widget) => widget.ready)).then(() => {
          this._activateByAnchor(notebook, fragment);
        });
      }
    };
  }

  protected _makeDeckTools(notebookTools: INotebookTools) {
    const tool = new NotebookMetaTools({ manager: this._manager, notebookTools });
    notebookTools.addItem({ tool, section: 'common', rank: 3 });
  }

  protected _addWindowListeners() {
    window.addEventListener('hashchange', this._onHashChange);
  }

  protected _onHashChange = (event: HashChangeEvent) => {
    const { activeWidget } = this._manager;
    const panel = activeWidget && this.accepts(activeWidget);
    /* istanbul ignore if */
    if (!panel) {
      return;
    }
    const url = new URL(event.newURL);
    const { hash } = url || '#';
    /* istanbul ignore if */
    if (hash === '#') {
      return;
    }
    this._activateByAnchor(panel.content, hash);
  };

  protected _activateByAnchor(notebook: Notebook, fragment: string) {
    const anchored = document.getElementById(fragment.slice(1));
    /* istanbul ignore if */
    if (!anchored || !notebook.node.contains(anchored)) {
      return;
    }
    let i = -1;
    let cellCount = notebook.widgets.length;
    while (i < cellCount) {
      i++;
      let cell = notebook.widgets[i];
      if (cell.node.contains(anchored)) {
        notebook.activeCellIndex = i;
        return;
      }
    }
  }

  protected _onNotebookContentChanged(notebookModel: INotebookModel) {
    /* istanbul ignore if */
    if (notebookModel.isDisposed) {
      notebookModel.contentChanged.disconnect(this._onNotebookContentChanged, this);
      return;
    }
    this._extents.delete(notebookModel);
    this._layers.delete(notebookModel);
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
    let { activeCellIndex, activeCell } = panel.content;
    const notebookModel = panel.content.model;
    let activeExtent: NotebookPresenter.IExtent | null = null;
    if (notebookModel) {
      const extents = this._getExtents(notebookModel);
      activeExtent = extents.get(activeCellIndex) || null;
      if (!activeExtent && activeCell) {
        let meta = this._getCellDeckMetadata(activeCell.model);
        if (meta.layer) {
          while (!activeExtent && activeCellIndex) {
            activeCellIndex--;
            activeExtent = extents.get(activeCellIndex) || null;
          }
        }
      }
    }

    if (activeExtent) {
      const { up, down, forward, back } = activeExtent;
      return {
        up: up != null,
        down: down != null,
        forward: forward != null,
        back: back != null,
      };
    }
    return JSONExt.emptyObject;
  }

  /** move around */
  public go = async (
    panel: NotebookPanel,
    direction: TDirection,
    alternate?: TDirection
  ): Promise<void> => {
    const notebookModel = panel.content.model;
    /* istanbul ignore if */
    if (!notebookModel) {
      return;
    }
    let { activeCellIndex, activeCell } = panel.content;

    const extents = this._getExtents(notebookModel);
    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent && activeCell) {
      let meta = this._getCellDeckMetadata(activeCell.model);
      if (!meta.layer && direction === 'up') {
        return;
      }
      while (!activeExtent && activeCellIndex) {
        activeCellIndex--;
        activeExtent = extents.get(activeCellIndex);
      }
    }

    const fromExtent = activeExtent && activeExtent[direction];
    const fromExtentAlternate = alternate && activeExtent && activeExtent[alternate];

    if (fromExtent != null) {
      panel.content.activeCellIndex = fromExtent;
    } else if (fromExtentAlternate != null) {
      panel.content.activeCellIndex = fromExtentAlternate;
    } else {
      console.warn(
        EMOJI,
        this._manager.__(`Cannot go "%1" from cell %2`, direction, `${activeCellIndex}`)
      );
    }
  };

  protected _removeStyle(panel: NotebookPanel) {
    if (panel.isDisposed) {
      return;
    }
    const { _manager } = this;
    panel.removeClass(CSS.deck);
    _manager.uncacheStyle(panel.content.node, panel.node);
    for (const cell of panel.content.widgets) {
      cell.removeClass(CSS.layer);
      cell.removeClass(CSS.onScreen);
      cell.removeClass(CSS.visible);
      cell.node.setAttribute('style', '');
    }
  }

  protected async _onActiveCellChanged(notebook: Notebook): Promise<void> {
    const notebookModel = notebook.model;
    /* istanbul ignore if */
    if (!notebookModel || this._manager.activeWidget !== notebook.parent) {
      return;
    }
    const extents = this._getExtents(notebookModel);
    const layers = this._getLayers(notebookModel, extents);

    let { activeCellIndex } = notebook;

    let cell = notebookModel.cells.get(activeCellIndex);

    let layerIndex: number | null = null;

    if (cell) {
      let meta = this._getCellDeckMetadata(cell);
      if (meta && meta.layer) {
        layerIndex = activeCellIndex;
      }
    }

    let activeExtent = extents.get(activeCellIndex);

    if (!activeExtent) {
      if (layerIndex == null) {
        let offset = this._previousActiveCellIndex > activeCellIndex ? -1 : 1;
        notebook.activeCellIndex = activeCellIndex + offset;
        return;
      } else {
        while (activeCellIndex) {
          activeCellIndex--;
          activeExtent = extents.get(activeCellIndex);
          if (activeExtent) {
            break;
          }
        }
      }
    }

    if (!activeExtent) {
      return;
    }

    this._previousActiveCellIndex = activeCellIndex;

    let idx = -1;

    let activeLayers = layers.get(activeCellIndex) || [];

    idx = -1;

    let { layover } = this._manager;

    let onScreen: Layover.BasePart[] = [];

    for (const cell of notebook.widgets) {
      idx++;

      if (activeLayers.includes(idx)) {
        cell.addClass(CSS.layer);
        cell.addClass(CSS.onScreen);
        cell.addClass(CSS.visible);
        if (layover) {
          onScreen.push(this._toLayoutPart(cell));
        }
      } else {
        cell.removeClass(CSS.layer);
        if (activeExtent.visible.includes(idx)) {
          cell.addClass(CSS.visible);
          cell.editorWidget.update();
        } else {
          cell.removeClass(CSS.visible);
        }
        if (activeExtent.onScreen.includes(idx)) {
          cell.addClass(CSS.onScreen);
          if (layover) {
            onScreen.push(this._toLayoutPart(cell));
          }
        } else {
          cell.removeClass(CSS.onScreen);
        }
      }
    }

    ElementExt.scrollIntoViewIfNeeded(
      notebook.node,
      notebook.widgets[activeCellIndex].node
    );
    this._activeChanged.emit(void 0);
    if (this._manager.layover) {
      this._manager.layover.model.parts = onScreen;
    }
  }

  protected _forceStyle() {
    let panel = this._manager.activeWidget;
    if (!panel || !(panel instanceof NotebookPanel)) {
      return;
    }
    let stylist = (this._manager.fonts as any)._stylist as Stylist;
    let meta = panel.model?.metadata.get(META.fonts) || JSONExt.emptyObject;
    stylist.stylesheet(meta as ISettings, panel);
    this._manager.layover?.render();
  }

  protected _toLayoutPart(cell: Cell<ICellModel>): Layover.BasePart {
    return {
      key: cell.model.id,
      node: cell.node,
      getStyles: () => this._getCellStyles(cell),
      setStyles: (styles: GlobalStyles | null) => this._setCellStyles(cell, styles),
    };
  }

  protected _getCellStyles(cell: Cell<ICellModel>) {
    try {
      const meta = cell.model.metadata.get(META.fonts) as any;
      const styles = meta.styles[META.nullSelector][META.presentingCell];
      return styles;
    } catch {
      return JSONExt.emptyObject;
    }
  }

  protected _setCellStyles(cell: Cell<ICellModel>, styles: GlobalStyles | null) {
    let meta = (cell.model.metadata.get(META.fonts) || {}) as ISettings;
    if (!meta.styles) {
      meta.styles = {};
    }
    if (!meta.styles[META.nullSelector]) {
      meta.styles[META.nullSelector] = {};
    }
    (meta.styles[META.nullSelector] as any)[META.presentingCell] = styles;
    cell.model.metadata.set(META.fonts, JSONExt.emptyObject as any);
    cell.model.metadata.set(META.fonts, { ...meta } as any);
    this._forceStyle();
  }

  /** Get the nbconvert-compatible `slide_type` from metadata. */
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

  /** Get layer metadata from `jupyterlab-deck` namespace */
  protected _getCellDeckMetadata(cell: ICellModel): ICellDeckMetadata {
    return (cell.metadata.get(META.deck) ||
      JSONExt.emptyObject) as any as ICellDeckMetadata;
  }

  _numSort(a: number, b: number): number {
    return a - b;
  }

  protected _getLayers(
    notebookModel: INotebookModel | null,
    extents: NotebookPresenter.TExtentMap
  ): NotebookPresenter.TLayerMap {
    if (!notebookModel) {
      return emptyMap;
    }

    let cachedLayers = this._layers.get(notebookModel);

    if (cachedLayers) {
      return cachedLayers;
    }

    let layers = new Map<number, number[]>();
    // layers visible on this extent
    let extentLayers: number[] | null;

    let extentTypes = {
      slide: [],
      subslide: [],
      fragment: [],
      _anySlide: [],
      _anyFragment: [],
      null: [],
    };
    for (let extent of extents.values()) {
      let etype = (extentTypes as any)[extent.slideType || 'null'];
      if (etype) {
        etype.push(extent.index);
      }
    }

    extentTypes._anySlide = [...extentTypes.slide, ...extentTypes.subslide];
    extentTypes._anyFragment = [
      ...extentTypes._anySlide,
      ...extentTypes.fragment,
      ...extentTypes.null,
    ];
    for (let key in extentTypes) {
      (extentTypes as any)[key].sort(this._numSort);
    }

    let extentIndexes = [...extents.keys()];
    extentIndexes.sort(this._numSort);

    let i = -1;
    let j = -1;
    let prev = -1;
    let start = -1;
    let end = -1;

    for (const cell of toArray(notebookModel.cells)) {
      i++;
      let { layer } = this._getCellDeckMetadata(cell);
      if (!layer) {
        continue;
      }
      start = extentIndexes[0];
      for (j of extentIndexes) {
        if (j > i) {
          start = prev;
          break;
        }
        prev = j;
      }
      prev = end = -1;
      switch (layer) {
        case 'deck':
          end = extentIndexes.slice(-1)[0];
          break;
        case 'stack':
          // visible until the next `slide`
          for (j of extentTypes.slide) {
            if (j > start) {
              end = j - 1;
              break;
            }
          }
          break;
        case 'slide':
          // visible until the next `slide`/`subslide`
          for (j of extentTypes._anySlide) {
            if (j > start) {
              end = j - 1;
              break;
            }
          }
          break;
        case 'fragment':
          // visible until the next `fragment`
          for (j of extentTypes._anyFragment) {
            if (j > start) {
              end = j - 1;
              break;
            }
          }
          break;
        default:
          break;
      }

      for (let extentIndex of extentIndexes) {
        if (extentIndex >= start && extentIndex <= end) {
          extentLayers = layers.get(extentIndex) || null;
          if (extentLayers != null) {
            extentLayers.push(i);
          } else {
            extentLayers = [i];
            layers.set(extentIndex, extentLayers);
          }
        }
      }
    }

    this._layers.set(notebookModel, layers);

    return layers;
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
      return emptyMap;
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
      let { layer } = this._getCellDeckMetadata(cell);
      if (layer) {
        slideType = 'skip';
      } else if (index === 0 && (slideType == null || slideType === 'subslide')) {
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
    notebookTools: INotebookTools;
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
  /** a map of active slide to active layers */
  export type TLayerMap = Map<number, number[]>;
  export type TExtentIndexMap = Map<TSlideType, number[]>;
}
