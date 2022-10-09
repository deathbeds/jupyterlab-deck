import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';

import * as _PACKAGE from '../package.json';

export const PACKAGE = _PACKAGE;

export const NS = PACKAGE.name;
export const VERSION = PACKAGE.version;
export const PLUGIN_ID = `${NS}:plugin`;
export const CATEGORY = 'Decks';

export interface IDeckManager {
  start(): Promise<void>;
  stop(): Promise<void>;
  __: (msgid: string, ...args: string[]) => string;
  go(direction: TDirection): void;
  cacheStyle(node: HTMLElement): void;
  uncacheStyle(node: HTMLElement): void;
  addAdapter(adapter: IDeckAdapter<any>): void;
}

export const IDeckManager = new Token<IDeckManager>(PLUGIN_ID);

export interface IDeckAdapter<T extends Widget> {
  id: string;
  rank: number;
  accepts(widget: Widget): T | null;
  stop(widget: Widget): Promise<void>;
  start(widget: T): Promise<void>;
  go(widget: T, direction: TDirection): Promise<void>;
  style(widget: T): void;
}

export namespace DATA {
  export const deckMode = 'jpDeckMode';
  export const presenting = 'presenting';
}

export namespace CSS {
  export const deck = 'jp-Deck';
  export const remote = 'jp-Deck-Remote';
  export const directions = 'jp-Deck-Remote-directions';
  export const direction = 'jp-deck-mod-direction';
  export const onScreen = 'jp-deck-mod-onscreen';
  export const visible = 'jp-deck-mod-visible';
  export const mainContent = 'jp-main-content-panel';
  export const presenting = `[data-jp-deck-mode='${DATA.presenting}']`;
}

export const EMOJI = '🃏';

export type TDirection = 'forward' | 'up' | 'back' | 'down';

export const DIRECTION: Record<string, TDirection> = {
  up: 'up',
  down: 'down',
  back: 'back',
  forward: 'forward',
};

export const DIRECTION_LABEL: Record<TDirection, string> = {
  forward: 'Go to next slide/fragment in Deck',
  back: 'Go to previous slide/fragment in Deck',
  up: 'Go to superslide in Deck',
  down: 'Go to next subslide in Deck',
};

export const DIRECTION_KEYS: Record<TDirection, string[]> = {
  forward: ['ArrowRight'],
  back: ['ArrowLeft'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
};

export namespace CommandIds {
  /* global */
  export const start = 'deck:start';
  export const stop = 'deck:stop';
  export const go = 'deck:go';
  /* directions */
  export const forward = 'deck:forward';
  export const back = 'deck:back';
  export const down = 'deck:down';
  export const up = 'deck:up';
}

/**
 * mutually-exclusive `cells/{i}/metadata/slideshow` values supported by
 * nbconvert, notebook, and lab UI
 **/
export type TSlideType = 'fragment' | 'slide' | 'subslide' | 'skip' | 'notes' | null;

/**
 * non-exclusive `cells/{i}/metadata/{x}` booleans supported by nbconvert
 *
 * https://github.com/jupyter/nbconvert/blob/main/share/templates/reveal/base.html.j2
 *
 * the interplay between these and the above are subtle, as any cell
 * (_including_ `note` and `skip`) can be both `*_start` and `*_end`, essentially
 * opening up new empty components.
 *
 * while the nbconvert behavior should be consider authoritative, it still seems... wrong.
 **/
export type TSlideExtraType =
  | 'slide_start'
  | 'subslide_start'
  | 'fragment_start'
  | 'fragment_end'
  | 'subslide_end'
  | 'slide_end';
