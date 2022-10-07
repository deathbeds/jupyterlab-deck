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
import { DeckExtension } from './notebook-button';
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
    });

    const { __ } = manager;

    app.docRegistry.addWidgetExtension('Notebook', new DeckExtension({ commands }));

    if (palette) {
      palette.addItem({ command: CommandIds.start, category: __(CATEGORY) });
      palette.addItem({ command: CommandIds.stop, category: __(CATEGORY) });
    }

    return manager;
  },
};

export default plugin;
