import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import React from 'react';
import { caretUpEmptyThinIcon } from '@jupyterlab/ui-components';

import { CSS, IDeckManager, DIRECTION, DIRECTION_LABEL } from './tokens';

export class DeckRemote extends VDomRenderer<DeckRemote.Model> {
  constructor(options: DeckRemote.IOptions) {
    super(new DeckRemote.Model(options));
    this.addClass(CSS.remote);
  }
  protected render(): JSX.Element {
    const { go, __ } = this.model.manager;

    const buttons: Record<string, JSX.Element> = {};

    for (const direction of Object.values(DIRECTION)) {
      buttons[direction] = (
        <button onClick={() => go(direction)} title={__(DIRECTION_LABEL[direction])}>
          <caretUpEmptyThinIcon.react
            className={`${CSS.direction}-${direction}`}
            width={32}
          />
        </button>
      );
    }

    return (
      <div className={CSS.directions}>
        {buttons.up}
        <div>
          {buttons.back}
          {buttons.forward}
        </div>
        {buttons.down}
      </div>
    );
  }
}

export namespace DeckRemote {
  export class Model extends VDomModel {
    private _manager: IDeckManager;

    constructor(options: IOptions) {
      super();
      this._manager = options.manager;
    }
    get manager(): IDeckManager {
      return this._manager;
    }
  }
  export interface IOptions {
    manager: IDeckManager;
  }
}
