import type { ICellModel } from '@jupyterlab/cells';
import type { INotebookModel } from '@jupyterlab/notebook';
import { toArray } from '@lumino/algorithm';
import type { DockPanel, TabBar, Widget } from '@lumino/widgets';

export function getTabBars(dockPanel: DockPanel): TabBar<Widget>[] {
  return toArray(dockPanel.tabBars());
}

export function getCellModels(notebookModel: INotebookModel): ICellModel[] {
  return toArray(notebookModel.cells);
}

export function getSelectedWidget(dockPanel: DockPanel): Widget | null {
  const selectedWidgets = toArray(dockPanel.selectedWidgets());
  return selectedWidgets.length ? selectedWidgets[0] : null;
}
