import { Widget } from '@lumino/widgets';

import { IDeckManager, RANK } from '../tokens';

import { LayerScope, SlideType } from './selector';

export function addDefaultDeckTools(decks: IDeckManager) {
  decks.tools.addTool('design', {
    id: 'slide-type',
    createWidget: () => createSlideTypeTool(decks),
    rank: RANK.slideType,
  });
  decks.tools.addTool('design', {
    id: 'layer-scope',
    createWidget: () => createLayerScopeTool(decks),
    rank: RANK.layerScope,
  });
}

export async function createLayerScopeTool(decks: IDeckManager): Promise<Widget> {
  const layerScopeTool = new LayerScope({
    __: decks.__,
    label: 'Layer Scope',
    value: `${decks.getLayerScope()}`,
    onChange: (value: string) => decks.setLayerScope(value),
    onDisposed: () => decks.activeChanged.disconnect(onActiveChanged),
  });

  const onActiveChanged = () => {
    const { activePresenter } = decks;
    const canLayout = activePresenter && activePresenter.capabilities.layerScope;
    canLayout ? layerScopeTool.show() : layerScopeTool.hide();
    layerScopeTool.value = `${decks.getLayerScope()}`;
  };

  decks.activeChanged.connect(onActiveChanged);

  return layerScopeTool;
}

export async function createSlideTypeTool(decks: IDeckManager): Promise<Widget> {
  const slideTypeTool = new SlideType({
    __: decks.__,
    value: `${decks.getSlideType()}`,
    label: 'Slide Type',
    onChange: (value: string | null) => decks.setSlideType(`${value}`),
    onDisposed: () => decks.activeChanged.disconnect(onActiveChanged),
  });

  const onActiveChanged = () => {
    const { activePresenter } = decks;
    const canSlideType = activePresenter && activePresenter.capabilities.slideType;
    canSlideType ? slideTypeTool.show() : slideTypeTool.hide();
    slideTypeTool.value = `${decks.getSlideType()}`;
  };

  decks.activeChanged.connect(onActiveChanged);

  return slideTypeTool;
}
