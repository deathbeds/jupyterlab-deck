import { IFontManager, IStyles } from '@deathbeds/jupyterlab-fonts';
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
  addStylePreset(preset: IStylePreset): void;
  stylePresets: IStylePreset[];
  activeWidget: Widget | null;
  // signals
  activeChanged: ISignal<IDeckManager, void>;
  stylePresetsChanged: ISignal<IDeckManager, void>;
  // re-hosted
  fonts: IFontManager;
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
  export const stop = 'jp-deck-mod-stop';
  export const metaTool = 'jp-Deck-Metadata';
  export const selectSplit = 'jp-Deck-SelectSplit';
  export const apply = 'jp-deck-mod-apply';
  // lab
  export const disabled = 'jp-mod-disabled';
  export const icon = 'jp-icon3';
  export const iconBrand = 'jp-icon-brand0';
  export const iconContrast = 'jp-icon-contrast0';
  export const iconWarn = 'jp-icon-warn0';
  export const selectWrapper = 'jp-select-wrapper';
  export const styled = 'jp-mod-styled';
  export const accept = 'jp-mod-accept';
  // tools
  export const toolLayer = 'jp-Deck-Tool-layer';
  export const toolPreset = 'jp-Deck-Tool-preset';
}

export namespace ID {
  export const layerSelect = 'id-jp-decktools-select-layer';
  export const presetSelect = 'id-jp-decktools-select-preset';
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

/** The scope of extents that will have this layer */
export type TLayerScope = 'deck' | 'stack' | 'slide' | 'fragment';

export const LAYER_SCOPES: TLayerScope[] = ['deck', 'stack', 'slide', 'fragment'];

export type TSelectLabels<T extends string> = Record<T, string>;

export const LAYER_TITLES: TSelectLabels<TLayerScope | '-'> = {
  '-': 'Do not show this cell as a layer.',
  deck: 'Show this layer on all future slides.',
  stack: 'Show this layer until the next slide.',
  slide: 'Show this layer until the next slider or subslide.',
  fragment: 'Show this until the next fragment.',
};

/** Expected cell metadata in the `jupyterlab-deck` namespace */
export interface ICellDeckMetadata {
  layer?: TLayerScope;
}

export interface IStylePreset {
  key: string;
  scope: 'layer' | 'slide' | 'deck' | 'any';
  label: string;
  styles: IStyles;
}

export interface IDeckSettings {
  active?: boolean;
  stylePresets?: {
    [key: string]: Partial<IStylePreset>;
  };
}
