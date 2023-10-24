import { toArray } from '@lumino/algorithm';
import { JSONExt } from '@lumino/coreutils';
import type { DockPanel, TabBar, Widget } from '@lumino/widgets';

const { emptyArray } = JSONExt;

export function tabBars(dockPanel: DockPanel): TabBar<Widget>[] {
  if (!dockPanel) {
    return emptyArray as any as TabBar<Widget>[];
  }

  let tabBars = dockPanel.tabBars();

  if (Array.isArray(tabBars)) {
    return tabBars;
  }

  return toArray(tabBars);
}
