import { VDomModel } from '@jupyterlab/apputils';
import { ICellModel } from '@jupyterlab/cells';
import { Widget } from '@lumino/widgets';
import { drag, DragBehavior } from 'd3-drag';

/** An interactive layer positioner. */
export class Layover extends Widget {
  protected _drag: DragBehavior<any, any, any>;
  protected _model: Layover.Model;

  constructor(options: Layover.IOptions) {
    super(options);
    this._drag = drag();
    this._model = new Layover.Model();
  }

  get model() {
    return this._model;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.model.dispose();
  }
}

export namespace Layover {
  export interface IOptions extends Widget.IOptions {
    // nothing yet
  }
  export class Model extends VDomModel {
    private _cells: ICellModel[] = [];
    get cells() {
      return this._cells;
    }
    set cells(cells: ICellModel[]) {
      this._cells = cells;
      this.stateChanged.emit(void 0);
    }
    emit = (): void => {
      this.stateChanged.emit(void 0);
    };
  }
}
