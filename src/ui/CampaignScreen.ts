/**
 * CampaignScreen — Level select grid (5×6) for campaign mode
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CAMPAIGN_LEVELS } from '../game/LevelConfig';
import { t } from '../i18n/i18n';

const BG_COLOR = 0x0f0f23;
const ACCENT = 0xe94560;
const BTN_LOCKED = 0x1a1a2e;
const BTN_UNLOCKED = 0x2a2a4e;
const BTN_COMPLETED = 0x1e4a3a;
const TEXT_COLOR = 0xffffff;
const STAR_COLOR = 0xf8b500;
const FONT_HEADING = "'Outfit', 'Nunito', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

export interface CampaignScreenCallbacks {
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export class CampaignScreen {
  public container: Container;

  constructor(
    screenWidth: number,
    screenHeight: number,
    unlockedLevel: number,
    completedLevels: Set<number>,
    callbacks: CampaignScreenCallbacks,
  ) {
    this.container = new Container();

    const cx = screenWidth / 2;
    let yPos = 25;

    // Back button (top-left, above everything)
    const backBtn = this.createTextButton(t('shop_back'), 16, yPos, 14, () => callbacks.onBack());
    this.container.addChild(backBtn);

    // Title
    yPos += 35;
    const title = new Text({
      text: t('campaign_title'),
      style: new TextStyle({
        fontFamily: FONT_HEADING,
        fontSize: Math.min(30, screenWidth * 0.07),
        fontWeight: '900',
        fill: ACCENT,
        letterSpacing: 3,
        dropShadow: { color: ACCENT, blur: 15, distance: 0, alpha: 0.5 },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(cx, yPos);
    this.container.addChild(title);

    // Level grid 5×6
    yPos += 35;
    const cols = 5;
    const rows = 6;
    const btnSize = Math.min(55, (screenWidth - 60) / cols);
    const gap = 8;
    const gridWidth = cols * btnSize + (cols - 1) * gap;
    const gridLeft = cx - gridWidth / 2;

    for (let i = 0; i < CAMPAIGN_LEVELS.length; i++) {
      const level = CAMPAIGN_LEVELS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const bx = gridLeft + col * (btnSize + gap) + btnSize / 2;
      const by = yPos + row * (btnSize + gap + 10) + btnSize / 2;

      const isUnlocked = level.id <= unlockedLevel;
      const isCompleted = completedLevels.has(level.id);

      const btn = this.createLevelButton(
        level.id, bx, by, btnSize, isUnlocked, isCompleted,
        () => {
          if (isUnlocked) callbacks.onSelectLevel(level.id);
        },
      );
      this.container.addChild(btn);
    }

    // Fade in
    this.container.alpha = 0;
    this.fadeIn();
  }

  private createLevelButton(
    levelId: number, cx: number, cy: number, size: number,
    unlocked: boolean, completed: boolean, onClick: () => void,
  ): Container {
    const btn = new Container();

    // Background
    const bg = new Graphics();
    const color = completed ? BTN_COMPLETED : (unlocked ? BTN_UNLOCKED : BTN_LOCKED);
    bg.roundRect(-size / 2, -size / 2, size, size, 10);
    bg.fill({ color });
    btn.addChild(bg);

    if (!unlocked) {
      // Lock icon
      const lock = new Text({
        text: '🔒',
        style: new TextStyle({ fontSize: size * 0.35 }),
      });
      lock.anchor.set(0.5);
      btn.addChild(lock);
    } else {
      // Level number
      const numText = new Text({
        text: `${levelId}`,
        style: new TextStyle({
          fontFamily: FONT_HEADING,
          fontSize: size * 0.4,
          fontWeight: '800',
          fill: TEXT_COLOR,
        }),
      });
      numText.anchor.set(0.5, 0.5);
      numText.position.set(0, completed ? -size * 0.08 : 0);
      btn.addChild(numText);

      // Star if completed
      if (completed) {
        const star = new Text({
          text: '⭐',
          style: new TextStyle({ fontSize: size * 0.22 }),
        });
        star.anchor.set(0.5);
        star.position.set(0, size * 0.25);
        btn.addChild(star);
      }

      // Border glow for unlocked
      const border = new Graphics();
      border.roundRect(-size / 2 - 1, -size / 2 - 1, size + 2, size + 2, 11);
      border.stroke({ color: completed ? 0x44CF6C : 0x4a90d9, alpha: 0.5, width: 2 });
      btn.addChildAt(border, 0);
    }

    btn.position.set(cx, cy);
    btn.eventMode = unlocked ? 'static' : 'none';
    btn.cursor = unlocked ? 'pointer' : 'default';

    if (unlocked) {
      btn.on('pointerdown', () => {
        btn.scale.set(0.92);
        onClick();
      });
      btn.on('pointerup', () => btn.scale.set(1));
      btn.on('pointerupoutside', () => btn.scale.set(1));
    }

    return btn;
  }

  private createTextButton(label: string, x: number, y: number, fontSize: number, onClick: () => void): Container {
    const btn = new Container();
    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: FONT_BODY,
        fontSize,
        fontWeight: '600',
        fill: 0x8899aa,
      }),
    });
    txt.anchor.set(0, 0.5);
    btn.addChild(txt);
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);
    return btn;
  }

  private fadeIn(): void {
    const duration = 300;
    const startTime = performance.now();
    const animate = () => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      this.container.alpha = progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
