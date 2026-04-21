/**
 * IconFactory — Procedural PixiJS Graphics icons for Spin Merge
 * Agent 8: Designer
 *
 * Replaces all emoji icons with cross-platform consistent drawn graphics.
 */

import { Graphics } from 'pixi.js';

// ─── Color tokens ───────────────────────────────────

const GOLD = 0xf8b500;
const WHITE = 0xffffff;
const PINK = 0xe94560;
const BLUE = 0x4a90d9;
const GREEN = 0x27ae60;
const GRAY = 0x8899aa;
const DARK = 0x2a2a4e;

// ─── Icon Factory ───────────────────────────────────

export class IconFactory {

  /** 💰 Gold coin with highlight */
  static createCoinIcon(size: number): Graphics {
    const g = new Graphics();
    const r = size / 2;
    // Coin body
    g.circle(0, 0, r);
    g.fill({ color: GOLD });
    // Inner ring
    g.circle(0, 0, r * 0.75);
    g.stroke({ color: 0xffc107, width: r * 0.08 });
    // ¢ symbol
    g.circle(0, 0, r * 0.3);
    g.stroke({ color: 0xe6a200, width: r * 0.1 });
    // Highlight
    g.ellipse(-r * 0.2, -r * 0.25, r * 0.2, r * 0.3);
    g.fill({ color: WHITE, alpha: 0.3 });
    return g;
  }

  /** ⚡ Energy bolt */
  static createEnergyIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 20;
    g.moveTo(-2 * s, -8 * s);
    g.lineTo(2 * s, -8 * s);
    g.lineTo(0, -1 * s);
    g.lineTo(4 * s, -1 * s);
    g.lineTo(-2 * s, 8 * s);
    g.lineTo(0, 1 * s);
    g.lineTo(-4 * s, 1 * s);
    g.closePath();
    g.fill({ color: 0xffeb3b });
    g.stroke({ color: 0xffc107, width: s * 0.8 });
    return g;
  }

  /** 🏆 Trophy */
  static createTrophyIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Cup body
    g.moveTo(-6 * s, -6 * s);
    g.lineTo(6 * s, -6 * s);
    g.lineTo(4 * s, 2 * s);
    g.quadraticCurveTo(0, 6 * s, -4 * s, 2 * s);
    g.closePath();
    g.fill({ color: GOLD });
    // Stem
    g.rect(-1.5 * s, 2 * s, 3 * s, 4 * s);
    g.fill({ color: GOLD });
    // Base
    g.roundRect(-5 * s, 6 * s, 10 * s, 2.5 * s, s);
    g.fill({ color: GOLD });
    // Handles
    g.arc(-6 * s, -2 * s, 3 * s, -Math.PI / 2, Math.PI / 2);
    g.stroke({ color: GOLD, width: s * 1.2 });
    g.arc(6 * s, -2 * s, 3 * s, Math.PI / 2, -Math.PI / 2);
    g.stroke({ color: GOLD, width: s * 1.2 });
    // Highlight
    g.ellipse(-2 * s, -3 * s, 1.5 * s, 3 * s);
    g.fill({ color: WHITE, alpha: 0.25 });
    return g;
  }

  /** ▶ Play button (triangle in circle) */
  static createPlayIcon(size: number): Graphics {
    const g = new Graphics();
    const r = size / 2;
    // Circle
    g.circle(0, 0, r);
    g.fill({ color: PINK });
    // Triangle
    const tr = r * 0.45;
    g.moveTo(-tr * 0.6, -tr);
    g.lineTo(tr, 0);
    g.lineTo(-tr * 0.6, tr);
    g.closePath();
    g.fill({ color: WHITE });
    return g;
  }

  /** 🛒 Shop bag icon */
  static createShopIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Bag body
    g.roundRect(-7 * s, -2 * s, 14 * s, 12 * s, 2 * s);
    g.fill({ color: BLUE });
    // Handle
    g.arc(0, -2 * s, 4 * s, Math.PI, 0);
    g.stroke({ color: BLUE, width: s * 1.8 });
    // Horizontal line
    g.moveTo(-5 * s, 2 * s);
    g.lineTo(5 * s, 2 * s);
    g.stroke({ color: WHITE, alpha: 0.3, width: s * 0.8 });
    return g;
  }

  /** 🎰 Gacha star icon */
  static createGachaIcon(size: number): Graphics {
    const g = new Graphics();
    const r = size / 2;
    // Circle bg
    g.circle(0, 0, r);
    g.fill({ color: 0x8854d0 });
    // Star
    const sr = r * 0.55;
    const ir = sr * 0.4;
    for (let i = 0; i < 5; i++) {
      const outerAngle = (-Math.PI / 2) + (i * 2 * Math.PI / 5);
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = Math.cos(outerAngle) * sr;
      const oy = Math.sin(outerAngle) * sr;
      const ix = Math.cos(innerAngle) * ir;
      const iy = Math.sin(innerAngle) * ir;
      if (i === 0) g.moveTo(ox, oy);
      else g.lineTo(ox, oy);
      g.lineTo(ix, iy);
    }
    g.closePath();
    g.fill({ color: GOLD });
    return g;
  }

  /** ⚙ Settings gear */
  static createSettingsIcon(size: number): Graphics {
    const g = new Graphics();
    const r = size / 2;
    const outerR = r * 0.85;
    const innerR = r * 0.55;
    const teeth = 8;
    // Gear shape
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * Math.PI * 2;
      const a2 = ((i + 0.35) / teeth) * Math.PI * 2;
      const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
      const a4 = ((i + 0.85) / teeth) * Math.PI * 2;
      if (i === 0) g.moveTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
      g.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      g.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
      g.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
      const next = ((i + 1) / teeth) * Math.PI * 2;
      g.lineTo(Math.cos(next) * outerR, Math.sin(next) * outerR);
    }
    g.closePath();
    g.fill({ color: GRAY });
    // Center hole
    g.circle(0, 0, r * 0.22);
    g.fill({ color: DARK });
    return g;
  }

  /** 📺 Ad screen icon */
  static createAdIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Screen
    g.roundRect(-8 * s, -6 * s, 16 * s, 11 * s, 1.5 * s);
    g.fill({ color: 0x2a4a2a });
    g.roundRect(-8 * s, -6 * s, 16 * s, 11 * s, 1.5 * s);
    g.stroke({ color: GREEN, width: s * 0.8 });
    // Play triangle
    const tr = 3 * s;
    g.moveTo(-tr * 0.5, -tr * 0.7);
    g.lineTo(tr * 0.7, 0);
    g.lineTo(-tr * 0.5, tr * 0.7);
    g.closePath();
    g.fill({ color: GREEN });
    // Stand
    g.rect(-1 * s, 5 * s, 2 * s, 2 * s);
    g.fill({ color: GRAY });
    g.rect(-4 * s, 7 * s, 8 * s, 1 * s);
    g.fill({ color: GRAY });
    return g;
  }

  /** 🔊 Sound on */
  static createSoundOnIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Speaker body
    g.moveTo(-6 * s, -3 * s);
    g.lineTo(-2 * s, -3 * s);
    g.lineTo(2 * s, -6 * s);
    g.lineTo(2 * s, 6 * s);
    g.lineTo(-2 * s, 3 * s);
    g.lineTo(-6 * s, 3 * s);
    g.closePath();
    g.fill({ color: WHITE });
    // Sound waves
    g.arc(3 * s, 0, 3 * s, -Math.PI / 3, Math.PI / 3);
    g.stroke({ color: WHITE, alpha: 0.7, width: s });
    g.arc(3 * s, 0, 5.5 * s, -Math.PI / 3, Math.PI / 3);
    g.stroke({ color: WHITE, alpha: 0.4, width: s });
    return g;
  }

  /** 🔇 Sound off */
  static createSoundOffIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Speaker body
    g.moveTo(-6 * s, -3 * s);
    g.lineTo(-2 * s, -3 * s);
    g.lineTo(2 * s, -6 * s);
    g.lineTo(2 * s, 6 * s);
    g.lineTo(-2 * s, 3 * s);
    g.lineTo(-6 * s, 3 * s);
    g.closePath();
    g.fill({ color: GRAY });
    // X mark
    g.moveTo(4 * s, -4 * s);
    g.lineTo(8 * s, 4 * s);
    g.stroke({ color: PINK, width: s * 1.2 });
    g.moveTo(8 * s, -4 * s);
    g.lineTo(4 * s, 4 * s);
    g.stroke({ color: PINK, width: s * 1.2 });
    return g;
  }

  /** ⏸ Pause icon */
  static createPauseIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    const barW = 3 * s;
    const barH = 12 * s;
    const gap = 2 * s;
    g.roundRect(-gap - barW, -barH / 2, barW, barH, s);
    g.fill({ color: WHITE });
    g.roundRect(gap, -barH / 2, barW, barH, s);
    g.fill({ color: WHITE });
    return g;
  }

  /** ← Back arrow */
  static createBackIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Arrow shaft
    g.moveTo(-6 * s, 0);
    g.lineTo(6 * s, 0);
    g.stroke({ color: WHITE, width: s * 1.5 });
    // Arrow head
    g.moveTo(-2 * s, -4 * s);
    g.lineTo(-6 * s, 0);
    g.lineTo(-2 * s, 4 * s);
    g.stroke({ color: WHITE, width: s * 1.5 });
    return g;
  }

  /** 🔒 Lock icon */
  static createLockIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Body
    g.roundRect(-5 * s, -1 * s, 10 * s, 9 * s, 2 * s);
    g.fill({ color: GRAY });
    // Shackle
    g.arc(0, -1 * s, 4 * s, Math.PI, 0);
    g.stroke({ color: GRAY, width: s * 1.8 });
    // Keyhole
    g.circle(0, 3 * s, 1.5 * s);
    g.fill({ color: DARK });
    g.rect(-0.7 * s, 3 * s, 1.4 * s, 3 * s);
    g.fill({ color: DARK });
    return g;
  }

  /** ✅ Check mark */
  static createCheckIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    g.circle(0, 0, size / 2);
    g.fill({ color: GREEN });
    g.moveTo(-4 * s, 0);
    g.lineTo(-1 * s, 3 * s);
    g.lineTo(5 * s, -3 * s);
    g.stroke({ color: WHITE, width: s * 2 });
    return g;
  }

  /** 👗 Wardrobe / hanger icon */
  static createWardrobeIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Hanger hook
    g.arc(0, -6 * s, 2 * s, Math.PI, 0);
    g.stroke({ color: WHITE, width: s * 1.2 });
    // Hanger body
    g.moveTo(0, -4 * s);
    g.lineTo(-8 * s, 2 * s);
    g.stroke({ color: WHITE, width: s * 1.5 });
    g.moveTo(0, -4 * s);
    g.lineTo(8 * s, 2 * s);
    g.stroke({ color: WHITE, width: s * 1.5 });
    // Bottom bar
    g.moveTo(-8 * s, 2 * s);
    g.lineTo(8 * s, 2 * s);
    g.stroke({ color: WHITE, width: s * 1.2 });
    return g;
  }

  /** 🛢 Barrel icon (for shop) — enlarged & detailed */
  static createBarrelIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Main barrel body (wider)
    const bw = 9 * s;
    const bh = 16 * s;
    // Barrel shape (bulging cylinder)
    g.moveTo(-bw, -bh * 0.45);
    g.quadraticCurveTo(-bw * 1.15, 0, -bw, bh * 0.45);
    g.lineTo(bw, bh * 0.45);
    g.quadraticCurveTo(bw * 1.15, 0, bw, -bh * 0.45);
    g.closePath();
    g.fill({ color: BLUE, alpha: 0.65 });
    // Top ellipse
    g.ellipse(0, -bh * 0.45, bw, bw * 0.35);
    g.fill({ color: BLUE, alpha: 0.8 });
    g.ellipse(0, -bh * 0.45, bw, bw * 0.35);
    g.stroke({ color: 0x6bb5ff, alpha: 0.4, width: s * 0.8 });
    // Bottom ellipse
    g.ellipse(0, bh * 0.45, bw, bw * 0.35);
    g.fill({ color: BLUE, alpha: 0.45 });
    // Hoops
    g.ellipse(0, -bh * 0.2, bw * 1.06, bw * 0.2);
    g.stroke({ color: WHITE, alpha: 0.25, width: s * 0.9 });
    g.ellipse(0, bh * 0.2, bw * 1.06, bw * 0.2);
    g.stroke({ color: WHITE, alpha: 0.25, width: s * 0.9 });
    // Highlight streak
    g.ellipse(-bw * 0.4, -bh * 0.1, bw * 0.12, bh * 0.35);
    g.fill({ color: WHITE, alpha: 0.12 });
    return g;
  }

  /** 🧬 DNA / mutation icon */
  static createMutationIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // Double helix (simplified)
    for (let i = -8; i <= 8; i += 2) {
      const x1 = Math.sin(i * 0.5) * 4 * s;
      const x2 = -x1;
      g.circle(x1, i * s, s * 0.7);
      g.fill({ color: GREEN });
      g.circle(x2, i * s, s * 0.7);
      g.fill({ color: 0x2ecc71 });
      // Rungs
      if (i % 4 === 0) {
        g.moveTo(x1, i * s);
        g.lineTo(x2, i * s);
        g.stroke({ color: WHITE, alpha: 0.3, width: s * 0.5 });
      }
    }
    return g;
  }

  /** 🧲 Magnet icon */
  static createMagnetIcon(size: number): Graphics {
    const g = new Graphics();
    const s = size / 24;
    // U-shape magnet
    g.arc(0, 0, 6 * s, 0, Math.PI);
    g.stroke({ color: PINK, width: s * 3 });
    // Poles
    g.rect(-8 * s, -6 * s, 4 * s, 6 * s);
    g.fill({ color: PINK });
    g.rect(4 * s, -6 * s, 4 * s, 6 * s);
    g.fill({ color: BLUE });
    // Tips
    g.rect(-8 * s, -6 * s, 4 * s, 2 * s);
    g.fill({ color: 0xcc0000 });
    g.rect(4 * s, -6 * s, 4 * s, 2 * s);
    g.fill({ color: 0x2980b9 });
    return g;
  }

  /** 💰 Multiplier coin stack */
  static createMultiplierIcon(size: number): Graphics {
    const g = new Graphics();
    const r = size / 2 * 0.7;
    // Stacked coins
    for (let i = 2; i >= 0; i--) {
      const y = i * r * 0.3;
      g.ellipse(0, -y, r, r * 0.5);
      g.fill({ color: i === 0 ? GOLD : 0xe6a200 });
      g.ellipse(0, -y, r, r * 0.5);
      g.stroke({ color: 0xc89600, width: 1 });
    }
    // × symbol
    g.circle(r * 0.7, -r * 0.7, r * 0.4);
    g.fill({ color: PINK });
    return g;
  }
}
