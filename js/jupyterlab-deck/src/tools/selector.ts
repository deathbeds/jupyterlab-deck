import { LabIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

import { ICONS } from '../icons';
import { CSS } from '../tokens';

export class DeckSelector extends Widget {
  protected _choices: Selector.IChoice[] = [];
  protected _summaryIcon: HTMLSpanElement;
  protected _summaryLabel: HTMLLabelElement;
  protected _onChange: Selector.IOnChange | null = null;
  protected _onDisposed: () => void;
  protected _label: string;

  constructor(options: Selector.IOptions) {
    options.node = document.createElement('details');
    super(options);

    this.addClass(CSS.selector);
    options.className && this.addClass(options.className);
    options.onChange && (this._onChange = options.onChange);
    this._onDisposed = options.onDisposed;
    this._label = options.__(options.label);

    const ul = document.createElement('ul');
    this._choices = options.choices || [];

    for (const choice of this._choices || []) {
      ul.appendChild(this.createChoice(choice, options));
    }

    const summary = document.createElement('summary');
    this._summaryLabel = document.createElement('label');
    this._summaryIcon = document.createElement('span');
    const labelSpan = document.createElement('span');
    labelSpan.textContent = this._label;
    this._summaryLabel.appendChild(this._summaryIcon);
    this._summaryLabel.appendChild(labelSpan);
    summary.appendChild(this._summaryLabel);
    this.value = options.value;

    this.node.appendChild(ul);
    this.node.appendChild(summary);
    this.node.addEventListener('mouseenter', this.expand);
    this.node.addEventListener('mouseleave', this.collapse);
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.node.removeEventListener('mouseenter', this.expand);
    this.node.removeEventListener('mouseleave', this.collapse);
    super.dispose();
    this._onDisposed();
  }

  set value(value: string) {
    this.renderValue(value);
  }

  protected handleChange = (event: Event) => {
    const value = (event.currentTarget as HTMLInputElement).value;
    this._onChange && this._onChange(value);
    this.value = value;
    this.collapse();
  };

  expand = () => {
    (this.node as HTMLDetailsElement).open = true;
  };

  collapse = () => {
    (this.node as HTMLDetailsElement).open = false;
  };

  renderValue(value: string) {
    for (const choice of this._choices) {
      if (choice.value === value || (choice.value === 'null' && value == null)) {
        choice.icon.render(this._summaryIcon);
        this._summaryIcon.title = `${this._label}: ${choice.label}`;
        return;
      }
    }
  }

  createChoice(choice: Selector.IChoice, options: Selector.IOptions): HTMLElement {
    const child = document.createElement('li');
    const label = document.createElement('label');
    const iconSpan = document.createElement('span');
    const labelSpan = document.createElement('span');
    labelSpan.textContent = choice.label;
    const input = document.createElement('input');
    input.type = 'radio';
    input.value = choice.value;
    input.name = `${options.className}`;
    options.value === choice.value && (input.checked = true);
    label.appendChild(input);
    label.appendChild(iconSpan);
    label.appendChild(labelSpan);
    choice.icon.render(iconSpan);
    child.appendChild(label);
    input.addEventListener('input', this.handleChange);
    const onDisposed = () => {
      input.removeEventListener('input', this.handleChange);
      this.disposed.disconnect(onDisposed);
    };
    this.disposed.connect(onDisposed);
    return child;
  }
}

export class IconSelector extends DeckSelector {
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
    onDisposed: () => void;
    value: string;
    label: string;
  }

  export interface IChoice {
    value: string;
    label: string;
    icon: LabIcon;
  }

  export interface IOnChange {
    (value: string): void;
  }
}
