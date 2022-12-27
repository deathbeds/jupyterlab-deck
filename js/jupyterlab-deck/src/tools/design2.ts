import { caretLeftIcon, ellipsesIcon } from '@jupyterlab/ui-components';
import { Panel, PanelLayout } from '@lumino/widgets';

import { IToolManager, CSS } from '../tokens';

import { DeckButton } from './button';

export class DesignTools2 extends Panel {
  protected _tools: IToolManager;
  protected _showAll = false;
  protected _more: DeckButton;

  constructor(options: DesignTools2.IOptions) {
    super(options);
    this.addClass(CSS.designTools);
    this._tools = options.tools;
    document.body.appendChild(this.node);
    this._more = this.makeMore();
    this._panelLayout.addWidget(this._more);
    this._tools.decks.activeChanged.connect(this.onActiveChanged);
    this.onActiveChanged();
  }

  onActiveChanged = () => {
    let { activePresenter } = this._tools.decks;
    let show = false;
    if (activePresenter) {
      const { layout, slideType, layerScope } = activePresenter.capabilities;
      show = !!(layout || slideType || layerScope);
    }
    show ? this.show() : this.hide();
  };

  protected makeMore(): DeckButton {
    const showLabel = this._tools.decks.__('Show Design Tools');
    const hideLabel = this._tools.decks.__('Hide Design Tools');

    const onClick = () => {
      this.showAll = !this.showAll;
      more.icon = this._showAll ? caretLeftIcon : ellipsesIcon;
      more.title_ = this._showAll ? hideLabel : showLabel;
    };

    const more = new DeckButton({
      icon: ellipsesIcon,
      onClick,
      title: showLabel,
    });
    return more;
  }

  get showAll(): boolean {
    return this._showAll;
  }

  set showAll(showAll: boolean) {
    this._showAll = showAll;

    if (!this._showAll) {
      const widgets = [...this._panelLayout.widgets];
      for (const child of widgets) {
        if (child === this._more) {
          continue;
        }
        child.dispose();
      }
    } else {
      void this.initialize();
    }
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    this._tools.decks.activeChanged.disconnect(this.onActiveChanged);
    document.body.removeChild(this.node);
  }

  async initialize() {
    let widgets = await this._tools.createWidgets('design');
    for (const widget of widgets) {
      this._panelLayout.addWidget(widget);
    }
  }

  protected get _panelLayout() {
    return this.layout as PanelLayout;
  }
}

export namespace DesignTools2 {
  export interface IOptions extends Panel.IOptions {
    tools: IToolManager;
  }
}
