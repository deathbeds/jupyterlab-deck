import { IFontManager } from '@deathbeds/jupyterlab-fonts';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar, StatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { DeckManager } from './manager';
import { simpleMarkdownPlugin } from './markdown/plugin';
import { notebookPlugin } from './notebook/plugin';
import { NS, IDeckManager, CommandIds, CATEGORY, PLUGIN_ID } from './tokens';

import '../style/index.css';

const plugin: JupyterFrontEndPlugin<IDeckManager> = {
  id: `${NS}:plugin`,
  requires: [ITranslator, ILabShell, ISettingRegistry, ILayoutRestorer, IFontManager],
  optional: [ICommandPalette, IStatusBar],
  provides: IDeckManager,
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    shell: ILabShell,
    settings: ISettingRegistry,
    restorer: ILayoutRestorer,
    fonts: IFontManager,
    palette?: ICommandPalette,
    statusbar?: IStatusBar
  ) => {
    const { commands } = app;

    const theStatusBar =
      statusbar instanceof StatusBar ? statusbar : /* istanbul ignore next */ null;

    const manager = new DeckManager({
      commands,
      shell,
      translator: (translator || /* istanbul ignore next */ nullTranslator).load(NS),
      statusbar: theStatusBar,
      fonts,
      settings: settings.load(PLUGIN_ID),
      appStarted: Promise.all([app.started, restorer.restored]).then(() => void 0),
    });

    const { __ } = manager;

    let category = __(CATEGORY);

    if (palette) {
      palette.addItem({ command: CommandIds.start, category });
      palette.addItem({ command: CommandIds.stop, category });
      palette.addItem({ command: CommandIds.showLayover, category });
      palette.addItem({ command: CommandIds.hideLayover, category });
    }

    return manager;
  },
};

export default [plugin, notebookPlugin, simpleMarkdownPlugin];
