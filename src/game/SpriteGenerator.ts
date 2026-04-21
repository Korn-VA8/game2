import { Graphics } from 'pixi.js';
import { AnimalTheme } from './themes/AnimalTheme';
import { FoodTheme } from './themes/FoodTheme';
import { PlanetTheme } from './themes/PlanetTheme';
import { SpookyTheme } from './themes/SpookyTheme';
import { WinterTheme } from './themes/WinterTheme';
import { SportTheme } from './themes/SportTheme';
import { MemeTheme } from './themes/MemeTheme';
import { CrystalTheme } from './themes/CrystalTheme';
import { GoldenTheme } from './themes/GoldenTheme';
import { NeonTheme } from './themes/NeonTheme';
import type { SpriteDescriptor } from '../meta/SkinManager';

/** Emotion state of the creature for face/reaction rendering */
export type CreatureExpression = 'falling' | 'impact' | 'merging' | 'idle';

export interface SpritePhysicsInfo {
  vx: number;
  vy: number;
  squashX: number;
  squashY: number;
  squashVelX: number;
  squashVelY: number;
  wobbleAmplitude: number;
}

export class SpriteGenerator {

  /**
   * Draws the thematic sprite inside Graphics objects based on the current expression.
   * Separates background patterns (that can procedurally animate) from faces.
   */
  public static drawFace(
    bgCtx: Graphics,
    faceCtx: Graphics,
    r: number,
    descriptor: SpriteDescriptor,
    baseColor: number,
    accentColor: number,
    expression: CreatureExpression,
    time: number = 0,
    physics: SpritePhysicsInfo = { vx: 0, vy: 0, squashX: 1, squashY: 1, squashVelX: 0, squashVelY: 0, wobbleAmplitude: 0 }
  ): void {
    bgCtx.clear();
    faceCtx.clear();

    const level = descriptor.level;

    switch (descriptor.theme) {
      case 'animal':
        AnimalTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'food':
        FoodTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'planet':
        PlanetTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'spooky':
        SpookyTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'winter':
        WinterTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'sport':
        SportTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'meme':
        MemeTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'crystal':
        CrystalTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'golden':
        GoldenTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
      case 'neon':
        NeonTheme.draw(bgCtx, faceCtx, r, level, baseColor, accentColor, expression, time, physics);
        break;
    }
  }

  // ─── Shared Expression Helpers ─────────────────────────

  /** Draws anime-style kawaii eyes predicting emotions */
  public static drawKawaiiFace(g: Graphics, r: number, yOffset: number, expression: CreatureExpression = 'idle') {
    const eyeDist = r * 0.35;
    const eyeR = r * 0.12;

    if (expression === 'impact') {
      // > < tightly shut eyes
      g.moveTo(-eyeDist - eyeR, yOffset - eyeR).lineTo(-eyeDist, yOffset).lineTo(-eyeDist - eyeR, yOffset + eyeR);
      g.moveTo(eyeDist + eyeR, yOffset - eyeR).lineTo(eyeDist, yOffset).lineTo(eyeDist + eyeR, yOffset + eyeR);
      g.stroke({ color: 0x3A2240, width: 3, cap: 'round', join: 'round' });
      // Wavy mouth
      g.moveTo(-eyeR, yOffset + r*0.2).quadraticCurveTo(0, yOffset + r*0.1, eyeR, yOffset + r*0.2);
      g.stroke({ color: 0x3A2240, width: 2, cap: 'round' });

    } else if (expression === 'falling') {
      // O O wide open eyes
      g.circle(-eyeDist, yOffset - eyeR*0.5, eyeR * 1.2).fill({ color: 0x3A2240 });
      g.circle(eyeDist, yOffset - eyeR*0.5, eyeR * 1.2).fill({ color: 0x3A2240 });
      // Small pinpoint pupils
      g.circle(-eyeDist, yOffset - eyeR*0.5, eyeR * 0.3).fill({ color: 0xFFFFFF });
      g.circle(eyeDist, yOffset - eyeR*0.5, eyeR * 0.3).fill({ color: 0xFFFFFF });
      // Open screaming mouth
      g.ellipse(0, yOffset + r*0.25, eyeR*0.8, eyeR*1.5).fill({ color: 0x2A1B30 });

    } else if (expression === 'merging') {
      // ^ ^ happy closed eyes
      g.moveTo(-eyeDist - eyeR, yOffset).quadraticCurveTo(-eyeDist, yOffset - eyeR*1.5, -eyeDist + eyeR, yOffset);
      g.moveTo(eyeDist - eyeR, yOffset).quadraticCurveTo(eyeDist, yOffset - eyeR*1.5, eyeDist + eyeR, yOffset);
      g.stroke({ color: 0x3A2240, width: 3, cap: 'round' });
      // Happy open smile
      g.moveTo(-eyeR*1.5, yOffset + r*0.15).quadraticCurveTo(0, yOffset + r*0.4, eyeR*1.5, yOffset + r*0.15);
      g.stroke({ color: 0x3A2240, width: 3, cap: 'round' });
      g.ellipse(0, yOffset + r*0.25, eyeR*0.8, eyeR*0.8).fill({ color: 0xFF8888 }); // tongue

    } else {
      // Idle kawaii eyes
      g.circle(-eyeDist, yOffset, eyeR).fill({ color: 0x3A2240 });
      g.circle(eyeDist, yOffset, eyeR).fill({ color: 0x3A2240 });
      // Highlights
      g.circle(-eyeDist + eyeR * 0.2, yOffset - eyeR * 0.3, eyeR * 0.4).fill({ color: 0xFFFFFF });
      g.circle(eyeDist + eyeR * 0.2, yOffset - eyeR * 0.3, eyeR * 0.4).fill({ color: 0xFFFFFF });
      
      // Idle slight smile
      g.moveTo(-eyeR, yOffset + r*0.15).quadraticCurveTo(0, yOffset + r*0.25, eyeR, yOffset + r*0.15);
      g.stroke({ color: 0x3A2240, width: 2, cap: 'round' });
    }
  }

  /** Utility: draw a star shape */
  public static drawStar(g: Graphics, cx: number, cy: number, points: number, outer: number, inner: number, color: number) {
    g.moveTo(cx, cy - outer);
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        g.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    g.closePath();
    g.fill({ color });
  }
}
