import type { LabIcon } from '@jupyterlab/ui-components';
import type { Widget } from '@lumino/widgets';

import { ICONS } from '../icons';
import { IDeckManager, RANK, CSS } from '../tokens';

import { DeckButton } from './base/button';
import { DeckSlider } from './base/slider';

export type TSliderAttr = 'z-index' | 'zoom' | 'opacity';

export interface ISliderBounds {
  attrs: {
    min: number;
    max: number;
    step: number;
  };
  rank: number;
  defaultValue: number;
  suffix?: string;
  icon: LabIcon;
  className: string;
}
export type TSliders = {
  [key in TSliderAttr]: ISliderBounds;
};

export const SLIDER_CONFIG: TSliders = {
  zoom: {
    attrs: { min: 50, max: 500, step: 1 },
    defaultValue: 100,
    suffix: '%',
    rank: RANK.zoom,
    icon: ICONS.zoom,
    className: CSS.zoom,
  },
  'z-index': {
    attrs: { min: -10, max: 10, step: 1 },
    defaultValue: 0,
    rank: RANK.zIndex,
    icon: ICONS.zIndex,
    className: CSS.zIndex,
  },
  opacity: {
    attrs: { min: 0, max: 100, step: 1 },
    suffix: '%',
    defaultValue: 100,
    rank: RANK.opacity,
    icon: ICONS.opacity,
    className: CSS.opacity,
  },
};

export function addDefaultStyleTools(decks: IDeckManager) {
  for (const [id, config] of Object.entries(SLIDER_CONFIG)) {
    const { rank } = config;
    const createWidget = makeSliderFactory(decks, id, config);
    decks.tools.addTool('design', { id, rank, createWidget });
  }
  decks.tools.addTool('design', {
    id: 'layover',
    rank: RANK.layover,
    createWidget: async () => makeLayoverTool(decks),
  });
}

export function makeLayoverTool(decks: IDeckManager): DeckButton {
  const { design, __ } = decks;
  const showLabel = __('Show Layout');
  const hideLabel = __('Hide Layout');

  const onClick = () => {
    const newLayover = !design.layover;
    layoverTool.icon = newLayover ? ICONS.transformStop : ICONS.transformStart;
    layoverTool.title_ = newLayover ? hideLabel : showLabel;
    void (newLayover ? design.showLayover() : design.hideLayover());
  };

  const onActiveChanged = () => {
    const { activePresenter } = decks;
    const canLayout = activePresenter && activePresenter.capabilities.layout;
    canLayout ? layoverTool.show() : layoverTool.hide();
  };

  const layoverTool = new DeckButton({
    icon: ICONS.transformStart,
    onClick,
    title: showLabel,
  });

  layoverTool.disposed.connect(() => {
    decks.activeChanged.disconnect(onActiveChanged);
  });

  decks.activeChanged.connect(onActiveChanged);

  onActiveChanged();

  return layoverTool;
}

export function makeSliderFactory(
  decks: IDeckManager,
  attr: string,
  config: ISliderBounds
): () => Promise<Widget> {
  const factory = async () => {
    const slider = new DeckSlider({
      icon: config.icon,
      onChange: (value) =>
        decks.design.setPartStyles({ [attr]: `${value}:${config.suffix || ''}` }),
    });
    return slider;
  };
  return factory;
}
