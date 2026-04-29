/**
 * CampaignPopup — Victory / Defeat popup for campaign levels
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { t } from '../i18n/i18n';

const FONT_HEADING = "'Outfit', 'Nunito', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const ACCENT = 0xe94560;
const SUCCESS_COLOR = 0x44CF6C;

export interface CampaignPopupCallbacks {
  onNext?: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

export class CampaignPopup {
  public container: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    isVictory: boolean,
    levelId: number,
    callbacks: CampaignPopupCallbacks,
  ) {
    this.container = new Container();

    // Semi-transparent backdrop
    const backdrop = new Graphics();
    backdrop.rect(0, 0, screenWidth, screenHeight);
    backdrop.fill({ color: 0x000000, alpha: 0.7 });
    backdrop.eventMode = 'static'; // block clicks through
    this.container.addChild(backdrop);

    // Popup panel
    const panelW = Math.min(320, screenWidth - 40);
    const panelH = isVictory ? 280 : 240;
    const panelX = (screenWidth - panelW) / 2;
    const panelY = (screenHeight - panelH) / 2 - 20;

    const panel = new Graphics();
    panel.roundRect(panelX, panelY, panelW, panelH, 20);
    panel.fill({ color: 0x1a1a2e });
    panel.roundRect(panelX, panelY, panelW, panelH, 20);
    panel.stroke({ color: isVictory ? SUCCESS_COLOR : ACCENT, alpha: 0.6, width: 3 });
    this.container.addChild(panel);

    const cx = screenWidth / 2;
    let yPos = panelY + 40;

    // Title
    const titleText = isVictory ? t('campaign_victory') : t('campaign_defeat');
    const titleColor = isVictory ? SUCCESS_COLOR : ACCENT;
    const title = new Text({
      text: titleText,
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: 32,
        fontWeight: '900',
        fill: titleColor,
        letterSpacing: 2,
        dropShadow: { color: titleColor, blur: 15, distance: 0, alpha: 0.5 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(cx, yPos);
    this.container.addChild(title);

    // Level info
    yPos += 40;
    const levelText = new Text({
      text: `${t('campaign_level')} ${levelId}`,
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 18,
        fontWeight: '600',
        fill: 0x8899aa,
      }),
    });
    levelText.anchor.set(0.5);
    levelText.position.set(cx, yPos);
    this.container.addChild(levelText);

    // Star for victory
    if (isVictory) {
      yPos += 35;
      const star = new Text({
        text: '⭐',
        style: new TextStyle({ fontSize: 40 }),
      });
      star.anchor.set(0.5);
      star.position.set(cx, yPos);
      this.container.addChild(star);
      yPos += 15;
    }

    // Buttons
    yPos += 35;
    const btnW = Math.min(200, panelW - 40);
    const btnH = 46;

    if (isVictory && callbacks.onNext) {
      // Next Level button
      const nextBtn = this.createButton(
        t('campaign_next'), cx, yPos, btnW, btnH, SUCCESS_COLOR, 18, callbacks.onNext,
      );
      this.container.addChild(nextBtn);
      yPos += btnH + 12;
    }

    // Retry button
    const retryBtn = this.createButton(
      t('campaign_retry'), cx, yPos, btnW, btnH, 0x2a2a4e, 16, callbacks.onRetry,
    );
    this.container.addChild(retryBtn);
    yPos += btnH + 12;

    // Menu button
    const menuBtn = this.createButton(
      t('campaign_menu'), cx, yPos, btnW, btnH, 0x2a2a4e, 16, callbacks.onMenu,
    );
    this.container.addChild(menuBtn);

    // Animate in
    this.container.alpha = 0;
    this.animateIn();
  }

  private createButton(
    label: string, cx: number, cy: number, w: number, h: number,
    bgColor: number, fontSize: number, onClick: () => void,
  ): Container {
    const btn = new Container();

    const shadow = new Graphics();
    shadow.roundRect(-w / 2 + 2, -h / 2 + 3, w, h, 14);
    shadow.fill({ color: 0x000000, alpha: 0.3 });
    btn.addChild(shadow);

    const bg = new Graphics();
    bg.roundRect(-w / 2, -h / 2, w, h, 14);
    bg.fill({ color: bgColor });
    btn.addChild(bg);

    const hl = new Graphics();
    hl.roundRect(-w / 2 + 3, -h / 2 + 2, w - 6, h / 2 - 2, 12);
    hl.fill({ color: 0xffffff, alpha: 0.06 });
    btn.addChild(hl);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize,
        fontWeight: '700',
        fill: 0xffffff,
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.position.set(cx, cy);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    btn.on('pointerdown', () => { btn.scale.set(0.95); onClick(); });
    btn.on('pointerup', () => btn.scale.set(1));
    btn.on('pointerupoutside', () => btn.scale.set(1));

    return btn;
  }

  private animateIn(): void {
    const duration = 400;
    const startTime = performance.now();
    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      this.container.alpha = eased;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
