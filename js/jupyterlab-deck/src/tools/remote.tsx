import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { LabIcon } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import type { Widget } from '@lumino/widgets';
import React from 'react';

import { ICONS } from '../icons';
import {
  CSS,
  IDeckManager,
  DIRECTION,
  DIRECTION_LABEL,
  TCanGoDirection,
  IPresenter,
} from '../tokens';

export class DeckRemote extends VDomRenderer<DeckRemote.Model> {
  constructor(options: DeckRemote.IOptions) {
    super(new DeckRemote.Model(options));
    this.addClass(CSS.remote);
    document.body.appendChild(this.node);
  }

  dispose() {
    this.model.dispose();
    super.dispose();
    document.body.removeChild(this.node);
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
        `${CSS.direction}-${direction} ${enabled ? '' : CSS.disabled}`,
      );
    }

    const exit = this.makeButton(
      ICONS.deckStop,
      __('Exit Deck'),
      () => void this.model.manager.stop(),
      CSS.stop,
    );

    return (
      <div className={CSS.directions}>
        {this.makeStack()}
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

  makeStack(): JSX.Element {
    let { manager } = this.model;
    if (!manager.activeWidgetStack.length) {
      return <></>;
    }
    let stack: JSX.Element[] = [];
    for (const widget of manager.activeWidgetStack) {
      let icon = widget.title.icon as LabIcon;
      let label = PathExt.basename(widget.title.label);
      stack.push(
        <li key={widget.id}>
          <button onClick={() => this.model.manager.activateWidget(widget)}>
            <label>{label}</label>
            <icon.react width={24}></icon.react>
          </button>
        </li>,
      );
    }
    return <ul className={CSS.widgetStack}>{stack}</ul>;
  }

  makeButton(
    icon: LabIcon,
    title: string,
    onClick: () => void,
    className: string = '',
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
    private _activePresenter: IPresenter<Widget> | null = null;

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

    private async _onActiveChanged() {
      const canGo = await this._manager.canGo();
      let emit = false;
      if (!JSONExt.deepEqual(canGo, this._canGo)) {
        this._canGo = canGo;
        emit = true;
      }
      let { activePresenter } = this._manager;
      if (activePresenter !== this._activePresenter) {
        this._activePresenter = activePresenter;
        emit = true;
      }
      if (emit) {
        this.emit();
      }
    }

    private emit = () => {
      this.stateChanged.emit(void 0);
    };
  }
  export interface IOptions {
    manager: IDeckManager;
  }
}
