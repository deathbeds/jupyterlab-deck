import { LabIcon, caretUpEmptyThinIcon } from '@jupyterlab/ui-components';

import NOTE from '../style/img/chat-remove-outline.svg';
import NULL from '../style/img/checkbox-blank-outline.svg';
import FRAGMENT from '../style/img/checkbox-intermediate-variant.svg';
import SKIP from '../style/img/close-box-outline.svg';
import DECK_START from '../style/img/deck.svg';
import SUBSLIDE from '../style/img/plus-box-multiple.svg';
import SLIDE from '../style/img/plus-box.svg';
import TRANSFORM_STOP from '../style/img/transform-stop.svg';
import TRANSFORM from '../style/img/transform.svg';
import WRAP_DISABLED from '../style/img/wrap-disabled.svg';
import WRAP from '../style/img/wrap.svg';

import { CSS, TSlideType } from './tokens';

const DECK_STOP = DECK_START.replace(CSS.icon, CSS.iconWarn);

export namespace ICONS {
  export const deckStart = new LabIcon({ name: 'deck:start', svgstr: DECK_START });
  export const deckStop = new LabIcon({ name: 'deck:stop', svgstr: DECK_STOP });
  export const goEnabled = new LabIcon({
    name: 'deck:go',
    svgstr: caretUpEmptyThinIcon.svgstr.replace(CSS.icon, CSS.iconContrast),
  });
  export const goDisabled = caretUpEmptyThinIcon;
  // layover
  export const transformStart = new LabIcon({
    name: 'deck:layover-start',
    svgstr: TRANSFORM,
  });
  export const transformStop = new LabIcon({
    name: 'deck:layover-stop',
    svgstr: TRANSFORM_STOP,
  });
  // slideshow
  export const slideshow: Record<'null' | Exclude<TSlideType, null>, LabIcon> = {
    slide: new LabIcon({ name: 'deck:slide', svgstr: SLIDE }),
    subslide: new LabIcon({ name: 'deck:subslide', svgstr: SUBSLIDE }),
    null: new LabIcon({ name: 'deck:null', svgstr: NULL }),
    fragment: new LabIcon({ name: 'deck:fragment', svgstr: FRAGMENT }),
    skip: new LabIcon({ name: 'deck:skip', svgstr: SKIP }),
    notes: new LabIcon({ name: 'deck:note', svgstr: NOTE }),
  };
  export const wrap = new LabIcon({ name: 'deck:wrap', svgstr: WRAP });
  export const wrapDisabled = new LabIcon({
    name: 'deck:wrap-disabled',
    svgstr: WRAP_DISABLED,
  });
}
