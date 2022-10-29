import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon, ellipsesIcon, caretDownEmptyIcon } from '@jupyterlab/ui-components';
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

  dispose() {
    super.dispose();
    if (this.model) {
      this.model.dispose();
    }
  }

  protected render(): JSX.Element {
    const { manager, canGo } = this.model;
    const { __ } = manager;

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
      __('Exit Deck'),
      () => void this.model.manager.stop(),
      CSS.stop
    );

    return (
      <div className={CSS.directions}>
        {this.more()}
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

  more(): JSX.Element[] {
    const { model } = this;
    const { __ } = model.manager;
    if (model.showMore) {
      const transform = this.makeButton(
        this.model.manager.layover ? ICONS.transformStop : ICONS.transformStart,
        __('Design Mode'),
        () => {
          let { manager } = this.model;
          manager.layover ? manager.hideLayover() : manager.showLayover();
        }
      );

      const showLess = this.makeButton(
        caretDownEmptyIcon,
        __('Hide Deck Tools'),
        () => (model.showMore = false)
      );

      return [transform, showLess];
    } else {
      const showMore = this.makeButton(
        ellipsesIcon,
        __('Show Deck Tools'),
        () => (model.showMore = true)
      );
      return [showMore];
    }
  }

  makeButton(
    icon: LabIcon,
    title: string,
    onClick: () => void,
    className: string = ''
  ) {
    return (
      <button
        className={className}
        onClick={onClick}
        title={this.model.manager.__(title)}
      >
        <icon.react width={32} />
      </button>
    );
  }
}

export namespace DeckRemote {
  export class Model extends VDomModel {
    private _manager: IDeckManager;
    private _canGo: Partial<TCanGoDirection> = {};
    private _showMore = false;

    constructor(options: IOptions) {
      super();
      this._manager = options.manager;
      this._manager.activeChanged.connect(this._onActiveChanged, this);
      this._manager.layoverChanged.connect(this._emit);
    }

    dispose() {
      this._manager.activeChanged.disconnect(this._onActiveChanged, this);
      this._manager.layoverChanged.disconnect(this._emit);
      super.dispose();
    }

    get manager(): IDeckManager {
      return this._manager;
    }

    get canGo(): Partial<TCanGoDirection> {
      return this._canGo;
    }

    get showMore() {
      return this._showMore;
    }

    set showMore(showMore: boolean) {
      if (this._showMore !== showMore) {
        this._showMore = showMore;
        this._emit();
      }
    }

    private _emit = () => {
      this.stateChanged.emit(void 0);
    };

    private _onActiveChanged() {
      const canGo = this._manager.canGo();
      if (!JSONExt.deepEqual(canGo, this._canGo)) {
        this._canGo = canGo;
        this.stateChanged.emit(void 0);
      }
    }
  }
  export interface IOptions {
    manager: IDeckManager;
  }
}
