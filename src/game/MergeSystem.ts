/**
 * MergeSystem — VFX engine for Spin Merge
 * Agent 7: Polisher (VFX + QA)
 *
 * Provides juicy visual effects: merge particles, screen shake,
 * combo text, dragon firework, frenzy glow, creature pulse.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Constants ──────────────────────────────────────

const PARTICLE_COUNT = 10;
const PARTICLE_DURATION = 600; // ms
const SHAKE_DURATION = 150; // ms
const SHAKE_INTENSITY = 3; // px
const COMBO_DURATION = 1000; // ms
const DRAGON_PARTICLE_COUNT = 35;
const DRAGON_TEXT_DURATION = 2000; // ms
const FRENZY_RING_ALPHA = 0.35;
const FRENZY_HUE_SPEED = 2; // radians/sec

// ─── Particle Helper ────────────────────────────────

interface Particle {
  gfx: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startScale: number;
}

// ─── MergeVFX Class ─────────────────────────────────

export class MergeVFX {
  private vfxContainer: Container;
  private particles: Particle[] = [];
  private animationActive = false;
  private _destroyed = false;

  // Frenzy state
  private frenzyContainer: Container | null = null;
  private frenzyActive = false;
  private frenzyHue = 0;
  private frenzyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(parentContainer: Container) {
    this.vfxContainer = new Container();
    // Add VFX container on top of everything
    parentContainer.addChild(this.vfxContainer);
  }

  // ─── Merge Particles ──────────────────────────────

  /**
   * Spawn 8-12 small circles that fly outward from the merge point
   * and shrink + fade out over ~600ms.
   */
  spawnMergeParticles(x: number, y: number, color: number, level: number): void {
    const count = PARTICLE_COUNT + Math.floor(Math.random() * 5); // 10-14
    const baseSize = 3 + level * 0.5;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 80 + Math.random() * 120 + level * 10;

      const gfx = new Graphics();
      const size = baseSize + Math.random() * 2;
      gfx.circle(0, 0, size);
      gfx.fill({ color, alpha: 0.9 });
      gfx.position.set(x, y);
      this.vfxContainer.addChild(gfx);

      this.particles.push({
        gfx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30, // slight upward bias
        life: PARTICLE_DURATION,
        maxLife: PARTICLE_DURATION,
        startScale: 1,
      });
    }

    // Add a flash circle at the merge point — bigger, longer
    const flash = new Graphics();
    const flashSize = 20 + level * 5;
    flash.circle(0, 0, flashSize);
    flash.fill({ color: 0xFFFFFF, alpha: 0.7 });
    flash.position.set(x, y);
    flash.blendMode = 'add';
    this.vfxContainer.addChild(flash);
    this.particles.push({
      gfx: flash,
      vx: 0,
      vy: 0,
      life: 350,
      maxLife: 350,
      startScale: 0.8,
    });

    // Ring burst — expanding colored ring
    this.showRingBurst(x, y, color, level);

    // Sunburst rays for L5+
    if (level >= 5) {
      this.showSunburst(x, y, color, level);
    }

    // Full screen flash for L8+
    if (level >= 8) {
      this.showScreenFlash(level);
    }

    this.startAnimation();
  }

  // ─── Ring Burst ───────────────────────────────────

  /** Expanding colored ring from merge point */
  private showRingBurst(x: number, y: number, color: number, level: number): void {
    const ring = new Graphics();
    ring.circle(0, 0, 10);
    ring.stroke({ color, alpha: 0.9, width: 4 });
    ring.position.set(x, y);
    ring.blendMode = 'add';
    this.vfxContainer.addChild(ring);

    const startTime = performance.now();
    const duration = 400 + level * 30;
    const maxScale = 3 + level * 0.5;

    const animate = () => {
      if (this._destroyed) { ring.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      ring.scale.set(1 + eased * maxScale);
      ring.alpha = 0.9 * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(ring);
        ring.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Sunburst Rays ────────────────────────────────

  /** Radial rays bursting from merge point (L5+) */
  private showSunburst(x: number, y: number, color: number, level: number): void {
    const rayCount = 6 + Math.floor(level / 2);
    const container = new Graphics();
    container.position.set(x, y);
    container.blendMode = 'add';
    this.vfxContainer.addChild(container);

    for (let i = 0; i < rayCount; i++) {
      const angle = (Math.PI * 2 / rayCount) * i;
      const length = 30 + level * 8;
      container.moveTo(0, 0);
      container.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      container.stroke({ color, alpha: 0.5, width: 2 + level * 0.3, cap: 'round' });
    }

    const startTime = performance.now();
    const duration = 500;

    const animate = () => {
      if (this._destroyed) { container.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      container.scale.set(1 + progress * 2);
      container.alpha = 0.6 * (1 - progress);
      container.rotation += 0.02;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(container);
        container.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Screen Flash ─────────────────────────────────

  /** Brief full-screen white flash for high-level merges (L8+) */
  private showScreenFlash(level: number): void {
    const flash = new Graphics();
    flash.rect(0, 0, 2000, 2000);
    flash.fill({ color: 0xFFFFFF });
    flash.position.set(-500, -500);
    flash.alpha = 0.08 + (level - 8) * 0.03;
    flash.blendMode = 'add';
    this.vfxContainer.addChild(flash);

    const startTime = performance.now();
    const duration = 150;
    const startAlpha = flash.alpha;

    const animate = () => {
      if (this._destroyed) { flash.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      flash.alpha = startAlpha * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(flash);
        flash.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Floating Score ───────────────────────────────

  /** Show floating "+N" text at merge point */
  showFloatingScore(x: number, y: number, score: number, color: number): void {
    const text = new Text({
      text: `+${score}`,
      style: new TextStyle({
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: Math.min(28, 18 + score * 0.5),
        fontWeight: 'bold',
        fill: color,
        stroke: { color: 0x000000, width: 3 },
      }),
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    text.alpha = 1;
    this.vfxContainer.addChild(text);

    const startTime = performance.now();
    const duration = 800;

    const animate = () => {
      if (this._destroyed) { this.vfxContainer.removeChild(text); text.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      text.position.y = y - progress * 50;
      if (progress < 0.2) {
        // Pop in
        const t = progress / 0.2;
        text.scale.set(0.5 + t * 0.7);
      } else {
        text.scale.set(1.2);
        text.alpha = 1 - (progress - 0.2) / 0.8;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(text);
        text.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Screen Shake ─────────────────────────────────

  /**
   * Shake the given container ±intensity pixels for duration ms.
   * Used for high-level merges (≥6).
   */
  screenShake(stage: Container, intensity: number = SHAKE_INTENSITY): void {
    const startTime = performance.now();
    const origX = stage.position.x;
    const origY = stage.position.y;

    const shake = () => {
      if (this._destroyed) { stage.position.set(origX, origY); return; }
      const elapsed = performance.now() - startTime;
      if (elapsed >= SHAKE_DURATION) {
        stage.position.set(origX, origY);
        return;
      }
      const decay = 1 - elapsed / SHAKE_DURATION;
      const dx = (Math.random() - 0.5) * 2 * intensity * decay;
      const dy = (Math.random() - 0.5) * 2 * intensity * decay;
      stage.position.set(origX + dx, origY + dy);
      requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
  }

  // ─── Combo Text ───────────────────────────────────

  /**
   * Show "COMBO xN!" text that scales up and fades out.
   * White flash behind it for emphasis.
   */
  showComboFlash(x: number, y: number, comboCount: number): void {
    // White flash
    const flash = new Graphics();
    flash.circle(0, 0, 60);
    flash.fill({ color: 0xFFFFFF, alpha: 0.3 });
    flash.position.set(x, y);
    this.vfxContainer.addChild(flash);

    const startTime = performance.now();
    const flashAnim = () => {
      if (this._destroyed) { this.vfxContainer.removeChild(flash); flash.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / 300, 1);
      flash.alpha = 0.3 * (1 - progress);
      flash.scale.set(1 + progress * 2);
      if (progress < 1) {
        requestAnimationFrame(flashAnim);
      } else {
        this.vfxContainer.removeChild(flash);
        flash.destroy();
      }
    };
    requestAnimationFrame(flashAnim);

    // Combo text
    const text = new Text({
      text: `COMBO x${comboCount}!`,
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 32 + comboCount * 2,
        fontWeight: 'bold',
        fill: 0xFFD700,
        stroke: { color: 0x000000, width: 3 },
        dropShadow: { color: 0xFF4500, blur: 8, distance: 0 },
      }),
    });
    text.anchor.set(0.5);
    text.position.set(x, y - 20);
    text.scale.set(0.3);
    this.vfxContainer.addChild(text);

    const textStart = performance.now();
    const textAnim = () => {
      if (this._destroyed) { this.vfxContainer.removeChild(text); text.destroy(); return; }
      const elapsed = performance.now() - textStart;
      const progress = Math.min(elapsed / COMBO_DURATION, 1);

      // Scale up quickly (0-30%), then hold and fade
      if (progress < 0.25) {
        const t = progress / 0.25;
        // Elastic ease out
        const elastic = 1 + Math.sin(t * Math.PI * 1.5) * 0.2 * (1 - t);
        text.scale.set(0.3 + 0.9 * t * elastic);
      } else {
        text.scale.set(1.2);
        const fadeT = (progress - 0.25) / 0.75;
        text.alpha = 1 - fadeT;
        text.position.y -= 0.5; // drift up
      }

      if (progress < 1) {
        requestAnimationFrame(textAnim);
      } else {
        this.vfxContainer.removeChild(text);
        text.destroy();
      }
    };
    requestAnimationFrame(textAnim);
  }

  // ─── Dragon Firework ──────────────────────────────

  /**
   * Grand firework when Dragon (level 11) is created.
   * 35+ gold particles + "🐉 ЛЕГЕНДА!" text.
   */
  showDragonFirework(x: number, y: number): void {
    // Gold particles burst
    for (let i = 0; i < DRAGON_PARTICLE_COUNT; i++) {
      const angle = (i / DRAGON_PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 120 + Math.random() * 200;
      const size = 3 + Math.random() * 5;
      // Gold/yellow colors
      const colors = [0xFFD700, 0xFFA500, 0xFFEC8B, 0xFFE4B5, 0xFF8C00];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const gfx = new Graphics();
      // Mix of circles and star-like shapes
      if (Math.random() > 0.6) {
        // Star particle
        gfx.star(0, 0, 5, size, size * 0.4);
        gfx.fill({ color, alpha: 0.95 });
      } else {
        gfx.circle(0, 0, size);
        gfx.fill({ color, alpha: 0.9 });
      }
      gfx.position.set(x, y);
      this.vfxContainer.addChild(gfx);

      const duration = 1200 + Math.random() * 600;
      this.particles.push({
        gfx,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: duration,
        maxLife: duration,
        startScale: 1.2,
      });
    }

    // Big central flash
    const flash = new Graphics();
    flash.circle(0, 0, 50);
    flash.fill({ color: 0xFFD700, alpha: 0.7 });
    flash.position.set(x, y);
    this.vfxContainer.addChild(flash);
    this.particles.push({
      gfx: flash,
      vx: 0,
      vy: 0,
      life: 400,
      maxLife: 400,
      startScale: 1,
    });

    // "🐉 ЛЕГЕНДА!" text
    const text = new Text({
      text: '🐉 ЛЕГЕНДА!',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xFFD700,
        stroke: { color: 0x8B4513, width: 4 },
        dropShadow: { color: 0xFFD700, blur: 16, distance: 0 },
      }),
    });
    text.anchor.set(0.5);
    text.position.set(x, y - 60);
    text.alpha = 0;
    this.vfxContainer.addChild(text);

    const textStart = performance.now();
    const textAnim = () => {
      if (this._destroyed) return;
      const elapsed = performance.now() - textStart;
      const progress = Math.min(elapsed / DRAGON_TEXT_DURATION, 1);

      if (progress < 0.15) {
        // Fade in + scale up
        const t = progress / 0.15;
        text.alpha = t;
        text.scale.set(0.5 + 0.8 * t);
      } else if (progress < 0.7) {
        // Hold with gentle pulse
        text.alpha = 1;
        const pulse = 1.3 + Math.sin((progress - 0.15) * 20) * 0.05;
        text.scale.set(pulse);
      } else {
        // Fade out
        const fadeT = (progress - 0.7) / 0.3;
        text.alpha = 1 - fadeT;
        text.position.y -= 0.3;
      }

      if (progress < 1) {
        requestAnimationFrame(textAnim);
      } else {
        this.vfxContainer.removeChild(text);
        text.destroy();
      }
    };
    requestAnimationFrame(textAnim);

    this.startAnimation();
  }

  // ─── Creature Pulse ───────────────────────────────

  /**
   * Quick scale pulse on a creature container (1.1→1.0 over 100ms).
   * Called on collision impacts.
   */
  pulseCreature(creatureContainer: Container): void {
    const startScale = creatureContainer.scale.x;
    const targetScale = startScale * 1.1;
    creatureContainer.scale.set(targetScale);

    const startTime = performance.now();
    const duration = 100;

    const animate = () => {
      if (creatureContainer.destroyed) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out
      const t = 1 - (1 - progress) * (1 - progress);
      const scale = targetScale + (startScale - targetScale) * t;
      creatureContainer.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Frenzy Mode (Infinite Spin) ──────────────────

  /**
   * Show neon glow ring around the barrel with hue rotation.
   * Called when player activates infinite spin via rewarded ad.
   */
  startFrenzy(cx: number, cy: number, radius: number, durationMs: number = 30000): void {
    this.stopFrenzy();
    this.frenzyActive = true;
    this.frenzyHue = 0;

    this.frenzyContainer = new Container();
    this.vfxContainer.addChild(this.frenzyContainer);

    const ring = new Graphics();
    this.frenzyContainer.addChild(ring);

    const startTime = performance.now();

    const animateFrenzy = () => {
      if (!this.frenzyActive || this._destroyed) return;

      const elapsed = performance.now() - startTime;
      this.frenzyHue += FRENZY_HUE_SPEED / 60;

      // Calculate color from hue (HSV→RGB)
      const hue = (this.frenzyHue * 180 / Math.PI) % 360;
      const color = hsvToHex(hue, 0.9, 1.0);

      ring.clear();
      // Outer glow
      ring.circle(cx, cy, radius + 12);
      ring.stroke({ color, alpha: FRENZY_RING_ALPHA * 0.4, width: 20 });
      // Inner bright ring
      ring.circle(cx, cy, radius + 4);
      ring.stroke({ color, alpha: FRENZY_RING_ALPHA, width: 4 });
      // Pulsing alpha
      const pulse = 0.7 + Math.sin(elapsed / 200) * 0.3;
      ring.alpha = pulse;

      if (elapsed < durationMs) {
        requestAnimationFrame(animateFrenzy);
      } else {
        this.stopFrenzy();
      }
    };
    requestAnimationFrame(animateFrenzy);

    // Auto-stop after duration
    this.frenzyTimer = setTimeout(() => this.stopFrenzy(), durationMs);
  }

  stopFrenzy(): void {
    this.frenzyActive = false;
    if (this.frenzyTimer) {
      clearTimeout(this.frenzyTimer);
      this.frenzyTimer = null;
    }
    if (this.frenzyContainer) {
      this.vfxContainer.removeChild(this.frenzyContainer);
      this.frenzyContainer.destroy({ children: true });
      this.frenzyContainer = null;
    }
  }

  // ─── Vortex Effect (Black Hole — Rewarded Ad) ─────

  /**
   * Spiral vortex animation sucking creatures inward.
   * Visual-only effect before removing top creatures.
   */
  showVortex(x: number, y: number, callback?: () => void): void {
    const vortex = new Graphics();
    this.vfxContainer.addChild(vortex);

    const startTime = performance.now();
    const duration = 800;

    const animate = () => {
      if (this._destroyed) { vortex.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      vortex.clear();

      // Spiral arms
      const numArms = 4;
      const maxRadius = 80 * (1 - progress * 0.5);

      for (let arm = 0; arm < numArms; arm++) {
        const baseAngle = (arm / numArms) * Math.PI * 2 + elapsed / 150;
        for (let j = 0; j < 12; j++) {
          const t = j / 12;
          const r = maxRadius * t;
          const angle = baseAngle + t * Math.PI * 2;
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          const size = 3 * (1 - t) * (1 - progress);

          vortex.circle(px, py, Math.max(0.5, size));
          vortex.fill({ color: 0x9B59B6, alpha: 0.6 * (1 - progress) });
        }
      }

      // Central dark circle
      const coreSize = 5 + progress * 25;
      vortex.circle(x, y, coreSize);
      vortex.fill({ color: 0x1a1a2e, alpha: 0.9 });
      vortex.circle(x, y, coreSize + 3);
      vortex.stroke({ color: 0x9B59B6, alpha: 0.7 * (1 - progress * 0.5), width: 2 });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(vortex);
        vortex.destroy();
        callback?.();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Drop Impact ──────────────────────────────────

  /**
   * Small impact ring when a creature lands on something.
   */
  showDropImpact(x: number, y: number, color: number): void {
    const ring = new Graphics();
    ring.circle(0, 0, 8);
    ring.stroke({ color, alpha: 0.5, width: 2 });
    ring.position.set(x, y);
    this.vfxContainer.addChild(ring);

    const startTime = performance.now();
    const duration = 300;

    const animate = () => {
      if (this._destroyed) { ring.destroy(); return; }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ring.scale.set(1 + progress * 2);
      ring.alpha = 0.5 * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.vfxContainer.removeChild(ring);
        ring.destroy();
      }
    };
    requestAnimationFrame(animate);
  }

  // ─── Particle Update Loop ─────────────────────────

  private startAnimation(): void {
    if (this.animationActive) return;
    this.animationActive = true;
    this.tickParticles();
  }

  private lastTickTime = 0;

  private tickParticles = (): void => {
    if (this.particles.length === 0) {
      this.animationActive = false;
      this.lastTickTime = 0;
      return;
    }

    const now = performance.now();
    const dtMs = this.lastTickTime > 0 ? Math.min(now - this.lastTickTime, 50) : 16.67;
    this.lastTickTime = now;
    const dt = dtMs / 1000; // seconds for movement

    const toRemove: number[] = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dtMs;

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Move
      p.gfx.position.x += p.vx * dt;
      p.gfx.position.y += p.vy * dt;
      // Gravity on particles
      p.vy += 150 * dt;

      // Fade & shrink
      p.gfx.alpha = lifeRatio;
      p.gfx.scale.set(p.startScale * lifeRatio);
    }

    // Remove dead particles in reverse order
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      const p = this.particles[idx];
      this.vfxContainer.removeChild(p.gfx);
      p.gfx.destroy();
      this.particles.splice(idx, 1);
    }

    requestAnimationFrame(this.tickParticles);
  };

  // ─── Cleanup ──────────────────────────────────────

  destroy(): void {
    this._destroyed = true;
    this.stopFrenzy();
    for (const p of this.particles) {
      p.gfx.destroy();
    }
    this.particles = [];
    this.animationActive = false;
    this.vfxContainer.destroy({ children: true });
  }
}

// ─── Utility: HSV to Hex ────────────────────────────

function hsvToHex(h: number, s: number, v: number): number {
  h = h % 360;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);

  return (ri << 16) | (gi << 8) | bi;
}
