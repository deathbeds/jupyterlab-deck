import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon, ellipsesIcon, caretLeftIcon } from '@jupyterlab/ui-components';
import React from 'react';

import { ICONS } from '../icons';
import {
  CSS,
  IDeckManager,
  LAYER_SCOPES,
  SLIDE_TYPES,
  TLayerScope,
  TSlideType,
} from '../tokens';

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
    const { showMore, canLayout, canSlideType, canLayerScope } = model;

    console.warn({ canLayout, canSlideType, canLayerScope });

    if (!canLayout && !canSlideType && !canLayerScope) {
      return [];
    }

    if (!showMore) {
      return [
        this.makeButton(
          ellipsesIcon,
          __('Show Design Tools'),
          () => (model.showMore = true)
        ),
      ];
    }

    let items: JSX.Element[] = [
      this.makeButton(
        caretLeftIcon,
        __('Hide Design Tools'),
        () => (model.showMore = false)
      ),
    ];

    const { layover } = this.model.manager;

    if (canLayout) {
      items.push(
        this.makeButton(
          layover ? ICONS.transformStop : ICONS.transformStart,
          layover ? __('Hide Layout') : __('Show Layout'),
          () => {
            let { manager } = this.model;
            manager.layover ? manager.hideLayover() : manager.showLayover();
          }
        )
      );
    }

    if (canSlideType) {
      const { currentSlideType } = model;
      let slideTypes: JSX.Element[] = [];
      let slideType: TSlideType;
      let activeItem: JSX.Element | null = null;
      for (slideType of SLIDE_TYPES) {
        let item = this.makeSlideTypeItem(slideType, currentSlideType);
        if (currentSlideType === slideType) {
          activeItem = item;
        } else {
          slideTypes.push(item);
        }
      }
      if (activeItem) {
        slideTypes.push(activeItem);
      }
      items.push(<ul className={CSS.selector}>{slideTypes}</ul>);
    }

    if (canLayerScope) {
      const { currentLayerScope } = model;
      let layerScopes: JSX.Element[] = [];
      let layerScope: TLayerScope | null;
      let activeItem: JSX.Element | null = null;
      for (layerScope of [...LAYER_SCOPES, null]) {
        let item = this.makeLayerScopeItem(layerScope, currentLayerScope);
        if (currentLayerScope === layerScope) {
          activeItem = item;
        } else {
          layerScopes.push(item);
        }
      }
      if (activeItem) {
        layerScopes.push(activeItem);
      }
      items.push(<ul className={CSS.selector}>{layerScopes}</ul>);
    }

    return items;
  }

  makeSlideTypeItem = (
    slideType: TSlideType,
    currentSlideType: TSlideType
  ): JSX.Element => {
    let { __ } = this.model.manager;
    let slideTypeKey = slideType == null ? 'null' : slideType;
    let icon = ICONS.slideshow[slideTypeKey];
    let label = __(slideTypeKey);
    let button = this.makeButton(
      icon,
      label,
      () => {
        this.model.manager.setSlideType(slideType);
      },
      '',
      [<label key="label">{label}</label>]
    );
    return (
      <li
        className={
          currentSlideType === slideType
            ? `${CSS.active} ${CSS.slideType}`
            : CSS.slideType
        }
      >
        {button}
      </li>
    );
  };

  makeLayerScopeItem = (
    layerScope: TLayerScope | null,
    currentLayerScope: TLayerScope | null
  ): JSX.Element => {
    let { __ } = this.model.manager;
    let layerScopeKey = layerScope == null ? 'null' : layerScope;
    let icon = ICONS.layer[layerScopeKey];
    let label = __(layerScopeKey);
    let button = this.makeButton(
      icon,
      label,
      () => {
        this.model.manager.setLayerScope(layerScope);
      },
      '',
      [<label key="label">{label}</label>]
    );
    return (
      <li
        className={
          currentLayerScope === layerScope
            ? `${CSS.active} ${CSS.layerScope}`
            : CSS.layerScope
        }
      >
        {button}
      </li>
    );
  };

  makeButton(
    icon: LabIcon,
    title: string,
    onClick: () => void,
    className: string = '',
    children: JSX.Element[] = []
  ) {
    return (
      <button
        className={className}
        onClick={onClick}
        title={this.model.manager.__(title)}
      >
        <icon.react width={32} />
        {children}
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

    get canLayout(): boolean {
      return this._manager.activePresenter?.canLayout || false;
    }

    get canSlideType(): boolean {
      return this._manager.activePresenter?.canSlideType || false;
    }

    get canLayerScope(): boolean {
      return this._manager.activePresenter?.canLayerScope || false;
    }

    get currentSlideType(): TSlideType | null {
      return this._manager.getSlideType();
    }

    get currentLayerScope(): TLayerScope | null {
      return this._manager.getLayerScope();
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
