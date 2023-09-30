import { CommandToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { CommandIds } from '../tokens';

import { NotebookPresenter } from './presenter';

export class NotebookDeckExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  private _commands: CommandRegistry;
  private _presenter: NotebookPresenter;

  constructor(options: DeckExtension.IOptions) {
    this._commands = options.commands;
    this._presenter = options.presenter;
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>,
  ): IDisposable {
    const button = new CommandToolbarButton({
      commands: this._commands,
      label: '',
      id: CommandIds.toggle,
    });

    panel.toolbar.insertItem(5, 'deck', button);

    this._presenter.preparePanel(panel);

    return new DisposableDelegate(() => button.dispose());
  }
}

export namespace DeckExtension {
  export interface IOptions {
    commands: CommandRegistry;
    presenter: NotebookPresenter;
  }
}
