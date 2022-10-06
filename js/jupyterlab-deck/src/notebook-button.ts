import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { ICONS } from './icons';
import { IDeckManager } from './tokens';

export class DeckExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  private _manager: IDeckManager;
  constructor(options: DeckExtension.IOptions) {
    this._manager = options.manager;
  }
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const button = new ToolbarButton({
      icon: ICONS.deck,
      onClick: async () => this._manager.start(),
    });

    panel.toolbar.insertItem(5, 'deck', button);
    return new DisposableDelegate(() => button.dispose());
  }
}

export namespace DeckExtension {
  export interface IOptions {
    manager: IDeckManager;
  }
}
