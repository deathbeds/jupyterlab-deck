import { Token } from '@lumino/coreutils';

import * as _PACKAGE from '../package.json';

export const PACKAGE = _PACKAGE;

export const NS = PACKAGE.name;
export const VERSION = PACKAGE.version;
export const PLUGIN_ID = `${NS}:plugin`;
export const CATEGORY = 'Decks';

export interface IDeckManager {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export const IDeckManager = new Token<IDeckManager>(PLUGIN_ID);

export namespace DATA {
  export const deckMode = 'jpDeckMode';
  export const presenting = 'presenting';
}

export namespace CSS {
  export const deck = 'jp-Deck';
  export const onScreen = 'jp-deck-mod-onscreen';
  export const visible = 'jp-deck-mod-visible';
  export const mainContent = 'jp-main-content-panel';
}

export namespace CommandIds {
  export const start = 'deck:start';
  export const stop = 'deck:stop';
}

export type TSlideType = 'fragment' | 'slide' | 'subslide' | 'skip' | 'notes' | null;
