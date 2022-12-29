import type { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { CSS } from '../../tokens';

export class DeckSlider extends Widget {
  protected _checkbox: HTMLInputElement;
  protected _slider: HTMLInputElement;

  constructor(options: DeckSlider.IOptions) {
    options.node = document.createElement('details');
    super(options);
    this.addClass(CSS.slider);

    const controlDiv = document.createElement('div');
    this._slider = document.createElement('input');
    this._slider.type = 'range';
    controlDiv.appendChild(this._slider);

    this._checkbox = document.createElement('input');
    this._checkbox.type = 'checkbox';
    controlDiv.appendChild(this._checkbox);

    const summary = document.createElement('summary');

    const iconSpan = document.createElement('span');
    summary.appendChild(iconSpan);
    options.icon.render(iconSpan);
    this.node.appendChild(summary);
    this.node.appendChild(controlDiv);

    this.node.addEventListener('mouseenter', this.expand);
    this.node.addEventListener('mouseleave', this.collapse);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.node.removeEventListener('mouseenter', this.expand);
    this.node.removeEventListener('mouseleave', this.collapse);
    super.dispose();
  }

  expand = () => {
    (this.node as HTMLDetailsElement).open = true;
  };

  collapse = () => {
    (this.node as HTMLDetailsElement).open = false;
  };
}

export namespace DeckSlider {
  export interface IOptions extends Widget.IOptions {
    onChange: (value: number) => void;
    icon: LabIcon;
  }
}
