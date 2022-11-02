import {
  PACKAGE_NAME as FONTS_PACKAGE_NAME,
  IFontManager,
  IStyles,
} from '@deathbeds/jupyterlab-fonts';
import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import * as _PACKAGE from '../package.json';

import type { Layover } from './tools/layover';

export const PACKAGE = _PACKAGE;

export const NS = PACKAGE.name;
export const VERSION = PACKAGE.version;
export const PLUGIN_ID = `${NS}:plugin`;
export const CATEGORY = 'Decks';
/** The cell/notebook metadata. */

export interface IDeckManager {
  start(force: boolean): Promise<void>;
  stop(): Promise<void>;
  __: (msgid: string, ...args: string[]) => string;
  go(direction: TDirection, alternate?: TDirection): void;
  canGo(): Partial<TCanGoDirection>;
  cacheStyle(...nodes: HTMLElement[]): void;
  uncacheStyle(...nodes: HTMLElement[]): void;
  addPresenter(presenter: IPresenter<any>): void;
  addStylePreset(preset: IStylePreset): void;
  stylePresets: IStylePreset[];
  activeWidget: Widget | null;
  activeWidgetStack: Widget[];
  activateWidget(widget: Widget): void;
  layover: Layover | null;
  // signals
  activeChanged: ISignal<IDeckManager, void>;
  stylePresetsChanged: ISignal<IDeckManager, void>;
  // re-hosted
  fonts: IFontManager;
  showLayover(): void;
  hideLayover(): void;
  layoverChanged: ISignal<IDeckManager, void>;
  activePresenter: IPresenter<any> | null;
  setSlideType(slideType: TSlideType): void;
  getSlideType(): TSlideType;
  getLayerScope(): TLayerScope | null;
  setLayerScope(layerScope: TLayerScope | null): void;
  getPartStyles(): GlobalStyles | null;
  setPartStyles(styles: GlobalStyles | null): void;
}

export const IDeckManager = new Token<IDeckManager>(PLUGIN_ID);

export interface IPresenterCapbilities {
  layout?: boolean;
  slideType?: boolean;
  layerScope?: boolean;
  stylePart?: boolean;
  subslides?: boolean;
}

export const INCAPABLE: IPresenterCapbilities = Object.freeze({
  layout: false,
  slideType: false,
  layerScope: false,
  stylePart: false,
  subslides: false,
});

export interface IPresenterOptional<T> {
  setSlideType(widget: T, slideType: TSlideType): void;
  getSlideType(widget: T): TSlideType;
  setLayerScope(widget: T, layerType: TLayerScope | null): void;
  getLayerScope(widget: T): TLayerScope | null;
  getPartStyles(widget: T): GlobalStyles | null;
  setPartStyles(widget: T, styles: GlobalStyles | null): void;
}

export interface IPresenter<T extends Widget> extends Partial<IPresenterOptional<T>> {
  id: string;
  rank: number;
  capabilities: IPresenterCapbilities;
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
  export const layoutMode = 'jpDeckLayoutMode';
  export const designing = 'designing';
}

export namespace CSS {
  // lab
  export const disabled = 'jp-mod-disabled';
  export const icon = 'jp-icon3';
  export const iconBrand = 'jp-icon-brand0';
  export const iconContrast = 'jp-icon-contrast0';
  export const iconWarn = 'jp-icon-warn0';
  export const selectWrapper = 'jp-select-wrapper';
  export const styled = 'jp-mod-styled';
  export const accept = 'jp-mod-accept';
  export const active = 'jp-mod-active';
  export const mainContent = 'jp-main-content-panel';
  export const renderedMarkdown = 'jp-RenderedMarkdown';
  export const markdownViewer = 'jp-MarkdownViewer';
  // deck
  export const deck = 'jp-Deck';
  export const presenting = `[data-jp-deck-mode='${DATA.presenting}']`;
  // remote
  export const remote = 'jp-Deck-Remote';
  export const directions = 'jp-Deck-Remote-directions';
  export const stop = 'jp-deck-mod-stop';
  export const widgetStack = 'jp-Deck-Remote-WidgetStack';
  // notebook
  export const direction = 'jp-deck-mod-direction';
  export const onScreen = 'jp-deck-mod-onscreen';
  export const visible = 'jp-deck-mod-visible';
  export const layer = 'jp-deck-mod-layer';
  // metadata
  export const metaTool = 'jp-Deck-Metadata';
  export const selectSplit = 'jp-Deck-SelectSplit';
  export const toolLayer = 'jp-Deck-Tool-layer';
  export const toolPreset = 'jp-Deck-Tool-preset';
  export const apply = 'jp-deck-mod-apply';
  // layover
  export const layover = 'jp-Deck-Layover';
  export const layoverPart = 'jp-Deck-LayoverPart';
  export const layoverPartLabel = 'jp-Deck-LayoverLabel';
  export const layoverHandle = 'jp-Deck-LayoverHandle';
  export const dragging = 'jp-deck-mod-dragging';
  export const layoverUnstyle = 'jp-Deck-LayoverUnstyle';
  // design tools
  export const designTools = 'jp-Deck-DesignTools';
  export const selector = 'jp-Deck-DesignTools-Selector';
  export const slider = 'jp-Deck-DesignTools-Slider';
  export const slideType = 'jp-deck-mod-slidetype';
  export const layerScope = 'jp-deck-mod-layerscope';
  export const zoom = 'jp-deck-mod-zoom';
  export const opacity = 'jp-deck-mod-opacity';
  export const zIndex = 'jp-deck-mod-z-index';
  // sheets
  export const sheet = 'jp-Deck-Stylesheet';
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
  /* layover */
  export const showLayover = 'deck:show-layover';
  export const hideLayover = 'deck:hide-layover';
}

export namespace META {
  // nbconvert
  export const slideshow = 'slideshow';
  export const slideType = 'slide_type';
  // fonts
  export const fonts = FONTS_PACKAGE_NAME;
  export const nullSelector = '';
  export const presentingCell = `body[data-jp-deck-mode='presenting'] &`;
  // deck
  export const deck = NS.split('/')[1];
  export const layer = 'layer';
}

/**
 * mutually-exclusive `cells/{i}/metadata/slideshow` values supported by
 * nbconvert, notebook, and lab UI
 **/
export const SLIDE_TYPES = ['slide', 'subslide', null, 'fragment', 'notes', 'skip'];
export type TSlideType = typeof SLIDE_TYPES[number];

/** The scope of extents that will have this layer */

export const LAYER_SCOPES = ['deck', 'stack', 'slide', 'fragment'];
export type TLayerScope = typeof LAYER_SCOPES[number];

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
