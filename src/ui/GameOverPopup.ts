/**
 * GameOverPopup — Redesigned game over overlay for Spin Merge
 * Agent 8: Designer
 *
 * Animated score counters, confetti on record, drawn icons.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';
import { IconFactory } from './IconFactory';

// ─── Styles ─────────────────────────────────────────

const ACCENT = 0xe94560;
const CARD_COLOR = 0x16213e;
const TEXT_COLOR = 0xffffff;
const COIN_COLOR = 0xf8b500;
const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ─── GameOverPopup Class ────────────────────────────

export interface GameOverCallbacks {
  onContinue: (method: 'ad' | 'coins') => void;
  onRetry: () => void;
  onMenu: () => void;
}

export class GameOverPopup {
  public container: Container;
  private active = true;

  constructor(
    screenWidth: number,
    screenHeight: number,
    score: number,
    coinsEarned: number,
    isNewRecord: boolean,
    callbacks: GameOverCallbacks,
    canContinue: boolean = true,
    totalCoins: number = 0,
  ) {
    this.container = new Container();

    const cx = screenWidth / 2;
    const cy = screenHeight / 2;

    // ─── Dimmer ───
    const dimmer = new Graphics();
    dimmer.rect(0, 0, screenWidth, screenHeight);
    dimmer.fill({ color: 0x000000, alpha: 0.7 });
    dimmer.eventMode = 'static';
    this.container.addChild(dimmer);

    // ─── Card ───
    const cardW = Math.min(320, screenWidth - 40);
    const cardH = isNewRecord ? 380 : 350;
    const card = new Container();

    // Shadow
    const shadow = new Graphics();
    shadow.roundRect(-cardW / 2 + 4, -cardH / 2 + 6, cardW, cardH, 20);
    shadow.fill({ color: 0x000000, alpha: 0.4 });
    card.addChild(shadow);

    // Background
    const bg = new Graphics();
    bg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    bg.fill({ color: CARD_COLOR });
    bg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    bg.stroke({ color: ACCENT, alpha: 0.5, width: 2 });
    card.addChild(bg);

    // Highlight
    const hl = new Graphics();
    hl.roundRect(-cardW / 2 + 4, -cardH / 2 + 3, cardW - 8, cardH * 0.25, 18);
    hl.fill({ color: 0xffffff, alpha: 0.03 });
    card.addChild(hl);

    let yOffset = -cardH / 2 + 40;

    // ─── Title ───
    const title = new Text({
      text: t('gameover_title'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 36,
        fontWeight: '900',
        fill: ACCENT,
        dropShadow: { color: 0x000000, blur: 8, distance: 2 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(0, yOffset);
    card.addChild(title);

    // ─── New Record badge ───
    if (isNewRecord) {
      yOffset += 42;
      const trophyIcon = IconFactory.createTrophyIcon(20);
      trophyIcon.position.set(-60, yOffset);
      card.addChild(trophyIcon);

      const recordText = new Text({
        text: t('gameover_record'),
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize: 20,
          fontWeight: '800',
          fill: 0xf1c40f,
          dropShadow: { color: 0xf1c40f, blur: 12, distance: 0, alpha: 0.5 },
        }),
      });
      recordText.anchor.set(0.5);
      recordText.position.set(10, yOffset);
      card.addChild(recordText);

      // Spawn confetti
      this.spawnConfetti(card, cardW, cardH);
    }

    // ─── Animated Score ───
    yOffset += 42;
    const scoreLabel = new Text({
      text: `${t('gameover_score')}: 0`,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 22,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    scoreLabel.anchor.set(0.5);
    scoreLabel.position.set(0, yOffset);
    card.addChild(scoreLabel);

    // ─── Animated Coins ───
    yOffset += 34;
    const coinIcon = IconFactory.createCoinIcon(14);
    coinIcon.position.set(-50, yOffset);
    coinIcon.scale.set(0.7);
    card.addChild(coinIcon);

    const coinsLabel = new Text({
      text: `${t('gameover_coins')}: +0`,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '700',
        fill: COIN_COLOR,
      }),
    });
    coinsLabel.anchor.set(0.5);
    coinsLabel.position.set(10, yOffset);
    card.addChild(coinsLabel);

    // Animate counters
    this.animateCounter(scoreLabel, `${t('gameover_score')}: `, score, 400);
    this.animateCounter(coinsLabel, `${t('gameover_coins')}: +`, coinsEarned, 400, 200);

    // ─── Divider ───
    yOffset += 30;
    const divider = new Graphics();
    divider.moveTo(-cardW / 2 + 30, yOffset);
    divider.lineTo(cardW / 2 - 30, yOffset);
    divider.stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
    card.addChild(divider);

    // ─── Continue Buttons (only if not already used) ───
    yOffset += 24;
    if (canContinue) {
      // Button 1: Continue for Ad
      const adIcon = IconFactory.createAdIcon(14);
      adIcon.scale.set(0.6);
      const continueAdBtn = this.createButton(
        `${t('gameover_continue')} (Ad)`, -60, yOffset, 140, 46, 0x1a3a1a,
        () => { callbacks.onContinue('ad'); }, adIcon,
      );
      card.addChild(continueAdBtn);

      // Button 2: Continue for Coins
      const cost = 100;
      const canAfford = totalCoins >= cost;
      const coinIcon = IconFactory.createCoinIcon(14);
      coinIcon.scale.set(0.7);
      const continueCoinBtn = this.createButton(
        `${cost}`, 60, yOffset, 90, 46, canAfford ? 0x2a2a4e : 0x222222,
        () => {
          if (canAfford) callbacks.onContinue('coins');
        }, coinIcon,
      );
      card.addChild(continueCoinBtn);
    }

    // ─── Divider 2 ───
    yOffset += 36;
    const divider2 = new Graphics();
    divider2.moveTo(-cardW / 2 + 30, yOffset);
    divider2.lineTo(cardW / 2 - 30, yOffset);
    divider2.stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
    card.addChild(divider2);

    // ─── Retry Button ───
    yOffset += 24;
    const retryBtn = this.createButton(
      t('gameover_retry'), 0, yOffset, 220, 46, ACCENT,
      () => { callbacks.onRetry(); },
    );
    card.addChild(retryBtn);

    // ─── Menu Button ───
    yOffset += 54;
    const menuBtn = this.createButton(
      t('gameover_menu'), 0, yOffset, 220, 46, 0x2a2a4e,
      () => { callbacks.onMenu(); },
    );
    card.addChild(menuBtn);

    card.position.set(cx, cy);
    this.container.addChild(card);

    // ─── Animate in ───
    card.scale.set(0.4);
    card.alpha = 0;
    const duration = 350;
    const startTime = performance.now();
    const animate = () => {
      if (!this.active) return;
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      const p = progress - 1;
      const scale = 1 + p * p * (2.7 * p + 1.7);
      card.scale.set(Math.max(0.4, scale));
      card.alpha = progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ─── Counter Animation ────────────────────────────

  private animateCounter(
    text: Text, prefix: string, target: number,
    duration: number, delay = 0,
  ): void {
    setTimeout(() => {
      const startTime = performance.now();
      const animate = () => {
        if (!this.active) return;
        const progress = Math.min((performance.now() - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 2);
        const current = Math.round(target * eased);
        text.text = `${prefix}${current}`;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
  }

  // ─── Confetti ─────────────────────────────────────

  private spawnConfetti(parent: Container, cardW: number, cardH: number): void {
    const confettiColors = [0xf1c40f, 0xe94560, 0x27ae60, 0x4a90d9, 0xff6ec7, 0x00ffff];
    const particles: { g: Graphics; vx: number; vy: number; rot: number; life: number }[] = [];

    for (let i = 0; i < 50; i++) {
      const g = new Graphics();
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const size = 3 + Math.random() * 4;
      if (Math.random() > 0.5) {
        g.rect(-size / 2, -size / 4, size, size / 2);
      } else {
        g.circle(0, 0, size / 2);
      }
      g.fill({ color, alpha: 0.9 });
      g.position.set(
        (Math.random() - 0.5) * cardW * 0.8,
        -cardH / 2 - Math.random() * 50,
      );
      parent.addChild(g);
      particles.push({
        g,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        rot: (Math.random() - 0.5) * 0.2,
        life: 1,
      });
    }

    const animate = () => {
      if (!this.active) return;
      let alive = false;
      for (const p of particles) {
        p.life -= 0.005;
        if (p.life <= 0) {
          if (p.g.visible) {
            p.g.visible = false;
            parent.removeChild(p.g);
            p.g.destroy();
          }
          continue;
        }
        alive = true;
        p.g.position.x += p.vx;
        p.g.position.y += p.vy;
        p.g.rotation += p.rot;
        p.vx *= 0.99;
        p.g.alpha = Math.min(p.life * 2, 1);
      }
      if (alive) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  // ─── Button Factory ───────────────────────────────

  private createButton(
    label: string, cx: number, cy: number, w: number, h: number,
    bgColor: number, onClick: () => void, icon?: Graphics,
  ): Container {
    const btn = new Container();

    const shadow = new Graphics();
    shadow.roundRect(-w / 2 + 2, -h / 2 + 2, w, h, 10);
    shadow.fill({ color: 0x000000, alpha: 0.2 });
    btn.addChild(shadow);

    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, 10);
    bg.fill({ color: bgColor });
    btn.addChild(bg);

    if (icon) {
      icon.position.set(-w / 2 + 24, 0);
      btn.addChild(icon);
    }

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    txt.anchor.set(0.5);
    txt.position.set(icon ? 8 : 0, 0);
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

  destroy(): void {
    this.active = false;
    this.container.destroy({ children: true });
  }
}
