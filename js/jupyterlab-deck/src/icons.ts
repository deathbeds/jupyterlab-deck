import { LabIcon, caretUpEmptyThinIcon } from '@jupyterlab/ui-components';

import DECK_START_SVG from '../style/img/deck.svg';
import TRANSFORM_STOP_SVG from '../style/img/transform-stop.svg';
import TRANSFORM_SVG from '../style/img/transform.svg';

import { CSS } from './tokens';

const DECK_STOP_SVG = DECK_START_SVG.replace(CSS.icon, CSS.iconWarn);

export namespace ICONS {
  export const deckStart = new LabIcon({ name: 'deck:start', svgstr: DECK_START_SVG });
  export const deckStop = new LabIcon({ name: 'deck:stop', svgstr: DECK_STOP_SVG });
  export const goEnabled = new LabIcon({
    name: 'deck:go',
    svgstr: caretUpEmptyThinIcon.svgstr.replace(CSS.icon, CSS.iconContrast),
  });
  export const goDisabled = caretUpEmptyThinIcon;
  export const transformStart = new LabIcon({
    name: 'deck:layover-start',
    svgstr: TRANSFORM_SVG,
  });
  export const transformStop = new LabIcon({
    name: 'deck:layover-stop',
    svgstr: TRANSFORM_STOP_SVG,
  });
}
