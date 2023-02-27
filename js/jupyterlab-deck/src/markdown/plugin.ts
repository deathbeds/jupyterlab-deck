import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';

import { NS, IDeckManager } from '../tokens';

import { SimpleMarkdownPresenter } from './presenter';

export const simpleMarkdownPlugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:simple-markdown`,
  requires: [IDeckManager],
  autoStart: true,
  activate: (app: JupyterFrontEnd, decks: IDeckManager) => {
    const { commands } = app;
    const presenter = new SimpleMarkdownPresenter({
      manager: decks,
      commands,
    });
    decks.addPresenter(presenter);
  },
};
