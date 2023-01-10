import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ICommandPalette, IPaletteItem } from '@jupyterlab/apputils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { INotebookTools, INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
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
  ISetSlideTypeArgs,
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

    function getSelectedCells(
      currentWidget: NotebookPanel | null = null
    ): Cell<ICellModel>[] {
      currentWidget = currentWidget || notebooks.currentWidget;

      if (!currentWidget) {
        return [];
      }

      if (currentWidget !== app.shell.currentWidget) {
        return [];
      }

      const selection = notebooks.currentWidget?.content.getContiguousSelection();

      if (selection) {
        const { head, anchor } = selection;
        if (head != null && anchor != null) {
          let [a, b] = [head, anchor];
          if (a - b > 0) {
            [a, b] = [b, a];
          }
          return currentWidget.content.widgets.slice(a, b + 1);
        }
      }

      const activeCell = notebooks.activeCell;
      return activeCell ? [activeCell] : [];
    }

    function setCellSlideType(cell: Cell<ICellModel>, slideType: TSlideType) {
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

    commands.addCommand(CommandIds.setSlideType, {
      isVisible: () => !!getSelectedCells().length,
      label: (args: ISetSlideTypeArgs) => {
        let label = __(`Change to ${args.slideType} Slide Type`);
        const cells = getSelectedCells();
        if (cells.length > 1) {
          label = label + __(' (%1 cells)', `${cells.length}`);
        }
        return label;
      },
      icon: (args: ISetSlideTypeArgs): LabIcon => {
        const slideType = args.slideType || 'null';
        return ICONS.slideshow[slideType] || ICONS.deckStart;
      },
      execute: (args: ISetSlideTypeArgs) => {
        const slideType = args.slideType || null;
        const cells = getSelectedCells(args.widget || null);
        for (const cell of cells) {
          setCellSlideType(cell, slideType);
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
