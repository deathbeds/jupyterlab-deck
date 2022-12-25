import { LabIcon } from '@jupyterlab/ui-components';
import { Widget, PanelLayout } from '@lumino/widgets';

export class Button extends Widget {
  protected _icon: HTMLSpanElement = document.createElement('span');
  protected _onClick: Button.IOnClick = () => {
    return;
  };
  protected _children: Widget[] = [];
  constructor(options: Button.IOptions) {
    options.node = document.createElement('button');
    super(options);
    this.node.appendChild(this._icon);
    this.icon = options.icon;
    this.onClick = options.onClick;
    this.title_ = options.title;
    this.children_ = options.children || [];
    this.layout = new PanelLayout();
  }

  set icon(icon: LabIcon) {
    icon.render(this._icon);
  }

  set className(className: string) {
    this.node.className = className;
  }

  set onClick(onClick: Button.IOnClick) {
    if (this._onClick) {
      this.node.removeEventListener('click', this._onClick);
    }
    this._onClick = onClick;
    this.node.addEventListener('click', this._onClick);
  }

  set title_(title: string) {
    this.node.title = title;
  }

  set children_(children: Widget[]) {
    for (const child of this._children) {
      child.dispose();
    }
    this._children = children;
    for (const child of this._children) {
      child.parent = this;
      this.node.appendChild(child.node);
    }
  }
}

export namespace Button {
  export interface IOnClick {
    (): void;
  }
  export interface IOptions extends Widget.IOptions {
    icon: LabIcon;
    title: string;
    onClick: IOnClick;
    className?: string;
    children?: Widget[];
  }
}
