/**
 * HUD — Redesigned Heads-Up Display during gameplay
 * Agent 8: Designer
 *
 * Top bar: drawn icons, compact numbers, energy bar, improved combo popup.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';
import { IconFactory } from './IconFactory';
import { formatCompact } from './utils';

// ─── Styles ─────────────────────────────────────────

const PANEL_COLOR = 0x16213e;
const PANEL_ALPHA = 0.9;
const ACCENT = 0xe94560;
const TEXT_COLOR = 0xffffff;
const COIN_COLOR = 0xf8b500;
const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";



// ─── HUD Class ──────────────────────────────────────

export interface HUDCallbacks {
  onPause?: () => void;
  onSoundToggle?: () => void;
}

export class HUD {
  public container: Container;

  private coinText: Text;
  private scoreText: Text;
  private comboText: Text;
  private pauseBtn: Container;
  private soundBtn: Container;
  private popups: Container;
  private width: number;
  private callbacks: HUDCallbacks;
  private soundOn = true;
  private active = true;

  // Score animation
  private displayedScore = 0;
  private targetScore = 0;
  private scoreAnimating = false;

  constructor(screenWidth: number, callbacks: HUDCallbacks = {}) {
    this.width = screenWidth;
    this.callbacks = callbacks;
    this.container = new Container();
    this.popups = new Container();

    const panelH = 52;

    // ─── Top panel background ───
    const panel = new Graphics();
    panel.roundRect(0, 0, screenWidth, panelH, 0);
    panel.fill({ color: PANEL_COLOR, alpha: PANEL_ALPHA });
    // Bottom glow line
    panel.moveTo(0, panelH);
    panel.lineTo(screenWidth, panelH);
    panel.stroke({ color: ACCENT, alpha: 0.2, width: 1 });
    this.container.addChild(panel);

    // ─── Coins (left) ───
    const coinIcon = IconFactory.createCoinIcon(16);
    coinIcon.position.set(20, panelH / 2);
    coinIcon.scale.set(0.85);
    this.container.addChild(coinIcon);

    this.coinText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '700',
        fill: COIN_COLOR,
      }),
    });
    this.coinText.anchor.set(0, 0.5);
    this.coinText.position.set(34, panelH / 2);
    this.container.addChild(this.coinText);

    // ─── Score (center) ───
    this.scoreText = new Text({
      text: '0',
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 26,
        fontWeight: '800',
        fill: TEXT_COLOR,
      }),
    });
    this.scoreText.anchor.set(0.5, 0.5);
    this.scoreText.position.set(screenWidth / 2, panelH / 2);
    this.container.addChild(this.scoreText);

    // ─── Energy bar (DISABLED) ───

    // ─── Pause button ───
    this.pauseBtn = this.createIconButton(
      IconFactory.createPauseIcon(18),
      screenWidth - 82, panelH / 2, 36,
      () => { this.callbacks.onPause?.(); },
    );
    this.container.addChild(this.pauseBtn);

    // ─── Sound button ───
    this.soundBtn = this.createIconButton(
      IconFactory.createSoundOnIcon(18),
      screenWidth - 40, panelH / 2, 36,
      () => {
        this.soundOn = !this.soundOn;
        this.rebuildSoundButton();
        this.callbacks.onSoundToggle?.();
      },
    );
    this.container.addChild(this.soundBtn);

    // ─── Combo text ───
    this.comboText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 40,
        fontWeight: '900',
        fill: ACCENT,
        dropShadow: { color: 0x000000, blur: 8, distance: 2 },
      }),
    });
    this.comboText.anchor.set(0.5);
    this.comboText.position.set(screenWidth / 2, 110);
    this.comboText.alpha = 0;
    this.container.addChild(this.comboText);

    // ─── Popups container ───
    this.container.addChild(this.popups);
  }

  // ─── Update Methods ───────────────────────────────

  updateCoins(coins: number): void {
    this.coinText.text = formatCompact(coins);
  }

  updateScore(score: number): void {
    this.targetScore = score;
    if (!this.scoreAnimating) {
      this.animateScore();
    }
  }

  setSoundIcon(on: boolean): void {
    this.soundOn = on;
    this.rebuildSoundButton();
  }

  // ─── Score Animation ──────────────────────────────

  private animateScore(): void {
    this.scoreAnimating = true;
    const duration = 300;
    const startTime = performance.now();
    const startScore = this.displayedScore;
    const endScore = this.targetScore;

    const animate = () => {
      if (!this.active) return;
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      this.displayedScore = Math.round(startScore + (endScore - startScore) * eased);
      this.scoreText.text = `${this.displayedScore}`;

      // Scale bounce
      if (progress < 0.3) {
        this.scoreText.scale.set(1 + (1 - progress / 0.3) * 0.15);
      } else {
        this.scoreText.scale.set(1);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scoreAnimating = false;
        this.displayedScore = endScore;
        this.scoreText.text = `${endScore}`;
        // Check if target changed during animation
        if (this.targetScore !== endScore) {
          this.animateScore();
        }
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Coin Popup Animation ─────────────────────────

  showCoinPopup(amount: number, worldX: number, worldY: number): void {
    const popup = new Text({
      text: `+${amount}`,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 20,
        fontWeight: '800',
        fill: 0x27ae60,
        dropShadow: { color: 0x000000, blur: 4, distance: 1 },
      }),
    });
    popup.anchor.set(0.5);
    popup.position.set(worldX, worldY);
    this.popups.addChild(popup);

    const startY = worldY;
    const duration = 700;
    const startTime = performance.now();

    const animate = () => {
      if (!this.active) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce up
      const yOffset = -50 * progress + 10 * Math.sin(progress * Math.PI);
      popup.position.y = startY + yOffset;
      popup.alpha = 1 - progress * progress;
      popup.scale.set(1 + progress * 0.2);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.popups.removeChild(popup);
        popup.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Combo Display ────────────────────────────────

  showCombo(count: number): void {
    this.comboText.text = `${t('game_combo')} x${count}!`;
    this.comboText.alpha = 1;
    this.comboText.scale.set(0);

    // Color flash based on combo count
    const colors = [0xe94560, 0xf8b500, 0x27ae60, 0x4a90d9, 0xff6ec7];
    const color = colors[Math.min(count - 2, colors.length - 1)];
    this.comboText.style.fill = color;

    const duration = 1200;
    const startTime = performance.now();

    const animate = () => {
      if (!this.active) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.2) {
        // Scale up: 0 → 1.3 (ease out back)
        const t = progress / 0.2;
        const p = t - 1;
        const scale = 1.3 * (1 + p * p * (2.7 * p + 1.7));
        this.comboText.scale.set(Math.max(0, scale));
      } else if (progress < 0.35) {
        // Settle: 1.3 → 1.0
        const t = (progress - 0.2) / 0.15;
        this.comboText.scale.set(1.3 - 0.3 * t);
      } else {
        // Hold then fade
        this.comboText.scale.set(1.0);
        const fadeProgress = (progress - 0.35) / 0.65;
        this.comboText.alpha = 1 - fadeProgress;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.comboText.alpha = 0;
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Helpers ──────────────────────────────────────

  private createIconButton(
    icon: Graphics, x: number, y: number, size: number, onClick: () => void,
  ): Container {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(-size / 2, -size / 2, size, size, 8);
    bg.fill({ color: 0x2a2a4e, alpha: 0.6 });
    btn.addChild(bg);
    btn.addChild(icon);

    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.9); onClick(); });
    btn.on('pointerup', () => { btn.scale.set(1); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });
    btn.on('pointerover', () => { btn.scale.set(1.05); });
    btn.on('pointerout', () => { btn.scale.set(1); });

    return btn;
  }

  private rebuildSoundButton(): void {
    // Remove old children except BG
    while (this.soundBtn.children.length > 1) {
      this.soundBtn.removeChildAt(1);
    }
    const icon = this.soundOn
      ? IconFactory.createSoundOnIcon(18)
      : IconFactory.createSoundOffIcon(18);
    this.soundBtn.addChild(icon);
  }

  destroy(): void {
    this.active = false;
    this.container.destroy({ children: true });
  }
}
