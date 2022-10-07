import { LabIcon } from '@jupyterlab/ui-components';

import DECK_START_SVG from '../style/img/deck.svg';

const DECK_STOP_SVG = DECK_START_SVG.replace('jp-icon3', 'jp-icon-warn0');

export namespace ICONS {
  export const deckStart = new LabIcon({ name: 'deck:start', svgstr: DECK_START_SVG });
  export const deckStop = new LabIcon({ name: 'deck:stop', svgstr: DECK_STOP_SVG });
}
