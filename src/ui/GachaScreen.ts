/**
 * GachaScreen — Redesigned gacha machine for Spin Merge
 * Agent 8: Designer
 *
 * Spin animation, rarity sounds, particles for rare, drawn icons.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';
import { SkinManager } from '../meta/SkinManager';
import type { GachaResult } from '../meta/SkinManager';
import { ScoreSystem } from '../game/ScoreSystem';
import { IconFactory } from './IconFactory';
import { formatCompact } from './utils';

// ─── Styles ─────────────────────────────────────────

const BG_COLOR = 0x0f0f23;
const ACCENT = 0xe94560;
const CARD_COLOR = 0x16213e;
const TEXT_COLOR = 0xffffff;
const COIN_COLOR = 0xf8b500;
const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

const RARITY_COLORS: Record<string, number> = {
  common: 0x95a5a6,
  uncommon: 0x27ae60,
  rare: 0x3498db,
  legendary: 0xf1c40f,
};



// ─── GachaScreen Class ──────────────────────────────

export interface GachaCallbacks {
  onSpin: () => GachaResult | null;
  onFreeSpin: () => void;
  onLegendaryAd: (skinId: number) => void;
  onBack: () => void;
  onGoWardrobe?: () => void;
}

export class GachaScreen {
  public container: Container;

  private skinManager: SkinManager;
  private scoreSystem: ScoreSystem;
  private callbacks: GachaCallbacks;
  private resultContainer: Container;
  private capsuleGraphics: Graphics;
  private coinsText: Text;
  private screenWidth: number;
  private screenHeight: number;
  private isSpinning = false;
  private capsuleAngle = 0;
  private active = true;

  constructor(
    screenWidth: number,
    screenHeight: number,
    skinManager: SkinManager,
    scoreSystem: ScoreSystem,
    callbacks: GachaCallbacks,
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.skinManager = skinManager;
    this.scoreSystem = scoreSystem;
    this.callbacks = callbacks;
    this.container = new Container();
    this.resultContainer = new Container();
    this.capsuleGraphics = new Graphics();
    this.coinsText = new Text({ text: '' });

    this.buildUI();
    this.fadeIn();
  }

  private buildUI(): void {
    const { screenWidth } = this;
    const cx = screenWidth / 2;

    // ─── Title ───
    let yPos = 35;
    const gachaIcon = IconFactory.createGachaIcon(22);
    gachaIcon.position.set(cx - 70, yPos);
    this.container.addChild(gachaIcon);

    const title = new Text({
      text: t('gacha_title'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 32,
        fontWeight: '900',
        fill: TEXT_COLOR,
        dropShadow: { color: ACCENT, blur: 12, distance: 0, alpha: 0.4 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(cx + 10, yPos);
    this.container.addChild(title);

    // ─── Coins ───
    yPos += 38;
    const coinIcon = IconFactory.createCoinIcon(16);
    coinIcon.position.set(cx - 30, yPos);
    this.container.addChild(coinIcon);

    this.coinsText = new Text({
      text: formatCompact(this.scoreSystem.coins),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 20,
        fontWeight: '700',
        fill: COIN_COLOR,
      }),
    });
    this.coinsText.anchor.set(0.5);
    this.coinsText.position.set(cx + 15, yPos);
    this.container.addChild(this.coinsText);

    // ─── Capsule Machine ───
    yPos += 45;
    this.capsuleGraphics = new Graphics();
    this.drawCapsuleMachine(cx, yPos);
    this.container.addChild(this.capsuleGraphics);

    // ─── Spin Button (paid) ───
    yPos += 130;
    const cost = this.skinManager.getGachaCost();
    const canAfford = this.scoreSystem.coins >= cost;

    const spinBtnIcon = IconFactory.createCoinIcon(14);
    spinBtnIcon.scale.set(0.6);
    const spinBtn = this.createButton(
      `${t('gacha_spin')} [${cost}]`, cx, yPos, 200, 48,
      canAfford ? ACCENT : 0x222244,
      () => {
        if (this.isSpinning) return;
        const result = this.callbacks.onSpin();
        if (result) this.animateSpinThenShow(result);
      },
    );
    this.container.addChild(spinBtn);

    // ─── Free Spin Button ───
    yPos += 58;
    const freeBtn = this.createButton(
      t('gacha_free'), cx, yPos, 200, 48, 0x1a3a1a,
      () => {
        if (this.isSpinning) return;
        this.callbacks.onFreeSpin();
      },
    );
    this.container.addChild(freeBtn);

    // ─── Legendary Section ───
    yPos += 65;
    const legendTitle = new Text({
      text: t('gacha_legendary'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '800',
        fill: 0xf1c40f,
      }),
    });
    legendTitle.anchor.set(0.5);
    legendTitle.position.set(cx, yPos);
    this.container.addChild(legendTitle);

    yPos += 26;
    for (const skinId of [8, 9]) {
      const config = this.skinManager.getSkinConfig(skinId);
      const progress = this.skinManager.getLegendaryProgress(skinId);
      const total = this.skinManager.getLegendaryAdsRequired();
      const unlocked = this.skinManager.isSkinUnlocked(skinId);

      const row = new Container();
      const rowBg = new Graphics();
      rowBg.roundRect(0, 0, 280, 38, 8);
      rowBg.fill({ color: CARD_COLOR });
      row.addChild(rowBg);

      const nameText = new Text({
        text: config.name,
        style: new TextStyle({
          fontFamily: FONT_BODY,
          fontSize: 13,
          fontWeight: '600',
          fill: 0xf1c40f,
        }),
      });
      nameText.position.set(10, 12);
      row.addChild(nameText);

      if (unlocked) {
        const check = IconFactory.createCheckIcon(16);
        check.position.set(250, 19);
        check.scale.set(0.7);
        row.addChild(check);
      } else {
        const progressText = new Text({
          text: `${progress}/${total}`,
          style: new TextStyle({
            fontFamily: FONT_BODY,
            fontSize: 12,
            fill: 0x8899aa,
          }),
        });
        progressText.position.set(180, 13);
        row.addChild(progressText);

        const adBtn = new Container();
        const adBg = new Graphics();
        adBg.roundRect(0, 0, 28, 22, 4);
        adBg.fill({ color: 0x1a3a1a });
        adBtn.addChild(adBg);
        const adIcon = IconFactory.createAdIcon(12);
        adIcon.position.set(14, 11);
        adIcon.scale.set(0.45);
        adBtn.addChild(adIcon);
        adBtn.position.set(246, 8);
        adBtn.eventMode = 'static';
        adBtn.cursor = 'pointer';
        adBtn.on('pointerdown', () => { this.callbacks.onLegendaryAd(skinId); });
        row.addChild(adBtn);
      }

      row.position.set(cx - 140, yPos);
      this.container.addChild(row);
      yPos += 44;
    }

    // ─── Back Button ───
    yPos += 8;
    const backBtn = this.createButton(t('shop_back'), cx, yPos, 160, 42, 0x2a2a4e, this.callbacks.onBack);
    this.container.addChild(backBtn);

    // ─── Result overlay ───
    this.resultContainer.visible = false;
    this.container.addChild(this.resultContainer);
  }

  private drawCapsuleMachine(cx: number, y: number): void {
    const g = this.capsuleGraphics;
    g.clear();

    // Machine body
    g.roundRect(cx - 60, y - 20, 120, 110, 16);
    g.fill({ color: 0x1a1a3e, alpha: 0.9 });
    g.roundRect(cx - 60, y - 20, 120, 110, 16);
    g.stroke({ color: 0x4a90d9, alpha: 0.4, width: 2 });

    // Glass dome
    g.circle(cx, y + 25, 40);
    g.fill({ color: 0x0f0f23, alpha: 0.6 });
    g.circle(cx, y + 25, 40);
    g.stroke({ color: 0x6bb5ff, alpha: 0.3, width: 2 });

    // Capsule balls inside (rotate with animation)
    const colors = [0xff6b9d, 0x45b7d1, 0xf8b500, 0x96ceb4, 0xdda0dd];
    for (let i = 0; i < 5; i++) {
      const a = this.capsuleAngle + (i / 5) * Math.PI * 2;
      const bx = cx + Math.cos(a) * 18;
      const by = y + 25 + Math.sin(a) * 14;
      g.circle(bx, by, 7);
      g.fill({ color: colors[i], alpha: 0.85 });
      // Highlight
      g.circle(bx - 2, by - 2, 2.5);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    }

    // Shine
    g.ellipse(cx - 15, y + 10, 10, 16);
    g.fill({ color: 0xffffff, alpha: 0.06 });
  }

  /** Animate capsule spin before showing result */
  private animateSpinThenShow(result: GachaResult): void {
    this.isSpinning = true;
    const duration = 800;
    const startTime = performance.now();
    const startAngle = this.capsuleAngle;
    const cx = this.screenWidth / 2;
    const capsuleY = 35 + 38 + 45; // match buildUI yPos

    const animate = () => {
      if (!this.active) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Decelerate: fast → slow
      const eased = 1 - Math.pow(1 - progress, 3);
      this.capsuleAngle = startAngle + eased * Math.PI * 6; // 3 full spins

      this.drawCapsuleMachine(cx, capsuleY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.showResult(result);
      }
    };
    requestAnimationFrame(animate);
  }

  showResult(result: GachaResult): void {
    this.isSpinning = true;
    this.resultContainer.removeChildren();
    this.resultContainer.visible = true;

    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;

    // Dimmer
    const dimmer = new Graphics();
    dimmer.rect(0, 0, this.screenWidth, this.screenHeight);
    dimmer.fill({ color: 0x000000, alpha: 0.75 });
    dimmer.eventMode = 'static';
    this.resultContainer.addChild(dimmer);

    // Result card
    const card = new Container();
    const config = this.skinManager.getSkinConfig(result.skinId);
    const rarityColor = RARITY_COLORS[config.rarity] ?? TEXT_COLOR;

    const cardBg = new Graphics();
    cardBg.roundRect(-130, -120, 260, 240, 16);
    cardBg.fill({ color: CARD_COLOR });
    cardBg.roundRect(-130, -120, 260, 240, 16);
    cardBg.stroke({ color: rarityColor, alpha: 0.6, width: 3 });
    card.addChild(cardBg);

    // Status
    const statusText = result.isNew ? t('gacha_new') : t('gacha_duplicate');
    const status = new Text({
      text: statusText,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 26,
        fontWeight: '800',
        fill: result.isNew ? 0x27ae60 : 0xe74c3c,
      }),
    });
    status.anchor.set(0.5);
    status.position.set(0, -85);
    card.addChild(status);

    // Skin name
    const nameText = new Text({
      text: config.name,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 20,
        fontWeight: '700',
        fill: rarityColor,
      }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(0, -50);
    card.addChild(nameText);

    // Color palette preview
    const paletteY = -15;
    const swatchSize = 14;
    const totalWidth = config.colors.length * (swatchSize + 2);
    const startX = -totalWidth / 2;
    for (let i = 0; i < config.colors.length; i++) {
      const swatch = new Graphics();
      swatch.circle(startX + i * (swatchSize + 2) + swatchSize / 2, paletteY, swatchSize / 2);
      swatch.fill({ color: parseInt(config.colors[i].replace('#', ''), 16) });
      card.addChild(swatch);
    }

    // Rarity
    const rarityText = new Text({
      text: config.rarity.toUpperCase(),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 13,
        fontWeight: '700',
        fill: rarityColor,
      }),
    });
    rarityText.anchor.set(0.5);
    rarityText.position.set(0, 15);
    card.addChild(rarityText);

    // Refund info
    if (!result.isNew && result.refundCoins > 0) {
      const coinRefundIcon = IconFactory.createCoinIcon(12);
      coinRefundIcon.position.set(-25, 50);
      coinRefundIcon.scale.set(0.6);
      card.addChild(coinRefundIcon);
      const refund = new Text({
        text: `+${result.refundCoins}`,
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize: 18,
          fontWeight: '700',
          fill: COIN_COLOR,
        }),
      });
      refund.anchor.set(0.5);
      refund.position.set(10, 50);
      card.addChild(refund);
    }

    // OK button
    const okBtn = new Container();
    const okBg = new Graphics();
    okBg.roundRect(-50, -18, 100, 36, 8);
    okBg.fill({ color: ACCENT });
    okBtn.addChild(okBg);
    const okText = new Text({
      text: 'OK',
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '800',
        fill: TEXT_COLOR,
      }),
    });
    okText.anchor.set(0.5);
    okBtn.addChild(okText);
    okBtn.position.set(0, 90);
    okBtn.eventMode = 'static';
    okBtn.cursor = 'pointer';
    okBtn.on('pointerdown', () => {
      this.resultContainer.visible = false;
      this.isSpinning = false;
      this.refresh();
    });
    card.addChild(okBtn);

    card.position.set(cx, cy);
    card.scale.set(0.3);
    this.resultContainer.addChild(card);

    // Gold particles for rare drops
    if (config.rarity === 'rare' || config.rarity === 'legendary') {
      this.spawnParticles(cx, cy, rarityColor);
    }

    // Animate scale in
    const duration = 350;
    const startTime = performance.now();
    const animate = () => {
      if (!this.active) return;
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      const p = progress - 1;
      const scale = 1 + p * p * (2.7 * p + 1.7);
      card.scale.set(Math.max(0.3, scale));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private spawnParticles(cx: number, cy: number, color: number): void {
    const particles: { g: Graphics; vx: number; vy: number; life: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const g = new Graphics();
      g.circle(0, 0, 2 + Math.random() * 3);
      g.fill({ color, alpha: 0.8 });
      g.position.set(cx, cy);
      this.resultContainer.addChild(g);
      particles.push({
        g,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        life: 1,
      });
    }

    const animate = () => {
      if (!this.active) return;
      let alive = false;
      for (const p of particles) {
        p.life -= 0.015;
        if (p.life <= 0) {
          p.g.visible = false;
          continue;
        }
        alive = true;
        p.vy += 0.1; // gravity
        p.g.position.x += p.vx;
        p.g.position.y += p.vy;
        p.g.alpha = p.life;
      }
      if (alive) requestAnimationFrame(animate);
      else {
        for (const p of particles) {
          this.resultContainer.removeChild(p.g);
          p.g.destroy();
        }
      }
    };
    requestAnimationFrame(animate);
  }

  refresh(): void {
    // Destroy all old children to prevent memory leaks
    const children = [...this.container.children];
    for (const child of children) {
      this.container.removeChild(child);
      child.destroy({ children: true });
    }
    this.resultContainer = new Container();
    this.capsuleGraphics = new Graphics();
    this.buildUI();
  }

  private createButton(
    label: string, cx: number, cy: number, w: number, h: number,
    bgColor: number, onClick: () => void,
  ): Container {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, 12);
    bg.fill({ color: bgColor });
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 16,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.position.set(cx, cy);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.95); onClick(); });
    btn.on('pointerup', () => { btn.scale.set(1); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });
    btn.on('pointerover', () => { btn.scale.set(1.03); });
    btn.on('pointerout', () => { btn.scale.set(1); });

    return btn;
  }

  private fadeIn(): void {
    this.container.alpha = 0;
    const duration = 250;
    const startTime = performance.now();
    const animate = () => {
      if (!this.active) return;
      const p = Math.min((performance.now() - startTime) / duration, 1);
      this.container.alpha = p;
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  destroy(): void {
    this.active = false;
    this.container.destroy({ children: true });
  }
}
