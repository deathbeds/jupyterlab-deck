import { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { ICONS } from '../icons';
import { CSS } from '../tokens';

export class Selector extends Widget {
  protected _choices: Selector.IChoice[] = [];
  protected _summaryIcon: HTMLSpanElement;

  protected onChange = (value: string) => {
    console.warn(this, 'does not provide an onChange handler');
  };

  constructor(options: Selector.IOptions) {
    options.node = document.createElement('details');
    super(options);

    this.addClass(CSS.selector);
    options.className && this.addClass(options.className);
    options.onChange && (this.onChange = options.onChange);

    const ul = document.createElement('ul');
    this._choices = options.choices || [];

    for (const choice of this._choices || []) {
      ul.appendChild(createLi(choice, options));
    }

    const summary = document.createElement('summary');
    this._summaryIcon = document.createElement('span');
    summary.appendChild(this._summaryIcon);
    this.renderValue();

    this.node.appendChild(ul);
    this.node.appendChild(summary);
  }

  renderValue() {
    // TODO: get the value
    this._choices[0].icon.render(this._summaryIcon);
  }
}

function createLi(choice: Selector.IChoice, options: Selector.IOptions): HTMLElement {
  const child = document.createElement('li');
  const label = document.createElement('label');
  const span = document.createElement('span');
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = `${options.className}`;
  label.appendChild(input);
  label.appendChild(span);
  choice.icon.render(span);
  child.appendChild(label);
  return child;
}

export class IconSelector extends Selector {
  constructor(options: IconSelector.IOptions) {
    const choices = Object.entries(options.icons).map(([value, icon]) => {
      return { value, icon, label: options.__(value) };
    });
    super({ ...options, choices });
  }
}

export namespace IconSelector {
  export interface IOptions extends Selector.IOptions {
    icons: Record<string, LabIcon>;
  }
}

export class SlideType extends IconSelector {
  constructor(options: Omit<IconSelector.IOptions, 'icons'>) {
    super({ ...options, icons: ICONS.slideshow, className: CSS.slideType });
  }
}

export class LayerScope extends IconSelector {
  constructor(options: Omit<IconSelector.IOptions, 'icons'>) {
    super({ ...options, icons: ICONS.layer, className: CSS.layerScope });
  }
}

export namespace Selector {
  export interface IOptions extends Widget.IOptions {
    __: (msgid: string, ...args: string[]) => string;
    className?: string;
    choices?: IChoice[];
    onChange?: IOnChange;
  }

  export interface IChoice {
    value: string;
    label: string;
    icon: LabIcon;
  }

  export interface IOnChange {
    (value: string | null): void;
  }
}
