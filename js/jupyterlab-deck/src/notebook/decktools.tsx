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
  dispose() {
    this.model.dispose();
    super.dispose();
  }

  protected render(): JSX.Element {
    const m = this.model;
    const { activeMeta, manager } = m;
    const { __ } = manager;

    const layer = activeMeta?.layer || '-';

    return (
      <div>
        <label>
          {__('Layer')}
          <ICONS.deckStart.react tag="span" height={16} />
          <div
            className={CSS.selectWrapper}
            title={__('Display this cell as an out-of-order layer.')}
          >
            <select
              className={CSS.styled}
              value={layer}
              onChange={this.model.onLayerChange}
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
      if (!this._activeCell) {
        return;
      }
      let layer = change.target.value;
      let newMeta = { ...this._activeMeta } || {};
      if (layer === '-') {
        delete newMeta.layer;
      } else if (LAYER_SCOPES.includes(layer as any)) {
        newMeta.layer = layer as TLayerScope;
      } else {
        return;
      }
      this._activeCell.model.metadata.set(META, newMeta as ReadonlyPartialJSONObject);
    };

    get manager() {
      return this._manager;
    }
    get activeCell(): Cell<ICellModel> | null {
      return this._activeCell;
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
