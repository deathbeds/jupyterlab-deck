import { MarkdownDocument } from '@jupyterlab/markdownviewer';
import { CommandRegistry } from '@lumino/commands';
import { ISignal, Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import {
  IDeckManager,
  IPresenter,
  TCanGoDirection,
  TDirection,
  CSS,
  DIRECTION,
  CommandIds,
  DIRECTION_KEYS,
  COMPOUND_KEYS,
} from '../tokens';

export class SimpleMarkdownPresenter implements IPresenter<MarkdownDocument> {
  protected _activeChanged = new Signal<IPresenter<MarkdownDocument>, void>(this);

  public readonly id = 'simple-markdown';
  public readonly rank = 100;
  public readonly capabilities = {};
  protected _manager: IDeckManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;
  protected _activeSlide = new Map<MarkdownDocument, number>();
  protected _lastSlide = new Map<MarkdownDocument, number>();
  protected _stylesheets = new Map<MarkdownDocument, HTMLStyleElement>();

  constructor(options: SimpleMarkdownPresenter.IOptions) {
    this._manager = options.manager;
    this._commands = options.commands;
    this._addKeyBindings();
    this._addWindowListeners();
  }

  public accepts(widget: Widget): MarkdownDocument | null {
    if (widget instanceof MarkdownDocument) {
      return widget;
    }
    return null;
  }

  public async stop(panel: MarkdownDocument): Promise<void> {
    this._removeStyle(panel);
    return;
  }
  public async start(panel: MarkdownDocument): Promise<void> {
    const activeSlide = this._activeSlide.get(panel) || 1;
    await panel.content.ready;
    this._updateSheet(panel, activeSlide);
    return;
  }

  public async go(
    panel: MarkdownDocument,
    direction: TDirection,
    alternate?: TDirection
  ): Promise<void> {
    await panel.content.ready;
    let index = this._activeSlide.get(panel) || 1;
    let lastSlide = this._lastSlide.get(panel) || -1;
    if (direction == 'forward' || alternate == 'forward') {
      index++;
    } else if (direction == 'back' || alternate == 'back') {
      index--;
    }
    index = index < 1 ? 1 : index > lastSlide ? lastSlide : index;
    this._updateSheet(panel, index);
  }

  public canGo(panel: MarkdownDocument): Partial<TCanGoDirection> {
    let index = this._activeSlide.get(panel) || 1;
    // TODO: someplace better
    let hrCount = panel.content.renderer.node.querySelectorAll('hr').length;
    this._lastSlide.set(panel, hrCount);
    return {
      forward: index < hrCount,
      back: index > 1,
    };
  }

  public style(panel: MarkdownDocument): void {
    const { _manager } = this;
    panel.addClass(CSS.deck);
    _manager.cacheStyle(panel.node, panel.content.node, panel.content.renderer.node);
  }

  public get activeChanged(): ISignal<IPresenter<MarkdownDocument>, void> {
    return this._activeChanged;
  }

  /** overload the stock notebook keyboard shortcuts */
  protected _addKeyBindings() {
    for (const direction of Object.values(DIRECTION)) {
      this._commands.addKeyBinding({
        command: CommandIds[direction],
        keys: DIRECTION_KEYS[direction],
        selector: `.${CSS.deck} .${CSS.markdownViewer}`,
      });
    }
    for (const [directions, keys] of COMPOUND_KEYS.entries()) {
      const [direction, alternate] = directions;
      this._commands.addKeyBinding({
        command: CommandIds.go,
        args: { direction, alternate },
        keys,
        selector: `.${CSS.deck} .${CSS.markdownViewer}`,
      });
    }
  }

  protected _addWindowListeners() {
    window.addEventListener('hashchange', this._onHashChange);
  }

  protected _onHashChange = (event: HashChangeEvent) => {
    const { activeWidget } = this._manager;
    const panel = activeWidget && this.accepts(activeWidget);
    /* istanbul ignore if */
    if (!panel) {
      return;
    }
    const url = new URL(event.newURL);
    const { hash } = url || '#';
    /* istanbul ignore if */
    if (hash === '#') {
      return;
    }
    this._activateByAnchor(panel, hash);
  };

  protected _activateByAnchor(panel: MarkdownDocument, fragment: string) {
    const anchored = document.getElementById(fragment.slice(1));
    /* istanbul ignore if */
    if (!anchored || !panel.node.contains(anchored)) {
      return;
    }
    let index = 0;
    for (const child of panel.content.renderer.node.children) {
      if (child.tagName === 'HR') {
        index += 1;
        continue;
      }
      if (child === anchored) {
        this._updateSheet(panel, index);
        break;
      }
    }
  }

  protected _updateSheet(panel: MarkdownDocument, index: number) {
    let sheet = this._stylesheets.get(panel);
    if (sheet == null) {
      sheet = document.createElement('style');
      sheet.className = CSS.sheet;
      this._stylesheets.set(panel, sheet);
      document.body.appendChild(sheet);
    }
    sheet.textContent = `
    #${panel.id} > .${CSS.markdownViewer} .${
      CSS.renderedMarkdown
    } > hr:nth-of-type(${index}) ~ :not(hr:nth-of-type(${index + 1}) ~ *):not(hr) {
      display: block;
    }`;
    this._activeSlide.set(panel, index);
  }

  protected _removeStyle(panel: MarkdownDocument) {
    /* istanbul ignore if */
    if (panel.isDisposed) {
      return;
    }
    const { _manager } = this;
    panel.removeClass(CSS.deck);
    _manager.uncacheStyle(panel.content.node, panel.node, panel.content.renderer.node);
  }
}

export namespace SimpleMarkdownPresenter {
  export interface IOptions {
    manager: IDeckManager;
    commands: CommandRegistry;
  }
}
