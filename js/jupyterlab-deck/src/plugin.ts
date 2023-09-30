import { IFontManager } from '@deathbeds/jupyterlab-fonts';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { INotebookTools } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { IStatusBar, StatusBar } from '@jupyterlab/statusbar';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { DeckManager } from './manager';
import { SimpleMarkdownPresenter } from './markdown/presenter';
import { NotebookDeckExtension } from './notebook/extension';
import { NotebookPresenter } from './notebook/presenter';
import { NS, IDeckManager, CommandIds, CATEGORY, PLUGIN_ID } from './tokens';

import '../style/index.css';

const plugin: JupyterFrontEndPlugin<IDeckManager> = {
  id: `${NS}:plugin`,
  requires: [ITranslator, ISettingRegistry, IFontManager],
  optional: [ILabShell, ILayoutRestorer, ICommandPalette, IStatusBar],
  provides: IDeckManager,
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    settings: ISettingRegistry,
    fonts: IFontManager,
    labShell?: ILabShell,
    restorer?: ILayoutRestorer,
    palette?: ICommandPalette,
    statusbar?: IStatusBar,
  ) => {
    const { commands, shell } = app;

    const theStatusBar =
      statusbar instanceof StatusBar ? statusbar : /* istanbul ignore next */ null;

    const manager = new DeckManager({
      commands,
      shell,
      labShell: labShell || null,
      translator: (translator || /* istanbul ignore next */ nullTranslator).load(NS),
      statusbar: theStatusBar,
      fonts,
      settings: settings.load(PLUGIN_ID),
      appStarted: async () =>
        await Promise.all([app.started, ...(restorer ? [restorer.restored] : [])]),
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

const notebookPlugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:notebooks`,
  requires: [INotebookTools, IDeckManager],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTools: INotebookTools,
    decks: IDeckManager,
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
      new NotebookDeckExtension({ commands, presenter }),
    );
  },
};

const simpleMarkdownPlugin: JupyterFrontEndPlugin<void> = {
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

export default [plugin, notebookPlugin, simpleMarkdownPlugin];
