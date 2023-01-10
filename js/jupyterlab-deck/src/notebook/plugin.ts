import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, IPaletteItem } from '@jupyterlab/apputils';
import { INotebookTools, INotebookTracker } from '@jupyterlab/notebook';
import { LabIcon } from '@jupyterlab/ui-components';

import { ICONS } from '../icons';
import {
  NS,
  IDeckManager,
  CommandIds,
  CATEGORY,
  META,
  TSlideType,
  SLIDE_TYPES,
} from '../tokens';

import { NotebookDeckExtension } from './extension';
import { NotebookPresenter } from './presenter';

export const notebookPlugin: JupyterFrontEndPlugin<void> = {
  id: `${NS}:notebooks`,
  requires: [INotebookTracker, INotebookTools, IDeckManager],
  optional: [ICommandPalette],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebooks: INotebookTracker,
    notebookTools: INotebookTools,
    decks: IDeckManager,
    palette?: ICommandPalette
  ) => {
    const { commands } = app;
    const { __ } = decks;
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

    commands.addCommand(CommandIds.setSlideType, {
      label: (args: any) => __(`Slide Type: ${args.slideType}`),
      isVisible: () => !!notebooks.activeCell,
      icon: (args: any): LabIcon => {
        const slideType = args.slideType || 'null';
        return ICONS.slideshow[slideType] || ICONS.deckStart;
      },
      execute: (args: any) => {
        const { activeCell } = notebooks;
        if (!activeCell) {
          return;
        }

        const slideType = args.slideType || null;

        let cells = [activeCell];

        const { currentWidget } = notebooks;

        if (currentWidget) {
          const selection = notebooks.currentWidget?.content.getContiguousSelection();

          if (selection && selection.head != null && selection.anchor != null) {
            cells = currentWidget.content.widgets.slice(
              selection.anchor,
              selection.head + 1
            );
          }
        }

        for (const cell of cells) {
          let meta = {
            ...((cell.model.metadata.get(META.slideshow) as Record<string, any>) || {}),
          };

          if (slideType == null || slideType == 'null') {
            delete meta[META.slideType];
          } else {
            meta[META.slideType] = slideType;
          }

          if (!Object.keys(meta)) {
            cell.model.metadata.delete(META.slideshow);
          } else {
            cell.model.metadata.set(META.slideshow, meta);
          }
        }
      },
    });

    if (palette) {
      const category = __(CATEGORY);
      const command = CommandIds.setSlideType;
      const isPalette = true;
      function makeSlideTypeItem(slideType: TSlideType): IPaletteItem {
        return {
          category,
          command,
          args: { slideType, isPalette },
        };
      }
      for (const slideType of SLIDE_TYPES) {
        palette.addItem(makeSlideTypeItem(slideType));
      }
    }
  },
};
