import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon, ellipsesIcon, caretLeftIcon } from '@jupyterlab/ui-components';
import React from 'react';

import { ICONS } from '../icons';
import { CSS, IDeckManager } from '../tokens';

export class DesignTools extends VDomRenderer<DesignTools.Model> {
  constructor(options: DesignTools.IOptions) {
    super(new DesignTools.Model(options));
    this.addClass(CSS.designTools);
    document.body.appendChild(this.node);
  }

  dispose() {
    super.dispose();
    if (this.model) {
      this.model.dispose();
    }
    document.body.removeChild(this.node);
  }

  protected render(): JSX.Element {
    return <div>{this.more()}</div>;
  }

  more(): JSX.Element[] {
    const { model } = this;
    const { __ } = model.manager;
    if (model.showMore) {
      const { layover } = this.model.manager;
      const transform = this.makeButton(
        layover ? ICONS.transformStop : ICONS.transformStart,
        layover ? __('Hide Layout') : __('Show Layout'),
        () => {
          let { manager } = this.model;
          manager.layover ? manager.hideLayover() : manager.showLayover();
        }
      );

      const showLess = this.makeButton(
        caretLeftIcon,
        __('Hide Design Tools'),
        () => (model.showMore = false)
      );

      return [showLess, transform];
    } else {
      const showMore = this.makeButton(
        ellipsesIcon,
        __('Show Design Tools'),
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

export namespace DesignTools {
  export class Model extends VDomModel {
    private _manager: IDeckManager;
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
      this.stateChanged.emit(void 0);
    }
  }
  export interface IOptions {
    manager: IDeckManager;
  }
}
