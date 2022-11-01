import { MainAreaWidget } from '@jupyterlab/apputils';
import { MarkdownViewer } from '@jupyterlab/markdownviewer';
import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import { IPresenter, TCanGoDirection, TDirection } from '../tokens';

export type TMarkdownPanel = MainAreaWidget<MarkdownViewer>;

export class SimpleMarkdownPresenter implements IPresenter<TMarkdownPanel> {
  protected _activeChanged = new Signal<IPresenter<TMarkdownPanel>, void>(this);

  public readonly id = 'simple-markdown';
  public readonly rank = 100;
  public readonly capabilities = {
    layout: false,
    slideType: false,
    layerScope: false,
    stylePart: false,
    styleDeck: false,
  };

  public accepts(widget: Widget): TMarkdownPanel | null {
    if (widget instanceof MainAreaWidget && widget.content instanceof MarkdownViewer) {
      return widget;
    }
    return null;
  }

  public async stop(widget: Widget): Promise<void> {
    return;
  }
  public async start(widget: TMarkdownPanel): Promise<void> {
    return;
  }
  public async go(
    widget: TMarkdownPanel,
    direction: TDirection,
    alternate?: TDirection
  ): Promise<void> {
    return;
  }
  public canGo(widget: TMarkdownPanel): Partial<TCanGoDirection> {
    return {};
  }
  public style(widget: TMarkdownPanel): void {
    return;
  }
  public get activeChanged(): ISignal<IPresenter<TMarkdownPanel>, void> {
    return this._activeChanged;
  }
}
