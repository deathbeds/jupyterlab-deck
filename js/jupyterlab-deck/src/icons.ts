import { LabIcon, caretUpEmptyThinIcon } from '@jupyterlab/ui-components';

import NOTE from '../style/img/chat-remove-outline.svg';
import NULL from '../style/img/checkbox-blank-outline.svg';
import FRAGMENT from '../style/img/checkbox-intermediate-variant.svg';
import SKIP from '../style/img/close-box-outline.svg';
import DECK_START from '../style/img/deck.svg';
import LAYER_DECK from '../style/img/image-filter-hdr.svg';
import LAYER_NULL from '../style/img/image-off-outline.svg';
import LAYER_STACK from '../style/img/image-outline-multiple.svg';
import LAYER_SLIDE from '../style/img/image-outline.svg';
import ZOOM from '../style/img/loupe.svg';
import LAYER_FRAGMENT from '../style/img/message-image-outline.svg';
import Z_INDEX from '../style/img/order-numeric-descending.svg';
import SUBSLIDE from '../style/img/plus-box-multiple.svg';
import SLIDE from '../style/img/plus-box.svg';
import OPACITY from '../style/img/square-opacity.svg';
import TRANSFORM_STOP from '../style/img/transform-stop.svg';
import TRANSFORM from '../style/img/transform.svg';

import { CSS, TLayerScope, TSlideType } from './tokens';

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
  // design
  export const slideshow: Record<'null' | Exclude<TSlideType, null>, LabIcon> = {
    slide: new LabIcon({ name: 'deck:slide-slide', svgstr: SLIDE }),
    subslide: new LabIcon({ name: 'deck:slide-subslide', svgstr: SUBSLIDE }),
    null: new LabIcon({ name: 'deck:slide-null', svgstr: NULL }),
    fragment: new LabIcon({ name: 'deck:slide-fragment', svgstr: FRAGMENT }),
    skip: new LabIcon({ name: 'deck:slide-skip', svgstr: SKIP }),
    notes: new LabIcon({ name: 'deck:slide-note', svgstr: NOTE }),
  };
  export const layer: Record<TLayerScope | 'null', LabIcon> = {
    deck: new LabIcon({ name: 'deck:layer-deck', svgstr: LAYER_DECK }),
    stack: new LabIcon({ name: 'deck:layer-stack', svgstr: LAYER_STACK }),
    slide: new LabIcon({ name: 'deck:layer-slide', svgstr: LAYER_SLIDE }),
    fragment: new LabIcon({ name: 'deck:layer-fragment', svgstr: LAYER_FRAGMENT }),
    null: new LabIcon({ name: 'deck:layer-null', svgstr: LAYER_NULL }),
  };
  export const zoom = new LabIcon({ name: 'deck:zoom', svgstr: ZOOM });
  export const zIndex = new LabIcon({ name: 'deck:z-index', svgstr: Z_INDEX });
  export const opacity = new LabIcon({ name: 'deck:opacity', svgstr: OPACITY });
}
