import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTools } from '@jupyterlab/notebook';

import { NS, IDeckManager } from '../tokens';

import { NotebookDeckExtension } from './extension';
import { NotebookPresenter } from './presenter';

export const notebookPlugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:notebooks`,
  requires: [INotebookTools, IDeckManager],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTools: INotebookTools,
    decks: IDeckManager
  ) => {
    const { commands } = app;
    const presenter = new NotebookPresenter({
      manager: decks,
      notebookTools,
      commands,
    });
    decks.addPresenter(presenter);

    app.docRegistry.addWidgetExtension(
      'Notebook',
      new NotebookDeckExtension({ commands, presenter })
    );
  },
};
