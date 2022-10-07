import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar, StatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { DeckManager } from './manager';
import { NotebookAdapter } from './notebook/adapter';
import { NotebookDeckExtension } from './notebook/extension';
import { NS, IDeckManager, CommandIds, CATEGORY, PLUGIN_ID } from './tokens';

import '../style/index.css';

const plugin: JupyterFrontEndPlugin<IDeckManager> = {
  id: `${NS}:plugin`,
  requires: [ITranslator, ILabShell, ISettingRegistry],
  optional: [ICommandPalette, IStatusBar],
  provides: IDeckManager,
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    shell: ILabShell,
    settings: ISettingRegistry,
    palette?: ICommandPalette,
    statusbar?: IStatusBar
  ) => {
    const { commands } = app;

    const theStatusBar = statusbar instanceof StatusBar ? statusbar : null;

    const manager = new DeckManager({
      commands,
      shell,
      translator: (translator || nullTranslator).load(NS),
      statusbar: theStatusBar,
      settings: settings.load(PLUGIN_ID),
      appStarted: app.started,
    });

    const { __ } = manager;

    if (palette) {
      palette.addItem({ command: CommandIds.start, category: __(CATEGORY) });
      palette.addItem({ command: CommandIds.stop, category: __(CATEGORY) });
    }

    return manager;
  },
};

const notebookPlugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:notebooks`,
  requires: [IDeckManager],
  autoStart: true,
  activate: (app: JupyterFrontEnd, decks: IDeckManager) => {
    const adapter = new NotebookAdapter({ manager: decks });
    decks.addAdapter(notebookPlugin.id, adapter);
    const { commands } = app;

    app.docRegistry.addWidgetExtension(
      'Notebook',
      new NotebookDeckExtension({ commands })
    );
  },
};

export default [plugin, notebookPlugin];
