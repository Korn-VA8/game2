/**
 * MainMenu — Redesigned main menu for Spin Merge
 * Agent 8: Designer
 *
 * Gradient logo, animated barrel preview, wardrobe button, drawn icons.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';
import { IconFactory } from './IconFactory';
import { formatCompact } from './utils';

// ─── Styles ─────────────────────────────────────────

const BG_COLOR = 0x0f0f23;
const ACCENT = 0xe94560;
const BTN_COLOR = 0x2a2a4e;
const BTN_PLAY_COLOR = 0xe94560;
const TEXT_COLOR = 0xffffff;
const COIN_COLOR = 0xf8b500;
const FONT_HEADING = "'Outfit', 'Nunito', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";



// ─── MainMenu Class ─────────────────────────────────

export interface MainMenuCallbacks {
  onPlay: () => void;
  onShop: () => void;
  onGacha: () => void;
  onWardrobe: () => void;
  onSettings?: () => void;
}

export class MainMenu {
  public container: Container;

  private highScoreText: Text;
  private coinsText: Text;
  private playBtn: Container;
  private logoText: Text;
  private pulsePhase = 0;
  private glowPhase = 0;
  private animating = true;
  private animRafId = 0;
  private fadeRafId = 0;

  constructor(
    screenWidth: number,
    screenHeight: number,
    highScore: number,
    coins: number,
    callbacks: MainMenuCallbacks,
  ) {
    this.container = new Container();

    // Background handled by universal BackgroundSystem
    
    const cx = screenWidth / 2;
    let yPos = screenHeight * 0.1;

    // ─── Logo "✦ SPIN MERGE ✦" with glow ───
    this.logoText = new Text({
      text: '✦ SPIN MERGE ✦',
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: Math.min(52, screenWidth * 0.1),
        fontWeight: '900',
        fill: ACCENT,
        letterSpacing: 4,
        dropShadow: { color: ACCENT, blur: 25, distance: 0, alpha: 0.7 },
      }),
    });
    this.logoText.anchor.set(0.5);
    this.logoText.position.set(cx, yPos);
    this.container.addChild(this.logoText);

    // Subtitle
    yPos += 45;
    const subtitle = new Text({
      text: 'mi ❤️',
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 16,
        fontWeight: '500',
        fill: 0x8899aa,
        letterSpacing: 2,
      }),
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(cx, yPos);
    this.container.addChild(subtitle);

    // ─── Mini barrel preview ───
    yPos += 40;
    const barrelPreview = this.createBarrelPreview(50);
    barrelPreview.position.set(cx, yPos + 30);
    this.container.addChild(barrelPreview);
    yPos += 80;

    // ─── High Score ───
    yPos += 10;
    const trophyIcon = IconFactory.createTrophyIcon(20);
    trophyIcon.position.set(cx - 65, yPos);
    this.container.addChild(trophyIcon);

    this.highScoreText = new Text({
      text: `${t('menu_best')}: ${formatCompact(highScore)}`,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 20,
        fontWeight: '700',
        fill: 0xBB8FCE,
      }),
    });
    this.highScoreText.anchor.set(0.5);
    this.highScoreText.position.set(cx + 10, yPos);
    this.container.addChild(this.highScoreText);

    // ─── Coins ───
    yPos += 32;
    const coinIcon = IconFactory.createCoinIcon(18);
    coinIcon.position.set(cx - 55, yPos);
    this.container.addChild(coinIcon);

    this.coinsText = new Text({
      text: `${formatCompact(coins)}`,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 22,
        fontWeight: '700',
        fill: COIN_COLOR,
      }),
    });
    this.coinsText.anchor.set(0.5);
    this.coinsText.position.set(cx + 10, yPos);
    this.container.addChild(this.coinsText);

    // ─── Play Button (large, pulsating) ───
    yPos += 55;
    const playIcon = IconFactory.createPlayIcon(22);
    this.playBtn = this.createButton(
      t('menu_play'), cx, yPos, 230, 60, BTN_PLAY_COLOR, 26, () => {
        this.animating = false;
        callbacks.onPlay();
      }, playIcon,
    );
    this.container.addChild(this.playBtn);

    // ─── 2×2 Button Grid ───
    yPos += 75;
    const btnW = Math.min(135, (screenWidth - 48) / 2);
    const btnH = 50;
    const gap = 10;
    const gridLeft = cx - btnW - gap / 2;

    // Shop
    const shopIcon = IconFactory.createShopIcon(18);
    const shopBtn = this.createButton(
      t('menu_shop'), gridLeft + btnW / 2, yPos, btnW, btnH, BTN_COLOR, 16,
      callbacks.onShop, shopIcon,
    );
    this.container.addChild(shopBtn);

    // Wardrobe
    const wardrobeIcon = IconFactory.createWardrobeIcon(18);
    const wardrobeBtn = this.createButton(
      t('menu_wardrobe'), gridLeft + btnW + gap + btnW / 2, yPos, btnW, btnH, BTN_COLOR, 16,
      callbacks.onWardrobe, wardrobeIcon,
    );
    this.container.addChild(wardrobeBtn);

    // Gacha
    yPos += btnH + gap;
    const gachaIcon = IconFactory.createGachaIcon(18);
    const gachaBtn = this.createButton(
      t('menu_gacha'), gridLeft + btnW / 2, yPos, btnW, btnH, BTN_COLOR, 16,
      callbacks.onGacha, gachaIcon,
    );
    this.container.addChild(gachaBtn);

    // Settings
    const settingsIcon = IconFactory.createSettingsIcon(18);
    const settingsBtn = this.createButton(
      t('menu_settings_short'), gridLeft + btnW + gap + btnW / 2, yPos, btnW, btnH, BTN_COLOR, 16,
      () => { callbacks.onSettings?.(); }, settingsIcon,
    );
    this.container.addChild(settingsBtn);

    // ─── Version ───
    const version = new Text({
      text: 'v 1.0',
      style: new TextStyle({ fontFamily: FONT_BODY, fontSize: 11, fill: 0x444466 }),
    });
    version.anchor.set(0.5);
    version.position.set(cx, screenHeight - 15);
    this.container.addChild(version);

    // ─── Start animations ───
    this.startAnimations();

    // ─── Fade in ───
    this.container.alpha = 0;
    this.fadeIn();
  }

  // ─── Update data ──────────────────────────────────

  updateHighScore(score: number): void {
    this.highScoreText.text = `${t('menu_best')}: ${formatCompact(score)}`;
  }

  updateCoins(coins: number): void {
    this.coinsText.text = `${formatCompact(coins)}`;
  }

  // ─── Mini Barrel Preview ──────────────────────────

  private createBarrelPreview(r: number): Container {
    const c = new Container();
    const g = new Graphics();

    // Barrel arc
    const gapAngle = Math.PI * 0.5;
    g.arc(0, 0, r, -Math.PI / 2 + gapAngle / 2, -Math.PI / 2 + Math.PI * 2 - gapAngle / 2);
    g.stroke({ color: 0x4a90d9, alpha: 0.6, width: 2 });

    // Inner glow
    g.arc(0, 0, r - 1, -Math.PI / 2 + gapAngle / 2, -Math.PI / 2 + Math.PI * 2 - gapAngle / 2);
    g.stroke({ color: 0x6bb5ff, alpha: 0.15, width: 4 });

    // Mini creatures inside
    const creatureColors = [0xFF6B9D, 0xF8B500, 0x45B7D1, 0x96CEB4];
    const creatureR = [6, 8, 10, 7];
    const positions = [
      { x: -12, y: 15 }, { x: 10, y: 20 }, { x: -5, y: 28 }, { x: 15, y: 10 },
    ];
    for (let i = 0; i < 4; i++) {
      g.circle(positions[i].x, positions[i].y, creatureR[i]);
      g.fill({ color: creatureColors[i], alpha: 0.85 });
      // Tiny highlight
      g.circle(positions[i].x - creatureR[i] * 0.2, positions[i].y - creatureR[i] * 0.3, creatureR[i] * 0.25);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    }

    c.addChild(g);
    return c;
  }

  // ─── Animations ───────────────────────────────────

  private startAnimations(): void {
    const animate = () => {
      if (!this.animating) return;

      // Play button pulse: 1.0 ↔ 1.03 at 0.5Hz
      this.pulsePhase += 0.03;
      const scale = 1 + Math.sin(this.pulsePhase) * 0.03;
      this.playBtn.scale.set(scale);

      // Logo glow oscillation
      this.glowPhase += 0.02;
      const glowAlpha = 0.5 + Math.sin(this.glowPhase) * 0.3;
      this.logoText.style.dropShadow = {
        color: ACCENT,
        blur: 25,
        distance: 0,
        angle: 0,
        alpha: glowAlpha,
      };

      this.animRafId = requestAnimationFrame(animate);
    };
    this.animRafId = requestAnimationFrame(animate);
  }

  // ─── Fade In ──────────────────────────────────────

  private fadeIn(): void {
    const duration = 300;
    const startTime = performance.now();
    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      this.container.alpha = progress;
      if (progress < 1) {
        this.fadeRafId = requestAnimationFrame(animate);
      }
    };
    this.fadeRafId = requestAnimationFrame(animate);
  }

  // ─── Button Factory ───────────────────────────────

  private createButton(
    label: string, cx: number, cy: number, w: number, h: number,
    bgColor: number, fontSize: number, onClick: () => void,
    icon?: Graphics,
  ): Container {
    const btn = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.roundRect(-w / 2 + 2, -h / 2 + 3, w, h, 14);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    btn.addChild(shadow);

    // Background
    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, 14);
    bg.fill({ color: bgColor });
    btn.addChild(bg);

    // Highlight
    const hl = new Graphics();
    hl.roundRect(-w / 2 + 3, -h / 2 + 2, w - 6, h / 2 - 2, 12);
    hl.fill({ color: 0xffffff, alpha: 0.06 });
    btn.addChild(hl);

    // Icon + Text
    if (icon) {
      icon.position.set(-w / 2 + 28, 0);
      icon.scale.set(0.8);
      btn.addChild(icon);

      const txt = new Text({
        text: label,
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize,
          fontWeight: '700',
          fill: TEXT_COLOR,
        }),
      });
      txt.anchor.set(0, 0.5);
      txt.position.set(-w / 2 + 44, 0);
      btn.addChild(txt);
    } else {
      const txt = new Text({
        text: label,
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize,
          fontWeight: '700',
          fill: TEXT_COLOR,
        }),
      });
      txt.anchor.set(0.5);
      btn.addChild(txt);
    }

    btn.position.set(cx, cy);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    // Glow border container
    const glowBorder = new Graphics();
    glowBorder.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 15);
    glowBorder.stroke({ color: 0x6bb5ff, alpha: 0, width: 2 });
    btn.addChildAt(glowBorder, 0);

    btn.on('pointerdown', () => {
      btn.scale.set(0.95);
      onClick();
    });
    btn.on('pointerup', () => { btn.scale.set(1); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });
    btn.on('pointerover', () => {
      btn.scale.set(1.04);
      glowBorder.clear();
      glowBorder.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 15);
      glowBorder.stroke({ color: 0x6bb5ff, alpha: 0.3, width: 2 });
    });
    btn.on('pointerout', () => {
      btn.scale.set(1);
      glowBorder.clear();
      glowBorder.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 15);
      glowBorder.stroke({ color: 0x6bb5ff, alpha: 0, width: 2 });
    });

    return btn;
  }

  destroy(): void {
    this.animating = false;
    cancelAnimationFrame(this.animRafId);
    cancelAnimationFrame(this.fadeRafId);
    this.container.destroy({ children: true });
  }
}
