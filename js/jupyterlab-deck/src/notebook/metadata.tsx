import { ISettings, Stylist } from '@deathbeds/jupyterlab-fonts';
import {
  deleteCellMetadata,
  setCellMetadata,
  getCellMetadata,
  getPanelMetadata,
} from '@deathbeds/jupyterlab-fonts/lib/labcompat';
import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { INotebookTools, NotebookTools } from '@jupyterlab/notebook';
import { JSONExt } from '@lumino/coreutils';
import { PanelLayout } from '@lumino/widgets';
import React from 'react';

import { ICONS } from '../icons';
import {
  CSS,
  ICellDeckMetadata,
  ID,
  IDeckManager,
  IStylePreset,
  LAYER_SCOPES,
  LAYER_TITLES,
  META,
  TLayerScope,
} from '../tokens';

type __ = IDeckManager['__'];

export class NotebookMetaTools extends NotebookTools.Tool {
  constructor(options: NotebookMetaTools.IOptions) {
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

export namespace NotebookMetaTools {
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
        {this.layerTool(layer, __)}
        {this.presetTool(__)}
      </div>
    );
  }

  presetTool(__: __) {
    return (
      <div className={CSS.toolPreset}>
        <label
          title={__('Choose from pre-defined style templates.')}
          htmlFor={ID.layerSelect}
        >
          {__('Slide Style')}
          <ICONS.deckStart.react tag="span" width={16} />
        </label>
        <div className={CSS.selectSplit}>
          <div className={CSS.selectWrapper}>
            <select
              className={CSS.styled}
              value={this.model.selectedPreset}
              onChange={this.model.onPresetSelect}
              id={ID.presetSelect}
            >
              {this.presetOptions(__)}
            </select>
          </div>
          <button
            className={`${CSS.styled} ${CSS.apply}`}
            onClick={this.model.applyPreset}
          >
            {__('Add Style')}
          </button>
        </div>
      </div>
    );
  }

  layerTool(layer: TLayerScope | '-', __: __) {
    return (
      <div className={CSS.toolLayer}>
        <label
          title={__('Display this cell as an out-of-order layer.')}
          htmlFor={ID.layerSelect}
        >
          {__('Layer')}
          <ICONS.deckStart.react tag="span" width={16} />
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

  presetOptions(__: __): JSX.Element[] {
    // todo: get options from... elsewhere
    const presetOptions: JSX.Element[] = [
      <option key="-" value="">
        -
      </option>,
    ];
    for (const preset of this.model.stylePresets) {
      presetOptions.push(
        <option value={preset.key} key={preset.key}>
          {__(preset.label)}
        </option>,
      );
    }
    return presetOptions;
  }

  layerOptions(__: __): JSX.Element[] {
    const layerOptions: JSX.Element[] = [];

    for (const [layerValue, layerTitle] of Object.entries(LAYER_TITLES)) {
      layerOptions.push(
        <option value={layerValue} key={layerValue} title={__(layerTitle)}>
          {__(layerValue)}
        </option>,
      );
    }
    return layerOptions;
  }
}

export namespace DeckCellEditor {
  export class Model extends VDomModel {
    constructor(options: NotebookMetaTools.IOptions) {
      super();
      this._manager = options.manager;
      this._notebookTools = options.notebookTools;
    }

    update() {
      this._activeMeta =
        (this._activeCell?.model
          ? (getCellMetadata(this._activeCell?.model, META.deck) as ICellDeckMetadata)
          : null) || JSONExt.emptyObject;
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

    applyPreset = () => {
      if (!this._activeCell || !this._selectedPreset) {
        return;
      }
      let meta = {
        ...((getCellMetadata(this._activeCell.model, META.fonts) ||
          JSONExt.emptyObject) as ISettings),
      };
      for (const preset of this._manager.stylePresets) {
        if (preset.key != this._selectedPreset) {
          continue;
        }
        if (!meta['styles']) {
          meta['styles'] = {};
        }

        let metaStyles = meta['styles'] as any;
        if (!metaStyles[META.nullSelector]) {
          metaStyles[META.nullSelector] = {};
        }

        let metaNull = metaStyles[META.nullSelector] as any;

        if (!metaNull[META.presentingCell]) {
          metaNull[META.presentingCell] = {};
        }

        let presenting = metaNull[META.presentingCell];
        for (let [key, value] of Object.entries(preset.styles)) {
          presenting[key] = value;
        }
        deleteCellMetadata(this._activeCell.model, META.fonts);
        setCellMetadata(this._activeCell.model, META.fonts, meta);
        this.forceStyle();
        this._notebookTools.update();
        return;
      }
    };

    forceStyle() {
      let panel = this._notebookTools.activeNotebookPanel;
      if (!panel) {
        return;
      }
      let stylist = (this._manager.fonts as any)._stylist as Stylist;
      let meta =
        (panel.model ? getPanelMetadata(panel.model, META.fonts) : null) ||
        JSONExt.emptyObject;
      stylist.stylesheet(meta as ISettings, panel);
    }

    get selectedPreset() {
      return this._selectedPreset;
    }

    get stylePresets(): IStylePreset[] {
      return this._manager.stylePresets;
    }

    onPresetSelect = (change: React.ChangeEvent<HTMLSelectElement>) => {
      this._selectedPreset = change.target.value;
      this.stateChanged.emit(void 0);
    };

    protected _setDeckMetadata(newMeta: ICellDeckMetadata, cell: Cell<ICellModel>) {
      if (Object.keys(newMeta).length) {
        setCellMetadata(cell.model, META.deck, newMeta);
      } else {
        deleteCellMetadata(cell.model, META.deck);
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
    private _selectedPreset: string = '';
    private _notebookTools: INotebookTools;
  }
}
