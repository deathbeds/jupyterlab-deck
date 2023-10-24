import type { ICellModel } from '@jupyterlab/cells';
import type { INotebookModel } from '@jupyterlab/notebook';
import { toArray } from '@lumino/algorithm';
import { JSONExt } from '@lumino/coreutils';
import type { DockPanel, TabBar, Widget } from '@lumino/widgets';

const { emptyArray } = JSONExt;

export function getTabBars(dockPanel: DockPanel): TabBar<Widget>[] {
  if (!dockPanel) {
    return emptyArray as any as TabBar<Widget>[];
  }

  return toArray(dockPanel.tabBars());
}

export function getCellModels(notebookModel: INotebookModel): ICellModel[] {
  if (!notebookModel) {
    return emptyArray as any as ICellModel[];
  }

  return toArray(notebookModel.cells);
}
