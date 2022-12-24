import { IFontManager } from '@deathbeds/jupyterlab-fonts';
import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import { Signal, ISignal } from '@lumino/signaling';

import { ICONS } from './icons';
import {
  CommandIds,
  EMOJI,
  IDeckManager,
  IDeckSettings,
  IDesignManager,
  IStylePreset,
} from './tokens';
import type { Layover } from './tools/layover';

export class DesignManager implements IDesignManager {
  protected _tools = new Map<string, IDesignManager.IToolOptions>();
  protected _deckManager: IDeckManager;
  protected _layover: Layover | null = null;
  protected _layoverChanged = new Signal<IDesignManager, void>(this);
  protected _commands: CommandRegistry;
  protected _fonts: IFontManager;
  protected _stylePresets = new Map<string, IStylePreset>();
  protected _stylePresetsChanged = new Signal<IDesignManager, void>(this);

  constructor(options: DesignManager.IOptions) {
    this._deckManager = options.deckManager;
    this._commands = options.commands;
    this._fonts = options.fonts;
    this._addCommands();
  }

  public get fonts() {
    return this._fonts;
  }

  async stop(): Promise<void> {
    if (this._layover) {
      await this.hideLayover();
    }
  }

  onSettingsChanged(settings: ISettingRegistry.ISettings): void {
    let composite: IDeckSettings;
    composite = settings.composite as IDeckSettings;
    if (composite.stylePresets) {
      for (let keyPreset of Object.entries(composite.stylePresets)) {
        let [key, preset] = keyPreset;
        let { scope, label, styles } = preset;
        if (!styles || !label) {
          continue;
        }
        this._stylePresets.set(key, {
          key,
          scope: scope || 'any',
          styles,
          label,
        });
        this._stylePresetsChanged.emit(void 0);
      }
    }
  }

  public getPartStyles(): GlobalStyles | null {
    let { activeWidget, activePresenter } = this.deckManager;
    if (activeWidget && activePresenter?.getPartStyles) {
      const styles = activePresenter.getPartStyles(activeWidget) || null;
      return styles;
    }
    /* istanbul ignore next */
    return null;
  }
  public setPartStyles(styles: GlobalStyles | null): void {
    let { activeWidget, activePresenter } = this.deckManager;
    if (activeWidget && activePresenter?.setPartStyles) {
      activePresenter.setPartStyles(activeWidget, styles);
    }
  }

  public addStylePreset(preset: IStylePreset): void {
    this._stylePresets.set(preset.key, preset);
    this._stylePresetsChanged.emit(void 0);
  }

  public get stylePresets(): IStylePreset[] {
    return [...this._stylePresets.values()];
  }

  public get stylePresetsChanged(): ISignal<IDesignManager, void> {
    return this._stylePresetsChanged;
  }

  protected _addCommands() {
    this._commands.addCommand(CommandIds.showLayover, {
      icon: ICONS.transformStart,
      label: this._deckManager.__('Show Slide Layout'),
      execute: () => this.showLayover(),
    });

    this._commands.addCommand(CommandIds.hideLayover, {
      icon: ICONS.transformStop,
      label: this._deckManager.__('Hide Slide Layout'),
      execute: () => this.hideLayover(),
    });
  }

  get deckManager(): IDeckManager {
    return this._deckManager;
  }

  addTool(options: IDesignManager.IToolOptions): void {
    if (this._tools.has(options.id)) {
      console.warn(`${EMOJI} design tool already registered: ${options.id}`);
      return;
    }
    this._tools.set(options.id, options);
  }

  get layover(): Layover | null {
    return this._layover;
  }

  public get layoverChanged(): ISignal<IDesignManager, void> {
    return this._layoverChanged;
  }

  public async showLayover() {
    if (!this._layover) {
      this._layover = new (await import('./tools/layover')).Layover({
        manager: this._deckManager,
      });
      this._layoverChanged.emit(void 0);
    }
    await this._deckManager.start(true);
  }

  public async hideLayover() {
    if (this._layover) {
      this._layover.dispose();
      this._layover = null;
      this._layoverChanged.emit(void 0);
    }
  }
}

export namespace DesignManager {
  export interface IOptions {
    deckManager: IDeckManager;
    commands: CommandRegistry;
    fonts: IFontManager;
  }
}
