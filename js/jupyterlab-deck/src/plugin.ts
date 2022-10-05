import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';

import { INotebookTracker } from '@jupyterlab/notebook';

import { NS, VERSION } from './tokens';

const EXTENSION_ID = `${NS}:widgets`;

const plugin: IPlugin<Application<Widget>, void> = {
  id: EXTENSION_ID,
  requires: [INotebookTracker],
  autoStart: true,
  activate: (_app: Application<Widget>, notebooks: INotebookTracker) => {
    console.log(VERSION, notebooks);
  },
};

export default plugin;
