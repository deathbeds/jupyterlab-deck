import { IFontManager } from '@deathbeds/jupyterlab-fonts';
import type { GlobalStyles } from '@deathbeds/jupyterlab-fonts/lib/_schema';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { CommandRegistry } from '@lumino/commands';
import { Signal, ISignal } from '@lumino/signaling';

import { ICONS } from './icons';
import {
  CommandIds,
  IDeckManager,
  IDeckSettings,
  IDesignManager,
  IStylePreset,
} from './tokens';
import { Button } from './tools/button';
import type { Layover } from './tools/layover';

export class DesignManager implements IDesignManager {
  protected _decks: IDeckManager;
  protected _layover: Layover | null = null;
  protected _layoverChanged = new Signal<IDesignManager, void>(this);
  protected _commands: CommandRegistry;
  protected _fonts: IFontManager;
  protected _stylePresets = new Map<string, IStylePreset>();
  protected _stylePresetsChanged = new Signal<IDesignManager, void>(this);

  constructor(options: DesignManager.IOptions) {
    this._decks = options.decks;
    this._commands = options.commands;
    this._fonts = options.fonts;
    this._addCommands();
    this._addTools();
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
    let { activeWidget, activePresenter } = this._decks;
    if (activeWidget && activePresenter?.getPartStyles) {
      const styles = activePresenter.getPartStyles(activeWidget) || null;
      return styles;
    }
    /* istanbul ignore next */
    return null;
  }

  public setPartStyles(styles: GlobalStyles | null): void {
    let { activeWidget, activePresenter } = this._decks;
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
      label: this._decks.__('Show Slide Layout'),
      execute: () => this.showLayover(),
    });

    this._commands.addCommand(CommandIds.hideLayover, {
      icon: ICONS.transformStop,
      label: this._decks.__('Hide Slide Layout'),
      execute: () => this.hideLayover(),
    });
  }

  protected _addTools() {
    this._decks.tools.addTool('design', {
      id: 'layover',
      rank: 20,
      createWidget: async () => this.makeLayoverTool(),
    });
  }

  protected makeLayoverTool(): Button {
    const showLabel = this._decks.__('Show Layout');
    const hideLabel = this._decks.__('Hide Layout');

    const onClick = () => {
      const newLayover = !this.layover;
      layoverTool.icon = newLayover ? ICONS.transformStop : ICONS.transformStart;
      layoverTool.title_ = newLayover ? hideLabel : showLabel;
      void (newLayover ? this.showLayover() : this.hideLayover());
    };

    const layoverTool = new Button({
      icon: ICONS.transformStart,
      onClick,
      title: showLabel,
    });

    const onActiveChanged = () => {
      const { activePresenter } = this._decks;
      const canLayout = activePresenter && activePresenter.capabilities.layout;
      canLayout ? layoverTool.show() : layoverTool.hide();
    };

    this._decks.activeChanged.connect(onActiveChanged);

    onActiveChanged();

    return layoverTool;
  }

  get decks(): IDeckManager {
    return this._decks;
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
        manager: this._decks,
      });
      this._layoverChanged.emit(void 0);
    }
    await this._decks.start(true);
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
    decks: IDeckManager;
    commands: CommandRegistry;
    fonts: IFontManager;
  }
}
