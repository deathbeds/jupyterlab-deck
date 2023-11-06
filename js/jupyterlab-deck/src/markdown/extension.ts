import { CommandToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { FileEditorPanel } from '@jupyterlab/fileeditor';
import { CommandRegistry } from '@lumino/commands';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { CommandIds, MARKDOWN_MIMETYPES } from '../tokens';

export class EditorDeckExtension
  implements
    DocumentRegistry.IWidgetExtension<FileEditorPanel, DocumentRegistry.ICodeModel>
{
  private _commands: CommandRegistry;

  constructor(options: EditorDeckExtension.IOptions) {
    this._commands = options.commands;
  }

  createNew(
    panel: FileEditorPanel,
    context: DocumentRegistry.IContext<DocumentRegistry.ICodeModel>,
  ): IDisposable {
    /* istanbul ignore if */
    if (!MARKDOWN_MIMETYPES.includes(context.model.mimeType)) {
      return new DisposableDelegate(() => {});
    }

    const button = new CommandToolbarButton({
      commands: this._commands,
      label: '',
      id: CommandIds.toggle,
    });

    panel.toolbar.insertItem(5, 'deck', button);

    return new DisposableDelegate(() => button.dispose());
  }
}

export namespace EditorDeckExtension {
  export interface IOptions {
    commands: CommandRegistry;
  }
}
