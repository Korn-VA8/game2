import { Container, Graphics, Text } from 'pixi.js';
import { t } from '../i18n/i18n';

export interface SettingsPopupCallbacks {
  onSoundToggle: () => void;
  onLanguageToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}

export class SettingsPopup {
  public container: Container;
  private bgDark: Graphics;
  private panel: Graphics;
  private callbacks: SettingsPopupCallbacks;
  
  private soundBtn: Container;
  private langBtn: Container;
  private resetBtn: Container;

  private soundText: Text;
  private langText: Text;
  private resetText: Text;

  private soundEnabled: boolean;
  private confirmResetState: boolean = false;

  constructor(
    sw: number, sh: number,
    soundEnabled: boolean,
    callbacks: SettingsPopupCallbacks
  ) {
    this.callbacks = callbacks;
    this.soundEnabled = soundEnabled;

    this.container = new Container();

    // Dark semi-transparent background
    this.bgDark = new Graphics();
    this.bgDark.rect(0, 0, sw, sh).fill({ color: 0x000000, alpha: 0.7 });
    this.bgDark.eventMode = 'static';
    this.container.addChild(this.bgDark);

    this.panel = new Graphics();
    const pw = Math.min(sw * 0.85, 400);
    const ph = 360;
    this.panel.roundRect(0, 0, pw, ph, 24).fill({ color: 0x24243e });
    this.panel.stroke({ color: 0x4a90d9, width: 4 });
    this.panel.position.set((sw - pw) / 2, (sh - ph) / 2);
    this.container.addChild(this.panel);

    // Title
    const title = new Text({
      text: t('settings_title'),
      style: {
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 32,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
      }
    });
    title.anchor.set(0.5);
    title.position.set(pw / 2, 40);
    this.panel.addChild(title);

    // Create buttons
    this.soundBtn = new Container();
    this.langBtn = new Container();
    this.resetBtn = new Container();

    this.soundText = this.createButton(this.soundBtn, pw / 2, 110, '', 0x334455);
    this.langText = this.createButton(this.langBtn, pw / 2, 180, t('settings_lang'), 0x4a90d9);
    this.resetText = this.createButton(this.resetBtn, pw / 2, 250, t('settings_reset'), 0xd94a4a);

    this.updateButtonLabels();

    // Close button
    const closeBtn = new Container();
    this.createButton(closeBtn, pw / 2, ph - 40, t('settings_close'), 0x555555, pw * 0.4, 50);
    
    // Interactions
    this.setupInteraction(this.soundBtn, () => {
      this.soundEnabled = !this.soundEnabled;
      this.updateButtonLabels();
      this.callbacks.onSoundToggle();
    });
    this.setupInteraction(this.langBtn, () => {
      this.callbacks.onLanguageToggle();
    });
    this.setupInteraction(this.resetBtn, () => {
      if (!this.confirmResetState) {
        this.confirmResetState = true;
        this.updateButtonLabels();
      } else {
        this.callbacks.onReset();
      }
    });
    this.setupInteraction(closeBtn, () => {
      this.callbacks.onClose();
    });

    // Fade in
    this.container.alpha = 0;
    this.animateFadeIn();
  }

  private createButton(container: Container, x: number, y: number, text: string, color: number, width: number = 240, height: number = 60): Text {
    const bg = new Graphics();
    bg.roundRect(-width/2, -height/2, width, height, 16).fill({ color });
    container.addChild(bg);

    const txt = new Text({
      text,
      style: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
      }
    });
    txt.anchor.set(0.5);
    container.addChild(txt);
    
    container.position.set(x, y);
    this.panel.addChild(container);

    return txt;
  }

  private updateButtonLabels(): void {
    const soundMark = this.soundEnabled ? 'ON' : 'OFF';
    this.soundText.text = `${t('settings_sound')}: ${soundMark}`;
    this.langText.text = t('settings_lang');
    
    if (this.confirmResetState) {
      this.resetText.text = t('settings_confirm');
      this.resetText.style.fill = 0xFFDDDD;
    } else {
      this.resetText.text = t('settings_reset');
      this.resetText.style.fill = 0xFFFFFF;
    }
  }

  private setupInteraction(container: Container, onClick: () => void): void {
    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerdown', () => {
      container.scale.set(0.95);
    });
    container.on('pointerup', () => {
      container.scale.set(1.0);
      onClick();
    });
    container.on('pointerupoutside', () => {
      container.scale.set(1.0);
    });
  }

  private animateFadeIn(): void {
    const duration = 200;
    const startTime = performance.now();
    const animate = () => {
      const p = Math.min((performance.now() - startTime) / duration, 1);
      this.container.alpha = p;
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
