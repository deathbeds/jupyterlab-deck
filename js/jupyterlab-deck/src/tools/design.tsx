import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';
import { LabIcon, ellipsesIcon, caretLeftIcon } from '@jupyterlab/ui-components';
import { JSONExt } from '@lumino/coreutils';
import React from 'react';

import { ICONS } from '../icons';
import {
  CSS,
  IDeckManager,
  INCAPABLE,
  IPresenterCapbilities,
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
    this.model.dispose();
    super.dispose();
    document.body.removeChild(this.node);
  }

  protected render(): JSX.Element {
    return <div>{this.more()}</div>;
  }

  more(): JSX.Element[] {
    const { model } = this;
    const { __ } = model.manager;
    const { capabilities, showMore } = model;

    if (!capabilities.layout && !capabilities.slideType && !capabilities.layerScope) {
      return [];
    }

    if (!showMore) {
      return [
        this.makeButton(
          ellipsesIcon,
          __('Show Design Tools'),
          () => (model.showMore = true),
        ),
      ];
    }

    let items: JSX.Element[] = [
      this.makeButton(
        caretLeftIcon,
        __('Hide Design Tools'),
        () => (model.showMore = false),
      ),
    ];

    const { layover } = this.model.manager;

    if (capabilities.layout) {
      items.push(
        this.makeButton(
          layover ? ICONS.transformStop : ICONS.transformStart,
          layover ? __('Hide Layout') : __('Show Layout'),
          () => {
            let { manager } = this.model;
            manager.layover ? manager.hideLayover() : manager.showLayover();
          },
        ),
      );
    }

    if (capabilities.slideType) {
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
      items.push(
        <ul key="slide-type" className={`${CSS.selector} ${CSS.slideType}`}>
          {slideTypes}
        </ul>,
      );
    }

    if (capabilities.layerScope) {
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
      items.push(
        <ul key="layer" className={`${CSS.selector} ${CSS.layerScope}`}>
          {layerScopes}
        </ul>,
      );
    }

    if (capabilities.stylePart) {
      let { currentPartStyles } = model;
      items.push(
        this.makeSlider('z-index', currentPartStyles),
        this.makeSlider('zoom', currentPartStyles),
        this.makeSlider('opacity', currentPartStyles),
      );
    }

    return items;
  }

  makeSlideTypeItem = (
    slideType: TSlideType,
    currentSlideType: TSlideType,
  ): JSX.Element => {
    let { __ } = this.model.manager;
    let slideTypeKey = slideType == null ? 'null' : slideType;
    let icon = ICONS.slideshow[slideTypeKey];
    let label = __(slideTypeKey);
    let button = this.makeButton(
      icon,
      label,
      () => this.model.manager.setSlideType(slideType),
      '',
      [<label key="label">{label}</label>],
    );
    return (
      <li key={slideType} className={currentSlideType === slideType ? CSS.active : ''}>
        {button}
      </li>
    );
  };

  makeLayerScopeItem = (
    layerScope: TLayerScope | null,
    currentLayerScope: TLayerScope | null,
  ): JSX.Element => {
    let { __ } = this.model.manager;
    let layerScopeKey = layerScope == null ? 'null' : layerScope;
    let icon = ICONS.layer[layerScopeKey];
    let label = __(layerScopeKey);
    let button = this.makeButton(
      icon,
      label,
      () => this.model.manager.setLayerScope(layerScope),
      '',
      [<label key="label">{label}</label>],
    );
    return (
      <li className={currentLayerScope === layerScope ? CSS.active : ''}>{button}</li>
    );
  };

  makeSlider = (
    attr: DesignTools.TSliderAttr,
    styles: GlobalStyles | null,
  ): JSX.Element => {
    const config = DesignTools.SLIDER_CONFIG[attr];
    const { suffix, className, icon } = config;

    let value = styles ? (styles[attr] as any) : null;

    let checkbox: JSX.Element | null = null;
    if (value != null) {
      if (suffix) {
        value = value.replace(suffix, '');
      }
      value = parseFloat(value);
      checkbox = (
        <input
          type="checkbox"
          name={`${attr}-enabled`}
          checked
          onChange={this.onSliderChange}
        ></input>
      );
    }

    let valueAttr = { value: value == null ? config.defaultValue : value };
    let finalClassName = value == null ? className : `${className} ${CSS.active}`;

    return (
      <div className={`${CSS.slider} ${finalClassName}`} title={attr} key={attr}>
        {checkbox ? [checkbox] : []}
        <input
          name={attr}
          type="range"
          {...config.attrs}
          {...valueAttr}
          onChange={this.onSliderChange}
        ></input>
        <label>
          <icon.react width={32} />
          <span>{attr}</span>
        </label>
      </div>
    );
  };

  onSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name, checked } = event.currentTarget;
    if (name.endsWith('-enabled')) {
      if (!checked) {
        this.model.setPartStyles(name.replace('-enabled', ''), null);
      }
    } else {
      const config = DesignTools.SLIDER_CONFIG[name as DesignTools.TSliderAttr];
      const suffix = config.suffix || '';
      this.model.setPartStyles(name, `${value}${suffix}`);
    }
  };

  makeButton(
    icon: LabIcon,
    title: string,
    onClick: () => void,
    className: string = '',
    children: JSX.Element[] = [],
  ) {
    return (
      <button
        className={className}
        onClick={onClick}
        title={this.model.manager.__(title)}
        key={title}
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

    get capabilities(): IPresenterCapbilities {
      return this._manager.activePresenter?.capabilities || INCAPABLE;
    }

    get currentSlideType(): TSlideType | null {
      return this._manager.getSlideType();
    }

    get currentLayerScope(): TLayerScope | null {
      return this._manager.getLayerScope();
    }

    get currentPartStyles(): GlobalStyles | null {
      let styles = this._manager.getPartStyles();
      return styles;
    }

    setPartStyles(attr: string, value: any) {
      let styles = { ...(this.currentPartStyles || JSONExt.emptyObject) };
      styles[attr] = value;
      this._manager.setPartStyles(styles as GlobalStyles);
      this._emit();
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

  export type TSliderAttr = 'z-index' | 'zoom' | 'opacity';

  export interface ISliderBounds {
    attrs: {
      min: number;
      max: number;
      step: number;
    };
    defaultValue: number;
    suffix?: string;
    icon: LabIcon;
    className: string;
  }
  export type TSliders = {
    [key in TSliderAttr]: ISliderBounds;
  };

  export const SLIDER_CONFIG: TSliders = {
    zoom: {
      attrs: { min: 50, max: 500, step: 1 },
      defaultValue: 100,
      suffix: '%',
      icon: ICONS.zoom,
      className: CSS.zoom,
    },
    'z-index': {
      attrs: { min: -10, max: 10, step: 1 },
      defaultValue: 0,
      icon: ICONS.zIndex,
      className: CSS.zIndex,
    },
    opacity: {
      attrs: { min: 0, max: 100, step: 1 },
      suffix: '%',
      defaultValue: 100,
      icon: ICONS.opacity,
      className: CSS.opacity,
    },
  };
}
