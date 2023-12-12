import { MainAreaWidget } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { FileEditorPanel, FileEditor } from '@jupyterlab/fileeditor';
import { MarkdownDocument, MarkdownViewer } from '@jupyterlab/markdownviewer';
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
  MARKDOWN_MIMETYPES,
  MARKDOWN_PREVIEW_FACTORY,
} from '../tokens';

export class SimpleMarkdownPresenter
  implements IPresenter<MarkdownDocument | FileEditorPanel>
{
  protected _activeChanged = new Signal<
    IPresenter<MarkdownDocument | FileEditorPanel>,
    void
  >(this);

  public readonly id = 'simple-markdown';
  public readonly rank = 100;
  public readonly capabilities = {};
  protected _manager: IDeckManager;
  protected _docManager: IDocumentManager;
  protected _previousActiveCellIndex: number = -1;
  protected _commands: CommandRegistry;
  protected _activeSlide = new Map<MarkdownDocument, number>();
  protected _lastSlide = new Map<MarkdownDocument, number>();
  protected _stylesheets = new Map<MarkdownDocument, HTMLStyleElement>();
  protected _activateWidget: SimpleMarkdownPresenter.IWidgetActivator;

  constructor(options: SimpleMarkdownPresenter.IOptions) {
    this._manager = options.manager;
    this._commands = options.commands;
    this._docManager = options.docManager;
    this._activateWidget = options.activateWidget;

    this._addKeyBindings();
    this._addWindowListeners();
  }

  public accepts(widget: Widget): MarkdownDocument | FileEditorPanel | null {
    if (widget instanceof MarkdownDocument) {
      return widget;
    }
    if (
      widget instanceof MainAreaWidget &&
      widget.content instanceof FileEditor &&
      MARKDOWN_MIMETYPES.includes(widget.content.model.mimeType)
    ) {
      return widget;
    }
    return null;
  }

  public async stop(panel: MarkdownDocument | FileEditorPanel): Promise<void> {
    const preview = await this._ensurePreviewPanel(panel);
    this._removeStyle(preview);
    return;
  }

  public async start(panel: MarkdownDocument | FileEditorPanel): Promise<void> {
    const preview = await this._ensurePreviewPanel(panel);
    if (preview != panel) {
      this._activateWidget(preview);
    }

    await preview.content.ready;
    // lab 3 doesn't appear to have a signal for "I finished rendering"
    preview.content.rendered?.connect(this._onMarkdownRender, this);
    const activeSlide = this._activeSlide.get(preview) || 1;
    this._updateSheet(preview, activeSlide);
    return;
  }

  public async go(
    panel: MarkdownDocument | FileEditorPanel,
    direction: TDirection,
    alternate?: TDirection,
  ): Promise<void> {
    panel = await this._ensurePreviewPanel(panel);
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

  public async canGo(
    panel: MarkdownDocument | FileEditorPanel,
  ): Promise<Partial<TCanGoDirection>> {
    panel = await this._ensurePreviewPanel(panel);

    let index = this._activeSlide.get(panel) || 1;
    // TODO: someplace better
    let hrCount = panel.content.renderer.node.querySelectorAll('hr').length;
    this._lastSlide.set(panel, hrCount);
    return {
      forward: index < hrCount,
      back: index > 1,
    };
  }

  public async style(panel: MarkdownDocument | FileEditorPanel): Promise<void> {
    const { _manager } = this;
    panel = await this._ensurePreviewPanel(panel);
    panel.addClass(CSS.deck);
    _manager.cacheStyle(panel.node, panel.content.node, panel.content.renderer.node);
  }

  public get activeChanged(): ISignal<
    IPresenter<MarkdownDocument | FileEditorPanel>,
    void
  > {
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

  protected _onMarkdownRender = async (viewer: MarkdownViewer) => {
    if (this._manager.activePresenter != this) {
      return viewer.rendered.disconnect(this._onMarkdownRender, this);
    }
    const firstChild = viewer.node.firstChild;
    if (firstChild) {
      (firstChild as any).setAttribute('style', '');
    }
  };

  protected _onHashChange = async (event: HashChangeEvent) => {
    const { activeWidget } = this._manager;
    let panel = activeWidget && this.accepts(activeWidget);
    /* istanbul ignore if */
    if (!panel) {
      return;
    }
    panel = await this._ensurePreviewPanel(panel);
    const url = new URL(event.newURL);
    const { hash } = url || '#';
    /* istanbul ignore if */
    if (hash === '#') {
      return;
    }
    await this._activateByAnchor(panel, hash);
  };

  protected async _activateByAnchor(panel: MarkdownDocument, fragment: string) {
    panel = await this._ensurePreviewPanel(panel);

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

  protected async _ensurePreviewPanel(
    panel: MarkdownDocument | FileEditorPanel,
  ): Promise<MarkdownDocument> {
    if (panel instanceof MarkdownDocument) {
      return panel;
    }
    let preview = this._getPreviewPanel(panel);
    if (preview == null || preview.isDisposed || !preview.isVisible) {
      await this._commands.execute('fileeditor:markdown-preview');
      preview = this._getPreviewPanel(panel);
      await preview.revealed;
    }
    return preview;
  }

  protected _getPreviewPanel(panel: MarkdownDocument | FileEditorPanel) {
    /* istanbul ignore if */
    if (panel instanceof MarkdownDocument) {
      return panel;
    }
    return this._docManager.findWidget(
      panel.content.context.path,
      MARKDOWN_PREVIEW_FACTORY,
    ) as MarkdownDocument;
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
    panel.update();
    panel.parent?.update();
  }
}

export namespace SimpleMarkdownPresenter {
  export interface IOptions {
    manager: IDeckManager;
    commands: CommandRegistry;
    docManager: IDocumentManager;
    activateWidget: IWidgetActivator;
  }

  export interface IWidgetActivator {
    (widget: Widget): void;
  }
}
