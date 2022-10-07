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
  addAdapter(id: string, adapter: IDeckAdapter<any>): void;
}

export const IDeckManager = new Token<IDeckManager>(PLUGIN_ID);

export interface IDeckAdapter<T extends Widget> {
  accepts(widget: Widget): T | null;
  stop(widget: Widget): Promise<void>;
  start(widget: T): Promise<void>;
  go(widget: T, direction: TDirection): void;
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
}

export type TDirection = 'forward' | 'up' | 'back' | 'down';

export const DIRECTION: Record<string, TDirection> = {
  up: 'up',
  down: 'down',
  back: 'back',
  forward: 'forward',
};

export const DIRECTION_LABEL: Record<TDirection, string> = {
  forward: 'Go to next slide/fragment',
  back: 'Go to previous slide/fragment',
  up: 'Go to superslide',
  down: 'Go to next subslide',
};

export namespace CommandIds {
  export const start = 'deck:start';
  export const stop = 'deck:stop';
}

export type TSlideType = 'fragment' | 'slide' | 'subslide' | 'skip' | 'notes' | null;
