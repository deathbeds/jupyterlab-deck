import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import * as _PACKAGE from '../package.json';

export const PACKAGE = _PACKAGE;

export const NS = PACKAGE.name;
export const VERSION = PACKAGE.version;
export const PLUGIN_ID = `${NS}:plugin`;
export const CATEGORY = 'Decks';
/** The cell/notebook metadata. */
export const META = NS.split('/')[1];

export interface IDeckManager {
  start(): Promise<void>;
  stop(): Promise<void>;
  __: (msgid: string, ...args: string[]) => string;
  go(direction: TDirection, alternate?: TDirection): void;
  canGo(): Partial<TCanGoDirection>;
  cacheStyle(node: HTMLElement): void;
  uncacheStyle(node: HTMLElement): void;
  addPresenter(presenter: IPresenter<any>): void;
  activeChanged: ISignal<IDeckManager, void>;
  activeWidget: Widget | null;
}

export const IDeckManager = new Token<IDeckManager>(PLUGIN_ID);

export interface IPresenter<T extends Widget> {
  id: string;
  rank: number;
  accepts(widget: Widget): T | null;
  stop(widget: Widget): Promise<void>;
  start(widget: T): Promise<void>;
  go(widget: T, direction: TDirection, alternate?: TDirection): Promise<void>;
  canGo(widget: T): Partial<TCanGoDirection>;
  style(widget: T): void;
  activeChanged: ISignal<IPresenter<T>, void>;
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
  export const layer = 'jp-deck-mod-layer';
  export const mainContent = 'jp-main-content-panel';
  export const presenting = `[data-jp-deck-mode='${DATA.presenting}']`;
  export const disabled = 'jp-mod-disabled';
  export const icon = 'jp-icon3';
  export const iconWarn = 'jp-icon-warn0';
  export const iconBrand = 'jp-icon-brand0';
  export const iconContrast = 'jp-icon-contrast0';
  export const stop = 'jp-deck-mod-stop';
}

export const EMOJI = '🃏';

export type TDirection = 'forward' | 'up' | 'back' | 'down';

export type TCanGoDirection = Record<TDirection, boolean>;

export const DIRECTION: Record<string, TDirection> = {
  up: 'up',
  down: 'down',
  back: 'back',
  forward: 'forward',
};

export const DIRECTION_LABEL: Record<TDirection, string> = {
  forward: 'Go to next slide/fragment in Deck',
  back: 'Go to previous slide/fragment in Deck',
  up: 'Go to slide, subslide, or fragment above in Deck',
  down: 'Go to next fragment or subslide in Deck',
};

export const DIRECTION_KEYS: Record<TDirection, string[]> = {
  forward: ['ArrowRight'],
  back: ['ArrowLeft'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
};

export const COMPOUND_LABEL = new Map<[TDirection, TDirection], string>([
  [[DIRECTION.down, DIRECTION.forward], 'Go to next fragment, subslide, or slide'],
  [[DIRECTION.up, DIRECTION.back], 'Go to previous fragment, subslide, or slide'],
]);

export const COMPOUND_KEYS = new Map<[TDirection, TDirection], string[]>([
  [[DIRECTION.down, DIRECTION.forward], ['Space']],
  [[DIRECTION.up, DIRECTION.back], ['Shift Space']],
]);

export namespace CommandIds {
  /* global */
  export const toggle = 'deck:toggle';
  export const start = 'deck:start';
  export const stop = 'deck:stop';
  /* nagivate */
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

/** The subset of the CSS needed to display a layer. */
export interface ISlideLayerPosition {
  'z-index'?: number;
  right?: string;
  left?: string;
  width?: string;
  height?: string;
  opacity?: string;
}

/** The scope of extents that will have this layer */
export type TLayerScope = 'slide' | 'subslide' | 'fragment' | 'deck';

/** Metadata for a layer */
export interface ISlideLayer {
  css?: ISlideLayerPosition;
  scope?: TLayerScope;
}

/** Expected cell metadata in the `jupyterlab-deck` namespace */
export interface ICellDeckMetadata {
  layer: ISlideLayer;
}
