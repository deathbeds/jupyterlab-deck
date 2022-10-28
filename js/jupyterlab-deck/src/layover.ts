import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { VDomModel } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import type { drag } from 'd3-drag';
import type * as d3 from 'd3-selection';

import { IDeckManager, CSS, TLayoutType } from './tokens';

const HANDLES = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

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
  }

  async init() {
    let { drag } = await import('d3-drag');
    this._drag = drag;
    this._d3 = await import('d3-selection');
    this.model.stateChanged.connect(this.render, this);
    this.render();
  }

  render = () => {
    let { _d3, _drag } = this;
    if (!_d3 || !_drag) {
      return;
    }

    const boxes = _d3
      .select(this.node)
      .selectAll(`.${CSS.layoverPart}`)
      .data(this.model.partData)
      .join('div')
      .classed(CSS.layoverPart, true)
      .style('left', ({ bounds }) => `${bounds.left}px`)
      .style('top', ({ bounds }) => `${bounds.top}px`)
      .style('height', ({ bounds }) => `${bounds.height}px`)
      .style('width', ({ bounds }) => `${bounds.width}px`);

    boxes
      .selectAll(`.${CSS.layoverHandle}`)
      .data(HANDLES)
      .join('div')
      .attr('class', (h) => `${CSS.layoverHandle}-${h}`)
      .classed(CSS.layoverHandle, true);
  };

  get model() {
    return this._model;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.model.dispose();
    const { node } = this;
    super.dispose();
    node.parentElement?.removeChild(node);
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

    protected emit = (): void => {
      this.stateChanged.emit(void 0);
    };

    protected _partDatum = (part: BasePart) => {
      let bounds = part.node.getBoundingClientRect();
      let styles = part.getStyles();
      return { ...part, styles, bounds };
    };
  }
  export interface BasePart {
    node: HTMLElement;
    getStyles(): GlobalStyles | null;
    setStyles(styles: GlobalStyles | null): void;
    getType(): TLayoutType;
    setType(layoutType: TLayoutType): void;
  }
  export interface Part extends BasePart {
    bounds: DOMRect;
    styles: GlobalStyles | null;
  }
}
