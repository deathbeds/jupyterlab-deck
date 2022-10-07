import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon, caretUpEmptyThinIcon } from '@jupyterlab/ui-components';
import React from 'react';

import { ICONS } from './icons';
import { CSS, IDeckManager, DIRECTION, DIRECTION_LABEL } from './tokens';

export class DeckRemote extends VDomRenderer<DeckRemote.Model> {
  constructor(options: DeckRemote.IOptions) {
    super(new DeckRemote.Model(options));
    this.addClass(CSS.remote);
  }

  protected render(): JSX.Element {
    const { go } = this.model.manager;

    const directions: Record<string, JSX.Element> = {};

    for (const direction of Object.values(DIRECTION)) {
      directions[direction] = this.makeButton(
        caretUpEmptyThinIcon,
        DIRECTION_LABEL[direction],
        () => go(direction),
        `${CSS.direction}-${direction}`
      );
    }

    const exit = this.makeButton(
      ICONS.deckStop,
      'Exit deck',
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
