import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { VDomModel } from '@jupyterlab/apputils';
import { JSONExt } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { drag, D3DragEvent } from 'd3-drag';
import * as d3 from 'd3-selection';

import { IDeckManager, CSS, DATA } from '../tokens';

/** An interactive layer positioner. */
export class Layover extends Widget {
  protected _model: Layover.Model;
  protected _d3: typeof d3 | null = null;
  protected _drag: typeof drag | null = null;

  constructor(options: Layover.IOptions) {
    super(options);
    this.addClass(CSS.layover);
    this._model = new Layover.Model();
    document.body.appendChild(this.node);
    this.model.stateChanged.connect(this.render, this);
    window.addEventListener('resize', this.render);
    document.body.dataset[DATA.layoutMode] = DATA.designing;
    this.render();
  }

  dispose(): void {
    /* istanbul ignore if */
    if (this.isDisposed) {
      return;
    }
    this.model.dispose();
    const { node } = this;
    super.dispose();
    document.body.removeChild(node);
    window.removeEventListener('resize', this.render);
    delete document.body.dataset[DATA.layoutMode];
  }

  render = () => {
    const boxes = d3
      .select(this.node)
      .selectAll(`.${CSS.layoverPart}`)
      .data(this.model.partData, Layover.getPartKey as any)
      .join('div')
      .classed(CSS.layoverPart, true)
      .style('left', ({ bounds }) => `${bounds.left}px`)
      .style('top', ({ bounds }) => `${bounds.top}px`)
      .style('height', ({ bounds }) => `${bounds.height}px`)
      .style('width', ({ bounds }) => `${bounds.width}px`)
      .call(Layover.boxDrag as any);

    boxes
      .selectAll(`.${CSS.layoverPartLabel}`)
      .data((d, i) => [i])
      .join('div')
      .classed(CSS.layoverPartLabel, true)
      .text((d) => d + 1);

    boxes
      .selectAll(`.${CSS.layoverHandle}`)
      .data(Layover.handleData)
      .join('div')
      .attr('class', Layover.getHandleClass)
      .classed(CSS.layoverHandle, true)
      .call(Layover.handleDrag.container(this.node) as any);

    boxes
      .selectAll(`.${CSS.layoverUnstyle}`)
      .data(Layover.resetData)
      .join('button')
      .classed(CSS.layoverUnstyle, true)
      .text('↺')
      .on('click', Layover.onReset as any);
  };

  get model() {
    return this._model;
  }
}

export namespace Layover {
  export interface IOptions extends Widget.IOptions {
    manager: IDeckManager;
  }
  export class Model extends VDomModel {
    private _parts: BasePart[] = [];

    get partData() {
      return this._parts.map(this._partDatum);
    }

    get parts() {
      return this._parts;
    }

    set parts(parts: BasePart[]) {
      this._parts = parts;
      this.stateChanged.emit(void 0);
    }

    protected _partDatum = (part: BasePart) => {
      const { left, top, width, height } = part.node.getBoundingClientRect();
      let zoom = parseFloat(
        window.getComputedStyle(part.node).getPropertyValue('zoom') || '1.0',
      );
      return {
        ...part,
        bounds: {
          left: left * zoom,
          top: top * zoom,
          width: width * zoom,
          height: height * zoom,
        },
      };
    };
  }
  export interface DOMRectLike {
    top: number;
    left: number;
    width: number;
    height: number;
  }
  export interface BasePart {
    key: string;
    node: HTMLElement;
    getStyles(): GlobalStyles | null;
    setStyles(styles: GlobalStyles | null): void;
  }
  export interface Part extends BasePart {
    bounds: DOMRectLike;
  }

  function setStyles(d: Layover.Part) {
    const { bounds } = d;

    const { innerWidth, innerHeight } = window;

    d.setStyles({
      ...(d.getStyles() || JSONExt.emptyObject),
      position: 'fixed',
      left: `${100 * (bounds.left / innerWidth)}%`,
      top: `${100 * (bounds.top / innerHeight)}%`,
      width: `${100 * (bounds.width / innerWidth)}%`,
      height: `${100 * (bounds.height / innerHeight)}%`,
    });
  }

  export function resetData(d: Part) {
    let style = d.getStyles();
    return style && style.position === 'fixed' ? [d] : [];
  }

  export function onReset(event: PointerEvent, d: Layover.Part) {
    let styles = d.getStyles() || JSONExt.emptyObject;
    d.setStyles({
      ...styles,
      position: null as any,
      left: null as any,
      top: null as any,
      width: null as any,
      height: null as any,
    });
  }

  export function getPartKey(d: Part) {
    return d.key;
  }

  export function getHandleClass(h: PartHandle) {
    return `${CSS.layoverHandle}-${h.handle}`;
  }

  function onBoxDragStart(this: HTMLDivElement, event: TPartDrag, d: Layover.Part) {
    d3.select(this).classed(CSS.dragging, true);
  }

  function onBoxDrag(this: HTMLDivElement, event: TPartDrag, d: Layover.Part) {
    d.bounds.left += event.dx;
    d.bounds.top += event.dy;
    d3.select(this)
      .style('left', `${d.bounds.left}px`)
      .style('top', `${d.bounds.top}px`);
  }

  function onBoxDragEnd(this: HTMLDivElement, event: TPartDrag, d: Layover.Part) {
    d3.select(this).classed(CSS.dragging, false);
    setStyles(d);
  }

  export const boxDrag = drag<HTMLDivElement, Layover.Part>()
    .on('start', onBoxDragStart)
    .on('drag', onBoxDrag)
    .on('end', onBoxDragEnd);

  function onHandleDragStart(
    this: HTMLDivElement,
    event: TPartDrag,
    d: Layover.PartHandle,
  ) {
    d3.select(this.parentElement).classed(CSS.dragging, true);
  }

  function onHandleDrag(this: HTMLDivElement, event: TPartDrag, d: Layover.PartHandle) {
    let { dx, dy } = event;
    let { bounds } = d.part;
    let h = d.handle;

    if (h.includes('n')) {
      bounds.top += dy;
      bounds.height -= dy;
    } else if (h.includes('s')) {
      bounds.height += dy;
    }
    if (h.includes('w')) {
      bounds.left += dx;
      bounds.width -= dx;
    } else if (h.includes('e')) {
      bounds.width += dx;
    }

    d3.select(this.parentElement)
      .style('left', `${bounds.left}px`)
      .style('top', `${bounds.top}px`)
      .style('height', `${bounds.height}px`)
      .style('width', `${bounds.width}px`);
  }

  function onHandleDragEnd(
    this: HTMLDivElement,
    event: TPartDrag,
    d: Layover.PartHandle,
  ) {
    d3.select(this.parentElement).classed(CSS.dragging, false);
    setStyles(d.part);
  }

  export const handleDrag = drag<HTMLDivElement, Layover.PartHandle>()
    .on('start', onHandleDragStart)
    .on('drag', onHandleDrag)
    .on('end', onHandleDragEnd);

  export interface PartHandle {
    part: Part;
    handle: THandle;
  }
  export function handleData(part: Part) {
    let handleData: PartHandle[] = [];
    for (const handle of HANDLES) {
      handleData.push({ part, handle });
    }
    return handleData;
  }

  const HANDLES = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const;

  type THandle = (typeof HANDLES)[number];

  type TPartDrag = D3DragEvent<HTMLDivElement, Layover.Part, Layover.Part>;
}
