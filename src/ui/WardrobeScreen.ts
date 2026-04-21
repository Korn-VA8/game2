/**
 * WardrobeScreen — Skin wardrobe for Spin Merge
 * Agent 8: Designer
 *
 * Grid of skin cards with mini-preview, selection, and lock states.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { SkinManager } from '../meta/SkinManager';
import { IconFactory } from './IconFactory';
import { t } from '../i18n/i18n';

// ─── Styles ─────────────────────────────────────────

const BG_COLOR = 0x0f0f23;
const CARD_COLOR = 0x16213e;
const ACCENT = 0xe94560;
const GREEN = 0x27ae60;
const TEXT_COLOR = 0xffffff;
const GRAY = 0x555555;
const FONT_HEADING = "'Outfit', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// ─── WardrobeScreen ─────────────────────────────────

export interface WardrobeCallbacks {
  onSelectSkin: (skinId: number) => void;
  onBack: () => void;
}

export class WardrobeScreen {
  public container: Container;

  private skinManager: SkinManager;
  private callbacks: WardrobeCallbacks;
  private screenWidth: number;
  private screenHeight: number;
  private cardsContainer: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    skinManager: SkinManager,
    callbacks: WardrobeCallbacks,
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.skinManager = skinManager;
    this.callbacks = callbacks;
    this.container = new Container();
    this.cardsContainer = new Container();

    this.buildUI();
    this.fadeIn();
  }

  private buildUI(): void {
    const { screenWidth, screenHeight } = this;
    const cx = screenWidth / 2;

    let yPos = 35;

    // ─── Title ───
    const wardrobeIcon = IconFactory.createWardrobeIcon(22);
    wardrobeIcon.position.set(cx - 80, yPos);
    this.container.addChild(wardrobeIcon);

    const title = new Text({
      text: t('wardrobe_title'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 32,
        fontWeight: '900',
        fill: TEXT_COLOR,
        letterSpacing: 3,
        dropShadow: { color: ACCENT, blur: 15, distance: 0, alpha: 0.4 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(cx + 10, yPos);
    this.container.addChild(title);

    // ─── Current skin name ───
    yPos += 38;
    const activeSkin = this.skinManager.getSkinConfig(this.skinManager.getActiveSkin());
    const currentText = new Text({
      text: `${t('wardrobe_current')}: ${activeSkin.name}`,
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 15,
        fill: 0x8899aa,
      }),
    });
    currentText.anchor.set(0.5);
    currentText.position.set(cx, yPos);
    this.container.addChild(currentText);

    // ─── Color preview (11 circles of active skin) ───
    yPos += 28;
    const previewR = 8;
    const previewGap = 4;
    const totalPreviewW = 11 * (previewR * 2 + previewGap) - previewGap;
    const previewStartX = cx - totalPreviewW / 2;

    for (let i = 0; i < 11; i++) {
      const colorHex = activeSkin.colors[i];
      const colorNum = parseInt(colorHex.replace('#', ''), 16);
      const dot = new Graphics();
      dot.circle(0, 0, previewR);
      dot.fill({ color: colorNum });
      dot.circle(0, 0, previewR);
      dot.stroke({ color: 0xffffff, alpha: 0.2, width: 1 });
      dot.position.set(previewStartX + i * (previewR * 2 + previewGap) + previewR, yPos);
      this.container.addChild(dot);
    }

    // ─── Skin cards grid ───
    yPos += 32;
    this.cardsContainer.removeChildren();
    const allSkins = this.skinManager.getAllSkinConfigs();
    const cols = 3;
    const cardW = Math.min(95, (screenWidth - 40 - (cols - 1) * 8) / cols);
    const cardH = cardW * 1.15;
    const gridGap = 8;
    const gridStartX = cx - (cols * cardW + (cols - 1) * gridGap) / 2;

    for (let i = 0; i < allSkins.length; i++) {
      const skin = allSkins[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * (cardW + gridGap);
      const y = yPos + row * (cardH + gridGap);

      const card = this.createSkinCard(skin.id, cardW, cardH);
      card.position.set(x, y);
      this.cardsContainer.addChild(card);
    }
    this.container.addChild(this.cardsContainer);

    // ─── Back button ───
    const allRows = Math.ceil(allSkins.length / cols);
    const backY = yPos + allRows * (cardH + gridGap) + 15;

    const backBtn = new Container();
    const backIcon = IconFactory.createBackIcon(16);
    backIcon.position.set(-30, 0);
    backBtn.addChild(backIcon);

    const backBg = new Graphics();
    backBg.roundRect(-70, -20, 140, 40, 10);
    backBg.fill({ color: 0x2a2a4e });
    backBtn.addChildAt(backBg, 0);

    const backText = new Text({
      text: t('wardrobe_back'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 18,
        fontWeight: '700',
        fill: TEXT_COLOR,
      }),
    });
    backText.anchor.set(0.5);
    backText.position.set(8, 0);
    backBtn.addChild(backText);

    backBtn.position.set(cx, backY);
    backBtn.eventMode = 'static';
    backBtn.cursor = 'pointer';
    backBtn.on('pointerdown', () => {
      backBtn.scale.set(0.95);
      this.callbacks.onBack();
    });
    backBtn.on('pointerup', () => { backBtn.scale.set(1); });
    backBtn.on('pointerupoutside', () => { backBtn.scale.set(1); });
    backBtn.on('pointerover', () => { backBtn.scale.set(1.05); });
    backBtn.on('pointerout', () => { backBtn.scale.set(1); });
    this.container.addChild(backBtn);
  }

  private createSkinCard(skinId: number, w: number, h: number): Container {
    const card = new Container();
    const config = this.skinManager.getSkinConfig(skinId);
    const isUnlocked = this.skinManager.isSkinUnlocked(skinId);
    const isActive = this.skinManager.getActiveSkin() === skinId;
    const isLegendary = config.rarity === 'legendary';

    // Card BG
    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 10);
    bg.fill({ color: isUnlocked ? CARD_COLOR : 0x0a0a1a });

    // Active border
    if (isActive) {
      bg.roundRect(0, 0, w, h, 10);
      bg.stroke({ color: GREEN, width: 2.5 });
    } else if (isUnlocked) {
      bg.roundRect(0, 0, w, h, 10);
      bg.stroke({ color: 0x4a90d9, alpha: 0.3, width: 1 });
    }
    card.addChild(bg);

    // Mini preview: 3 color circles (levels 1, 5, 11)
    const previewY = 18;
    const previewLevels = [0, 4, 10]; // indices
    const previewR = Math.min(8, w * 0.08);
    const previewSpacing = previewR * 2.5;
    const previewStartX = w / 2 - previewSpacing;

    for (let i = 0; i < 3; i++) {
      const colorHex = config.colors[previewLevels[i]];
      const colorNum = parseInt(colorHex.replace('#', ''), 16);
      const dot = new Graphics();

      if (isUnlocked) {
        dot.circle(0, 0, previewR + (i * 2));
        dot.fill({ color: colorNum, alpha: 0.85 });
        // Highlight
        dot.circle(-previewR * 0.2, -previewR * 0.2, (previewR + i * 2) * 0.3);
        dot.fill({ color: 0xffffff, alpha: 0.25 });
      } else {
        // Gray when locked
        dot.circle(0, 0, previewR + (i * 2));
        dot.fill({ color: 0x333344 });
      }

      dot.position.set(previewStartX + i * previewSpacing, previewY);
      card.addChild(dot);
    }

    // Skin name
    const nameText = new Text({
      text: config.name,
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: Math.min(11, w * 0.12),
        fontWeight: '600',
        fill: isUnlocked ? TEXT_COLOR : GRAY,
      }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(w / 2, h - 28);
    card.addChild(nameText);

    // Status indicator
    if (isActive) {
      const check = IconFactory.createCheckIcon(16);
      check.position.set(w / 2, h - 12);
      check.scale.set(0.7);
      card.addChild(check);
    } else if (!isUnlocked) {
      if (isLegendary) {
        // Show ad progress
        const progress = this.skinManager.getLegendaryProgress(skinId);
        const total = this.skinManager.getLegendaryAdsRequired();
        const adIcon = IconFactory.createAdIcon(12);
        adIcon.position.set(w / 2 - 15, h - 13);
        adIcon.scale.set(0.55);
        card.addChild(adIcon);
        const progText = new Text({
          text: `${progress}/${total}`,
          style: new TextStyle({
            fontFamily: FONT_BODY,
            fontSize: 10,
            fill: 0xaaaacc,
          }),
        });
        progText.anchor.set(0, 0.5);
        progText.position.set(w / 2 + 2, h - 12);
        card.addChild(progText);
      } else {
        const lock = IconFactory.createLockIcon(16);
        lock.position.set(w / 2, h - 12);
        lock.scale.set(0.6);
        card.addChild(lock);
      }
    }

    // Rarity badge color
    const rarityColors: Record<string, number> = {
      common: 0x95a5a6,
      uncommon: 0x27ae60,
      rare: 0x3498db,
      legendary: 0xf1c40f,
    };
    const badgeColor = rarityColors[config.rarity] ?? 0x95a5a6;
    const badge = new Graphics();
    badge.roundRect(w - 22, 4, 18, 6, 3);
    badge.fill({ color: badgeColor, alpha: 0.7 });
    card.addChild(badge);

    // Interactivity
    if (isUnlocked && !isActive) {
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointerdown', () => {
        card.scale.set(0.95);
        this.callbacks.onSelectSkin(skinId);
      });
      card.on('pointerup', () => { card.scale.set(1); });
      card.on('pointerupoutside', () => { card.scale.set(1); });
      card.on('pointerover', () => { card.scale.set(1.03); });
      card.on('pointerout', () => { card.scale.set(1); });
    }

    return card;
  }

  refresh(): void {
    this.container.removeChildren();
    this.cardsContainer = new Container();
    this.buildUI();
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
