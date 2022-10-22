import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { INotebookTools, NotebookTools } from '@jupyterlab/notebook';
import { JSONExt, ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { PanelLayout } from '@lumino/widgets';
import React from 'react';

import { ICONS } from '../icons';
import {
  IDeckManager,
  CSS,
  LAYER_TITLES,
  ICellDeckMetadata,
  META,
  TLayerScope,
  LAYER_SCOPES,
  ID,
} from '../tokens';

export class NotebookDeckTools extends NotebookTools.Tool {
  constructor(options: NotebookDeckTools.IOptions) {
    super();
    const layout = new PanelLayout();
    this._model = new DeckCellEditor.Model(options);
    this._notebookTools = options.notebookTools;
    layout.addWidget(new DeckCellEditor(this._model));
    this.layout = layout;
    this.addClass(CSS.metaTool);
  }
  protected onActiveCellChanged(): void {
    this._model.activeCell = this._notebookTools.activeCell;
  }

  protected onActiveCellMetadataChanged(): void {
    this._model.update();
  }

  protected _model: DeckCellEditor.Model;
  protected _notebookTools: INotebookTools;
}

export namespace NotebookDeckTools {
  export interface IOptions {
    manager: IDeckManager;
    notebookTools: INotebookTools;
  }
}

export class DeckCellEditor extends VDomRenderer<DeckCellEditor.Model> {
  protected render(): JSX.Element {
    const m = this.model;
    const { activeMeta, manager } = m;
    const { __ } = manager;

    const layer = activeMeta?.layer || '-';

    return (
      <div>
        <label
          title={__('Display this cell as an out-of-order layer.')}
          htmlFor={ID.layerSelect}
        >
          {__('Layer')}
          <ICONS.deckStart.react tag="span" height={16} />
          <div className={CSS.selectWrapper}>
            <select
              className={CSS.styled}
              value={layer}
              onChange={this.model.onLayerChange}
              id={ID.layerSelect}
            >
              {this.layerOptions(__)}
            </select>
          </div>
        </label>
      </div>
    );
  }

  layerOptions(__: any): JSX.Element[] {
    const layerOptions: JSX.Element[] = [];

    for (const [layerValue, layerTitle] of Object.entries(LAYER_TITLES)) {
      layerOptions.push(
        <option value={layerValue} key={layerValue} title={__(layerTitle)}>
          {__(layerValue)}
        </option>
      );
    }
    return layerOptions;
  }
}

export namespace DeckCellEditor {
  export class Model extends VDomModel {
    constructor(options: NotebookDeckTools.IOptions) {
      super();
      this._manager = options.manager;
    }
    update() {
      this._activeMeta =
        (this._activeCell?.model.metadata.get(META) as any as ICellDeckMetadata) ||
        JSONExt.emptyObject;
      this.stateChanged.emit(void 0);
    }

    onLayerChange = (change: React.ChangeEvent<HTMLSelectElement>) => {
      const { _activeCell } = this;
      /* istanbul ignore if */
      if (!_activeCell) {
        return;
      }
      let layer = change.target.value;
      let newMeta = { ...this._activeMeta } || {};
      if (layer === '-') {
        delete newMeta.layer;
        this._setDeckMetadata(newMeta, _activeCell);
      } else if (LAYER_SCOPES.includes(layer as any)) {
        newMeta.layer = layer as TLayerScope;
        this._setDeckMetadata(newMeta, _activeCell);
      }
    };

    protected _setDeckMetadata(newMeta: ICellDeckMetadata, cell: Cell<ICellModel>) {
      if (Object.keys(newMeta).length) {
        cell.model.metadata.set(META, newMeta as ReadonlyPartialJSONObject);
      } else {
        cell.model.metadata.delete(META);
      }
    }

    get manager() {
      return this._manager;
    }

    set activeCell(activeCell: Cell<ICellModel> | null) {
      if (this._activeCell === activeCell) {
        return;
      }
      this._activeCell = activeCell;
      this.update();
    }
    get activeMeta() {
      return this._activeMeta;
    }
    private _manager: IDeckManager;
    private _activeCell: Cell<ICellModel> | null = null;
    private _activeMeta: ICellDeckMetadata | null = null;
  }
}
