import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import React from 'react';

import { ICONS } from './icons';
import {
  CSS,
  IDeckManager,
  DIRECTION,
  DIRECTION_LABEL,
  TCanGoDirection,
} from './tokens';

export class DeckRemote extends VDomRenderer<DeckRemote.Model> {
  constructor(options: DeckRemote.IOptions) {
    super(new DeckRemote.Model(options));
    this.addClass(CSS.remote);
  }

  protected render(): JSX.Element {
    const { manager, canGo } = this.model;

    const directions: Record<string, JSX.Element> = {};

    for (const direction of Object.values(DIRECTION)) {
      const enabled = !!canGo[direction];
      directions[direction] = this.makeButton(
        enabled ? ICONS.goEnabled : ICONS.goDisabled,
        DIRECTION_LABEL[direction],
        enabled ? () => manager.go(direction) : () => null,
        `${CSS.direction}-${direction} ${enabled ? '' : CSS.disabled}`
      );
    }

    const exit = this.makeButton(
      ICONS.deckStop,
      'Exit Deck',
      () => void this.model.manager.stop()
    );

    return (
      <div className={CSS.directions}>
        {directions.up}
        <div>
          {directions.back}
          {exit}
          {directions.forward}
        </div>
        {directions.down}
      </div>
    );
  }

  makeButton(
    icon: LabIcon,
    title: string,
    onClick: () => void,
    className: string = ''
  ) {
    return (
      <button onClick={onClick} title={this.model.manager.__(title)}>
        <icon.react className={className} width={32} />
      </button>
    );
  }
}

export namespace DeckRemote {
  export class Model extends VDomModel {
    constructor(options: IOptions) {
      super();
      this._manager = options.manager;
      this._manager.activeChanged.connect(this._onActiveChanged, this);
    }

    dispose() {
      this._manager.activeChanged.disconnect(this._onActiveChanged, this);
      super.dispose();
    }

    get manager(): IDeckManager {
      return this._manager;
    }

    get canGo(): Partial<TCanGoDirection> {
      return this._canGo;
    }

    private _onActiveChanged() {
      const canGo = this._manager.canGo();
      if (!JSONExt.deepEqual(canGo, this._canGo)) {
        this._canGo = canGo;
        this.stateChanged.emit(void 0);
      }
    }

    private _manager: IDeckManager;
    private _canGo: Partial<TCanGoDirection> = {};
  }
  export interface IOptions {
    manager: IDeckManager;
  }
}
