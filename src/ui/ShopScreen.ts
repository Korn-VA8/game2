/**
 * ShopScreen — Redesigned upgrade shop for Spin Merge
 * Agent 8: Designer
 *
 * Drawn icons, animated progress bars, deny feedback.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';
import { UpgradeManager } from '../meta/UpgradeManager';
import type { UpgradeId } from '../meta/UpgradeManager';
import { ScoreSystem } from '../game/ScoreSystem';
import { IconFactory } from './IconFactory';
import { formatCompact } from './utils';

// ─── Styles ─────────────────────────────────────────

const BG_COLOR = 0x0f0f23;
const CARD_COLOR = 0x16213e;
const ACCENT = 0xe94560;
const TEXT_COLOR = 0xffffff;
const COIN_COLOR = 0xf8b500;
const DISABLED_COLOR = 0x555555;
const MAX_COLOR = 0x27ae60;
const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ─── Upgrade icon factories ─────────────────────────

const UPGRADE_ICON_FACTORIES: Record<UpgradeId, (size: number) => Graphics> = {
  barrelSize: (s) => IconFactory.createBarrelIcon(s),
  spinEnergy: (s) => IconFactory.createEnergyIcon(s),
  dropMutation: (s) => IconFactory.createMutationIcon(s),
  magnetism: (s) => IconFactory.createMagnetIcon(s),
  coinMultiplier: (s) => IconFactory.createMultiplierIcon(s),
};

const UPGRADE_LABELS: Record<UpgradeId, string> = {
  barrelSize: 'shop_barrel',
  spinEnergy: 'shop_energy',
  dropMutation: 'shop_mutation',
  magnetism: 'shop_magnet',
  coinMultiplier: 'shop_multiplier',
};



// ─── ShopScreen Class ───────────────────────────────

export interface ShopCallbacks {
  onBuy: (upgradeId: UpgradeId) => void;
  onFreeAd: (upgradeId: UpgradeId) => void;
  onBack: () => void;
}

export class ShopScreen {
  public container: Container;

  private upgradeManager: UpgradeManager;
  private scoreSystem: ScoreSystem;
  private callbacks: ShopCallbacks;
  private cards: Map<UpgradeId, Container> = new Map();
  private screenWidth: number;
  private screenHeight: number;

  constructor(
    screenWidth: number,
    screenHeight: number,
    upgradeManager: UpgradeManager,
    scoreSystem: ScoreSystem,
    callbacks: ShopCallbacks,
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.upgradeManager = upgradeManager;
    this.scoreSystem = scoreSystem;
    this.callbacks = callbacks;
    this.container = new Container();

    this.buildUI();
    this.fadeIn();
  }

  private buildUI(): void {
    const { screenWidth, screenHeight } = this;

    // ─── Title ───
    const shopIcon = IconFactory.createShopIcon(22);
    shopIcon.position.set(screenWidth / 2 - 75, 38);
    this.container.addChild(shopIcon);

    const title = new Text({
      text: t('shop_title'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 32,
        fontWeight: '900',
        fill: TEXT_COLOR,
        dropShadow: { color: ACCENT, blur: 12, distance: 0, alpha: 0.4 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(screenWidth / 2 + 10, 40);
    this.container.addChild(title);

    // ─── Coins display ───
    const coinIcon = IconFactory.createCoinIcon(16);
    coinIcon.position.set(screenWidth / 2 - 30, 72);
    this.container.addChild(coinIcon);

    const coins = new Text({
      text: formatCompact(this.scoreSystem.coins),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 20,
        fontWeight: '700',
        fill: COIN_COLOR,
      }),
    });
    coins.anchor.set(0.5);
    coins.position.set(screenWidth / 2 + 15, 72);
    this.container.addChild(coins);

    // ─── Upgrade cards ───
    const upgrades = this.upgradeManager.getAllUpgradeInfo();
    const cardWidth = Math.min(screenWidth - 24, 380);
    const cardHeight = 90;
    const gap = 10;
    const startY = 100;

    for (let i = 0; i < upgrades.length; i++) {
      const info = upgrades[i];
      const card = this.createCard(info.id, cardWidth, cardHeight);
      card.position.set((screenWidth - cardWidth) / 2, startY + i * (cardHeight + gap));
      this.container.addChild(card);
      this.cards.set(info.id, card);
    }

    // ─── Back button ───
    const backBtn = this.createBackButton(screenWidth);
    backBtn.position.set(screenWidth / 2, startY + upgrades.length * (cardHeight + gap) + 25);
    this.container.addChild(backBtn);
  }

  private createCard(upgradeId: UpgradeId, w: number, h: number): Container {
    const card = new Container();
    const info = this.upgradeManager.getAllUpgradeInfo().find(u => u.id === upgradeId)!;
    const coins = this.scoreSystem.coins;

    // Card background with subtle gradient border
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 14);
    bg.fill({ color: CARD_COLOR });
    bg.roundRect(0, 0, w, h, 14);
    bg.stroke({ color: info.isMax ? MAX_COLOR : 0x4a90d9, alpha: info.isMax ? 0.3 : 0.12, width: 1.5 });
    card.addChild(bg);

    // ────── ROW 1: Icon + Name + Level ──────
    const iconFactory = UPGRADE_ICON_FACTORIES[upgradeId];
    const icon = iconFactory(22);
    icon.position.set(20, 22);
    icon.scale.set(0.85);
    card.addChild(icon);

    const name = new Text({
      text: t(UPGRADE_LABELS[upgradeId]),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 15,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    name.position.set(44, 10);
    card.addChild(name);

    const levelStr = info.isMax ? t('shop_max_level') : `${t('shop_level')} ${info.level}/${info.maxLevel}`;
    const levelText = new Text({
      text: levelStr,
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 11,
        fill: info.isMax ? MAX_COLOR : 0x8899aa,
      }),
    });
    levelText.position.set(44, 28);
    card.addChild(levelText);

    // ────── ROW 2: Progress bar + Buttons ──────
    const row2Y = 50;

    // Progress bar (spans from left icon area to before buttons)
    const barX = 16;
    const barW = info.isMax ? w - 32 : w - 200;
    const barH = 8;

    const barBg = new Graphics();
    barBg.roundRect(barX, row2Y + 8, barW, barH, 4);
    barBg.fill({ color: 0x0a0a1a });
    card.addChild(barBg);

    const fillW = Math.max(0, (info.level / info.maxLevel) * barW);
    if (fillW > 0) {
      const barFill = new Graphics();
      barFill.roundRect(barX, row2Y + 8, fillW, barH, 4);
      barFill.fill({ color: info.isMax ? MAX_COLOR : ACCENT });
      card.addChild(barFill);
    }

    // Buy / MAX section
    if (!info.isMax) {
      const canAfford = coins >= info.cost;
      const btnY = row2Y;

      // Buy button — compact with coin icon + formatted cost
      const buyBtn = new Container();
      const buyBg = new Graphics();
      buyBg.roundRect(0, 0, 90, 30, 8);
      buyBg.fill({ color: canAfford ? ACCENT : 0x222244 });
      buyBtn.addChild(buyBg);

      const coinSmall = IconFactory.createCoinIcon(10);
      coinSmall.position.set(14, 15);
      coinSmall.scale.set(0.5);
      buyBtn.addChild(coinSmall);

      const buyText = new Text({
        text: formatCompact(info.cost),
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize: 13,
          fontWeight: '700',
          fill: canAfford ? TEXT_COLOR : DISABLED_COLOR,
        }),
      });
      buyText.anchor.set(0.5);
      buyText.position.set(55, 15);
      buyBtn.addChild(buyText);

      buyBtn.position.set(w - 180, btnY);
      buyBtn.eventMode = 'static';
      buyBtn.cursor = canAfford ? 'pointer' : 'default';

      if (canAfford) {
        buyBtn.on('pointerdown', () => {
          buyBtn.scale.set(0.95);
          this.callbacks.onBuy(upgradeId);
        });
        buyBtn.on('pointerup', () => { buyBtn.scale.set(1); });
        buyBtn.on('pointerupoutside', () => { buyBtn.scale.set(1); });
      } else {
        buyBtn.on('pointerdown', () => {
          const startX = buyBtn.position.x;
          let shakeCount = 0;
          const shake = () => {
            shakeCount++;
            buyBtn.position.x = startX + (shakeCount % 2 === 0 ? 3 : -3);
            if (shakeCount < 6) {
              setTimeout(shake, 40);
            } else {
              buyBtn.position.x = startX;
            }
          };
          shake();
        });
      }
      card.addChild(buyBtn);

      // Free (ad) button
      const adBtn = new Container();
      const adBg = new Graphics();
      adBg.roundRect(0, 0, 78, 30, 8);
      adBg.fill({ color: 0x1a3a1a });
      adBtn.addChild(adBg);

      const adIcon = IconFactory.createAdIcon(12);
      adIcon.position.set(12, 15);
      adIcon.scale.set(0.5);
      adBtn.addChild(adIcon);

      const adText = new Text({
        text: t('shop_free_ad'),
        style: new TextStyle({
          fontFamily: FONT_BODY,
          fontSize: 11,
          fontWeight: '600',
          fill: 0x7bed9f,
        }),
      });
      adText.anchor.set(0.5);
      adText.position.set(48, 15);
      adBtn.addChild(adText);

      adBtn.position.set(w - 84, btnY);
      adBtn.eventMode = 'static';
      adBtn.cursor = 'pointer';
      adBtn.on('pointerdown', () => {
        adBtn.scale.set(0.95);
        this.callbacks.onFreeAd(upgradeId);
      });
      adBtn.on('pointerup', () => { adBtn.scale.set(1); });
      adBtn.on('pointerupoutside', () => { adBtn.scale.set(1); });
      card.addChild(adBtn);
    } else {
      // MAX badge centered on row2
      const check = IconFactory.createCheckIcon(18);
      check.position.set(w - 50, row2Y + 12);
      check.scale.set(0.8);
      card.addChild(check);

      const maxText = new Text({
        text: 'MAX',
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize: 13,
          fontWeight: '800',
          fill: MAX_COLOR,
        }),
      });
      maxText.anchor.set(0.5);
      maxText.position.set(w - 22, row2Y + 12);
      card.addChild(maxText);
    }

    return card;
  }

  /** Rebuild all cards (call after a purchase) */
  refresh(): void {
    for (const [, card] of this.cards) {
      this.container.removeChild(card);
      card.destroy({ children: true });
    }
    this.cards.clear();

    const upgrades = this.upgradeManager.getAllUpgradeInfo();
    const cardWidth = Math.min(this.screenWidth - 24, 380);
    const cardHeight = 90;
    const gap = 10;
    const startY = 100;

    for (let i = 0; i < upgrades.length; i++) {
      const info = upgrades[i];
      const card = this.createCard(info.id, cardWidth, cardHeight);
      card.position.set((this.screenWidth - cardWidth) / 2, startY + i * (cardHeight + gap));
      this.container.addChild(card);
      this.cards.set(info.id, card);
    }
  }

  private createBackButton(screenWidth: number): Container {
    const btn = new Container();
    const backIcon = IconFactory.createBackIcon(16);
    backIcon.position.set(-30, 0);
    btn.addChild(backIcon);

    const bg = new Graphics();
    bg.roundRect(-70, -20, 140, 40, 10);
    bg.fill({ color: 0x2a2a4e });
    btn.addChildAt(bg, 0);

    const txt = new Text({
      text: t('shop_back'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    txt.anchor.set(0.5);
    txt.position.set(8, 0);
    btn.addChild(txt);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { btn.scale.set(0.95); this.callbacks.onBack(); });
    btn.on('pointerup', () => { btn.scale.set(1); });
    btn.on('pointerupoutside', () => { btn.scale.set(1); });
    btn.on('pointerover', () => { btn.scale.set(1.05); });
    btn.on('pointerout', () => { btn.scale.set(1); });

    return btn;
  }

  private fadeIn(): void {
    this.container.alpha = 0;
    const duration = 250;
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
