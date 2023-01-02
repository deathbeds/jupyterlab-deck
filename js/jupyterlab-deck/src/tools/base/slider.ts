import type { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { CSS } from '../../tokens';

export class DeckSlider extends Widget {
  protected _checkbox: HTMLInputElement;
  protected _slider: HTMLInputElement;
  protected _labelSpan: HTMLSpanElement;
  protected _defaultValue: string | number;
  protected _label: string;
  protected _suffix: string | null;
  protected _onChange: (value: string) => void;
  protected _onDisposed: () => void;

  constructor(options: DeckSlider.IOptions) {
    options.node = document.createElement('details');

    super(options);

    this._suffix = options.suffix || null;
    this._label = options.label;
    this._defaultValue = options.defaultValue;
    this._onChange = options.onChange;
    this._onDisposed = options.onDisposed;
    this.addClass(CSS.flyOut);
    this.addClass(CSS.slider);
    this.addClass(options.className);

    const controlDiv = document.createElement('div');
    this._slider = document.createElement('input');
    this._slider.type = 'range';

    for (const [attr, value] of Object.entries(options.attrs)) {
      this._slider.setAttribute(attr, value);
    }

    this._checkbox = document.createElement('input');
    this._checkbox.type = 'checkbox';

    controlDiv.appendChild(this._slider);
    controlDiv.appendChild(this._checkbox);

    const summary = document.createElement('summary');

    const summaryLabel = document.createElement('label');

    const iconSpan = document.createElement('span');
    options.icon.render(iconSpan);

    this._labelSpan = document.createElement('span');

    summaryLabel.appendChild(iconSpan);
    summaryLabel.appendChild(this._labelSpan);
    summary.appendChild(summaryLabel);
    this.node.appendChild(summary);
    this.node.appendChild(controlDiv);

    this.node.addEventListener('mouseenter', this.expand);
    this.node.addEventListener('mouseleave', this.collapse);
    this._slider.addEventListener('input', this.onChange);
    this._checkbox.addEventListener('input', this.onCheck);
  }

  set value(value: string) {
    this.renderValue(value);
  }

  onCheck = (event: Event) => {
    const { checked } = event.currentTarget as HTMLInputElement;
    if (!checked) {
      this.renderValue('');
      this._onChange('');
    }
  };

  onChange = (event: Event) => {
    const { value } = event.currentTarget as HTMLInputElement;
    this._onChange(value);
    this.renderValue(value);
  };

  renderValue(value: string) {
    if (value) {
      this._slider.value = value;
      this._checkbox.checked = true;
      this._labelSpan.textContent = `${this._label}: ${value}${this._suffix || ''}`;
    } else {
      this._slider.value = `${this._defaultValue}`;
      this._checkbox.checked = false;
      this._labelSpan.textContent = this._label;
    }
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.node.removeEventListener('mouseenter', this.expand);
    this.node.removeEventListener('mouseleave', this.collapse);
    this._slider.removeEventListener('input', this.onChange);
    this._checkbox.removeEventListener('input', this.onCheck);
    super.dispose();
    this._onDisposed();
  }

  expand = () => {
    (this.node as HTMLDetailsElement).open = true;
  };

  collapse = () => {
    (this.node as HTMLDetailsElement).open = false;
  };
}

export namespace DeckSlider {
  export interface IOptions extends Widget.IOptions, ISliderConfig {
    onChange: (value: string) => void;
    onDisposed: () => void;
    label: string;
  }

  export interface ISliderConfig {
    suffix?: string;
    defaultValue: string | number;
    attrs: ISliderAttrs;
    icon: LabIcon;
    className: string;
    rank: number;
  }

  export interface ISliderAttrs {
    min: number;
    max: number;
    step: number;
  }
}
