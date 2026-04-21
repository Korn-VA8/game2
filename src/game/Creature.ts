import Matter from 'matter-js';
import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import type { SpriteDescriptor, SpriteTheme } from '../meta/SkinManager';
import { SpriteGenerator } from './SpriteGenerator';
import type { CreatureExpression } from './SpriteGenerator';
import { VFXManager } from './VFXManager';

/** Size config per creature level (1-11) */
const CREATURE_RADII: number[] = [
  0,   // index 0 unused
  13,  // 1 — Мышка (20 / 1.5)
  20,  // 2 — Хомяк (30 / 1.5)
  27,  // 3 — Зайка (40 / 1.5)
  35,  // 4 — Котик (52 / 1.5)
  44,  // 5 — Корги (66 / 1.5)
  55,  // 6 — Лисичка (82 / 1.5)
  67,  // 7 — Панда (100 / 1.5)
  80,  // 8 — Медведь (120 / 1.5)
  95,  // 9 — Лев (142 / 1.5)
  111, // 10 — Динозавр (166 / 1.5)
  128, // 11 — Дракон (192 / 1.5)
];

/** Default color palette (Skin 0 — Jelly Pets) — matches SkinManager */
const CREATURE_COLORS: number[] = [
  0x000000,  // index 0 unused
  0xFF85A2, 0xFFB088, 0xFFD966, 0x7EC8E3, 0x88E8C0,
  0xFFCF8B, 0xCDA4DE, 0x7FDBCA, 0xFFE87C, 0xD4A5FF, 0xFFF5BA,
];

/** Number of points for the jelly contour — fewer for small creatures */
function getJellyPoints(level: number): number {
  if (level <= 3) return 12;
  if (level <= 6) return 16;
  return 20;
}
/** How fast the wobble oscillates */
const WOBBLE_SPEED = 12;
/** Wobble decay per second (multiplied each frame) */
const WOBBLE_DECAY = 0.88;
/** Squash/stretch spring stiffness */
const SQUASH_SPRING = 0.15;
/** Squash/stretch damping */
const SQUASH_DAMPING = 0.7;

export const MAX_LEVEL = 11;

export interface CreatureConfig {
  radius: number;
  color: number;
  name: string;
  spriteDescriptor?: SpriteDescriptor;
}

export function getCreatureConfig(level: number, colorOverride?: number): CreatureConfig {
  const l = Math.max(1, Math.min(level, MAX_LEVEL));
  return {
    radius: CREATURE_RADII[l],
    color: colorOverride ?? CREATURE_COLORS[l],
    name: `${l}`,
  };
}

export function getCreatureRadius(level: number): number {
  return CREATURE_RADII[Math.max(1, Math.min(level, MAX_LEVEL))];
}

/** Get physics params differentiated by level */
function getPhysicsParams(level: number) {
  return {
    restitution: 0.4 + level * 0.02,
    friction: 0.08,
    density: 0.0008 + level * 0.0002,
    frictionAir: 0.018 + level * 0.003,
    slop: 0.02,
  };
}

/** Helper: lighten a hex color */
function lightenColor(hex: number, percent: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xFF) + Math.floor(255 * percent / 100));
  const g = Math.min(255, ((hex >> 8) & 0xFF) + Math.floor(255 * percent / 100));
  const b = Math.min(255, (hex & 0xFF) + Math.floor(255 * percent / 100));
  return (r << 16) | (g << 8) | b;
}

/** Helper: darken a hex color */
function darkenColor(hex: number, percent: number): number {
  const r = Math.max(0, ((hex >> 16) & 0xFF) - Math.floor(255 * percent / 100));
  const g = Math.max(0, ((hex >> 8) & 0xFF) - Math.floor(255 * percent / 100));
  const b = Math.max(0, (hex & 0xFF) - Math.floor(255 * percent / 100));
  return (r << 16) | (g << 8) | b;
}

/** Parse hex string to number */
function parseHex(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

let creatureIdCounter = 0;

export class Creature {
  public readonly id: number;
  public level: number;
  public body: Matter.Body;
  public container: Container;

  // Jelly visual state
  private wobbleAmplitude = 0;
  private wobblePhase = 0;
  private wobbleOffsets: number[];
  private squashX = 1;
  private squashY = 1;
  private squashVelX = 0;
  private squashVelY = 0;
  private targetSquashX = 1;
  private targetSquashY = 1;

  private graphics: Graphics;
  private maskGraphics: Graphics;
  private glowGraphics: Graphics;
  private highlightGraphics: Graphics;
  private spriteContainer: Container;
  private spriteGraphics: Graphics;
  private faceGraphics: Graphics;
  private label: Text;
  private config: CreatureConfig;
  private _destroyed = false;
  private time = 0;
  private breathPhase = Math.random() * Math.PI * 2;
  private levelUpGlowAlpha = 0;
  private frameCounter = 0;
  private jellyPoints: number;
  private bodyGradient: FillGradient;
  
  public currentExpression: CreatureExpression = 'falling';
  private expressionTimer = 1.0; // Starts falling for 1 second max 
  
  public isBlinking = false;
  public blinkTimer = 0;

  constructor(level: number, x: number, y: number, engine: Matter.Engine, colorOverride?: number) {
    this.id = creatureIdCounter++;
    this.level = Math.max(1, Math.min(level, MAX_LEVEL));

    this.config = getCreatureConfig(this.level, colorOverride);
    const physics = getPhysicsParams(this.level);

    // Create Matter.js circle body with jelly-tuned params
    this.body = Matter.Bodies.circle(x, y, this.config.radius, {
      restitution: physics.restitution,
      friction: physics.friction,
      density: physics.density,
      frictionAir: physics.frictionAir,
      slop: physics.slop,
      label: `creature_${this.id}`,
    });
    (this.body as any).creatureRef = this;

    Matter.Composite.add(engine.world, this.body);

    // Generate random wobble offsets
    this.jellyPoints = getJellyPoints(this.level);
    this.wobbleOffsets = [];
    for (let i = 0; i < this.jellyPoints; i++) {
      this.wobbleOffsets.push(Math.random() * Math.PI * 2);
    }

    // Create PixiJS visuals
    this.container = new Container();
    this.glowGraphics = new Graphics();
    this.graphics = new Graphics();
    this.highlightGraphics = new Graphics();
    this.maskGraphics = new Graphics();
    this.spriteContainer = new Container();
    this.spriteGraphics = new Graphics();
    this.faceGraphics = new Graphics();
    
    // Setup masking
    this.spriteContainer.addChild(this.spriteGraphics);
    this.spriteContainer.addChild(this.faceGraphics);
    this.spriteContainer.mask = this.maskGraphics;
    this.label = new Text({
      text: `${this.level}`,
      style: {
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: Math.max(8, this.config.radius * 0.25),
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        align: 'center',
      },
    });
    this.label.anchor.set(0.5);
    this.label.alpha = 0.5; // Subtle level badge

    this.container.addChild(this.glowGraphics);
    this.container.addChild(this.graphics);
    this.container.addChild(this.spriteContainer); // Add planetary textures/faces HERE
    this.container.addChild(this.highlightGraphics); // Draw 3D rim light & specular shine ON TOP of textures
    this.container.addChild(this.maskGraphics); // Rendered but used as mask
    this.container.addChild(this.label);

    // Position label at bottom
    this.label.position.set(0, this.config.radius * 0.55);

    // Cache gradient (created once, reused every drawJellyBody)
    const r = this.config.radius;
    const color = this.config.color;
    this.bodyGradient = new FillGradient(-r*0.5, -r*0.8, r*0.5, r*0.8);
    this.bodyGradient.addColorStop(0, lightenColor(color, 35));
    this.bodyGradient.addColorStop(0.55, color);
    this.bodyGradient.addColorStop(1, darkenColor(color, 15));

    // Initial draw
    this.drawJellyBody();

    // Position
    this.container.position.set(x, y);

    // Initial spawn pop-in
    this.animateSpawn();
  }

  /** Animate bouncy pop-in when spawned */
  private animateSpawn(): void {
    const duration = 350;
    const startTime = performance.now();
    this.container.scale.set(0);
    
    // Add extra wobble energy on spawn
    this.wobbleAmplitude = 12;

    const animate = () => {
      if (this._destroyed || this.container.destroyed) return; // audit fix #3
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Elastic Out easing
      const scale = t === 1 ? 1 : (Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1);
      this.container.scale.set(Math.max(0, scale));
      
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  /** Set the sprite descriptor (from SkinManager) */
  setSpriteDescriptor(sprite: SpriteDescriptor): void {
    this.config.spriteDescriptor = sprite;
    this.refreshFace();
  }

  /** Wrapper to redraw the face only when state or skin changes */
  private refreshFace(): void {
    if (!this.config.spriteDescriptor) return;
    const accent = this.config.spriteDescriptor.accentColor ? 
      parseHex(this.config.spriteDescriptor.accentColor) : 
      lightenColor(this.config.color, 30);
    
    SpriteGenerator.drawFace(
      this.spriteGraphics,
      this.faceGraphics,
      this.config.radius,
      this.config.spriteDescriptor,
      this.config.color,
      accent,
      this.currentExpression,
      this.wobblePhase, // passed in so things can flicker and animate!
      {
        vx: this.body.velocity.x,
        vy: this.body.velocity.y,
        squashX: this.squashX,
        squashY: this.squashY,
        squashVelX: this.squashVelX,
        squashVelY: this.squashVelY,
        wobbleAmplitude: this.wobbleAmplitude
      }
    );
  }

  /** Changes emotion and triggers a face redraw if it changed */
  public setExpression(exp: CreatureExpression, duration: number = 0) {
    if (this.currentExpression === exp) {
      if (duration > 0) this.expressionTimer = Math.max(this.expressionTimer, duration);
      return;
    }
    
    this.currentExpression = exp;
    this.expressionTimer = duration;
    this.refreshFace();
  }

  /** Called when this creature collides with something */
  onCollision(impactForce: number, normalX: number, normalY: number): void {
    if (this._destroyed) return;

    const wobbleImpact = Math.min(impactForce * 0.4, 8);
    this.wobbleAmplitude = Math.max(this.wobbleAmplitude, wobbleImpact);

    const absNx = Math.abs(normalX);
    const absNy = Math.abs(normalY);
    const squashStrength = Math.min(impactForce * 0.06, 0.35);

    if (absNy > absNx) {
      this.targetSquashX = 1 + squashStrength;
      this.targetSquashY = 1 - squashStrength;
    } else {
      this.targetSquashX = 1 - squashStrength;
      this.targetSquashY = 1 + squashStrength;
    }

    // Reaction
    if (impactForce > 4) {
      this.setExpression('impact', 0.8);
    } else if (impactForce > 1 && this.currentExpression === 'falling') {
      this.setExpression('idle', 0); // Landed softly
    }
  }

  /** Update jelly animation state — call every frame */
  updateJelly(dt: number): void {
    if (this._destroyed) return;

    this.time += dt;

    // Handle expression timers
    if (this.expressionTimer > 0) {
      this.expressionTimer -= dt;
      if (this.expressionTimer <= 0 && this.currentExpression !== 'idle' && this.currentExpression !== 'merging') {
        this.setExpression('idle', 0);
      }
    }

    // Handle blinking internally (only in idle)
    if (this.currentExpression === 'idle' && !this.isBlinking && Math.random() < 0.003) {
      if (this.config.spriteDescriptor?.theme !== 'spooky') {
        this.isBlinking = true;
        this.blinkTimer = 0.15;
        this.setExpression('merging');
      }
    }
    if (this.isBlinking) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = false;
        this.setExpression('idle', 0);
      }
    }

    this.wobblePhase += WOBBLE_SPEED * dt;
    this.wobbleAmplitude *= Math.pow(WOBBLE_DECAY, dt * 60);
    if (this.wobbleAmplitude < 0.05) this.wobbleAmplitude = 0;

    const dx = this.targetSquashX - this.squashX;
    const dy = this.targetSquashY - this.squashY;
    this.squashVelX += dx * SQUASH_SPRING;
    this.squashVelY += dy * SQUASH_SPRING;
    this.squashVelX *= SQUASH_DAMPING;
    this.squashVelY *= SQUASH_DAMPING;
    this.squashX += this.squashVelX;
    this.squashY += this.squashVelY;

    this.targetSquashX += (1 - this.targetSquashX) * 0.12;
    this.targetSquashY += (1 - this.targetSquashY) * 0.12;

    // Apply container transforms for Squash and Stretch + Wobble Offset
    // (Instead of clearing and redrawing the face every frame)
    this.spriteContainer.scale.set(this.squashX, this.squashY);
    const wx = Math.sin(this.wobblePhase * 1.5) * this.wobbleAmplitude * 0.4 * this.squashX;
    const wy = Math.cos(this.wobblePhase * 1.3) * this.wobbleAmplitude * 0.4 * this.squashY;
    this.spriteContainer.position.set(wx, wy);

    if (this.wobbleAmplitude > 0.05 ||
        Math.abs(this.squashX - 1) > 0.005 ||
        Math.abs(this.squashY - 1) > 0.005) {
      this.drawJellyBody();
    }

    // Idle breathing — subtle scale oscillation when resting
    if (this.currentExpression === 'idle' && this.wobbleAmplitude < 0.1) {
      this.breathPhase += dt * 2.5;
      const breath = 1 + Math.sin(this.breathPhase) * 0.015;
      this.container.scale.set(breath);
    }

    // Level-up glow fade
    if (this.levelUpGlowAlpha > 0) {
      this.levelUpGlowAlpha -= dt * 0.8;
      if (this.levelUpGlowAlpha < 0) this.levelUpGlowAlpha = 0;
      this.glowGraphics.alpha = 0.12 + this.levelUpGlowAlpha * 0.5;
    }

    // Throttled face refresh: every 6th frame (~10fps for themes = visually smooth enough)
    // Skip entirely if creature is at rest (stacked creatures jitter at ~0.5-1.5 velocity)
    this.frameCounter++;
    const speed = Math.abs(this.body.velocity.x) + Math.abs(this.body.velocity.y);
    const isResting = this.currentExpression === 'idle' 
      && this.wobbleAmplitude < 0.1 
      && Math.abs(this.squashX - 1) < 0.02 
      && speed < 2.0;

    if (!isResting && this.frameCounter % 6 === 0) {
      this.refreshFace();
    }
  }

  /** Draw the jelly-deformed body using a procedural contour */
  private drawJellyBody(): void {
    const r = this.config.radius;
    const color = this.config.color;

    // Performance: skip expensive glow layer for small deformations
    const needsGlow = this.wobbleAmplitude > 0.5 || this.levelUpGlowAlpha > 0;
    
    if (needsGlow) {
      // --- Glow layer ---
      this.glowGraphics.clear();
      const glowR = r + 4;
      const glowPoints: number[] = [];
      for (let i = 0; i < this.jellyPoints; i++) {
        const angle = (i / this.jellyPoints) * Math.PI * 2;
        const wobble = this.wobbleAmplitude *
          Math.sin(this.wobblePhase + this.wobbleOffsets[i] + angle * 2);
        const sx = Math.cos(angle) * this.squashX;
        const sy = Math.sin(angle) * this.squashY;
        const deformedGR = glowR + wobble;
        glowPoints.push(sx * deformedGR, sy * deformedGR);
      }
      if (glowPoints.length >= 4) {
        const gLastX = glowPoints[glowPoints.length - 2];
        const gLastY = glowPoints[glowPoints.length - 1];
        const gFirstX = glowPoints[0];
        const gFirstY = glowPoints[1];
        this.glowGraphics.moveTo((gLastX + gFirstX) / 2, (gLastY + gFirstY) / 2);
        for (let i = 0; i < this.jellyPoints; i++) {
          const nextIdx = (i + 1) % this.jellyPoints;
          const cx = glowPoints[i * 2];
          const cy = glowPoints[i * 2 + 1];
          const nx = glowPoints[nextIdx * 2];
          const ny = glowPoints[nextIdx * 2 + 1];
          this.glowGraphics.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
        }
        this.glowGraphics.closePath();
        this.glowGraphics.fill({ color: color, alpha: 0.12 });
      }
    }

    // --- Main jelly body ---
    this.graphics.clear();
    const points: number[] = [];
    for (let i = 0; i < this.jellyPoints; i++) {
      const angle = (i / this.jellyPoints) * Math.PI * 2;
      const wobble = this.wobbleAmplitude *
        Math.sin(this.wobblePhase + this.wobbleOffsets[i] + angle * 2);
      const sx = Math.cos(angle) * this.squashX;
      const sy = Math.sin(angle) * this.squashY;
      const deformedR = r + wobble;
      points.push(sx * deformedR, sy * deformedR);
    }

    if (points.length >= 4) {
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      const firstX = points[0];
      const firstY = points[1];
      this.graphics.moveTo((lastX + firstX) / 2, (lastY + firstY) / 2);
      for (let i = 0; i < this.jellyPoints; i++) {
        const nextIdx = (i + 1) % this.jellyPoints;
        const cx = points[i * 2];
        const cy = points[i * 2 + 1];
        const nx = points[nextIdx * 2];
        const ny = points[nextIdx * 2 + 1];
        this.graphics.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
      }
      this.graphics.closePath();
      
      this.graphics.fill(this.bodyGradient);
      this.graphics.alpha = 0.95;

      // Soft border
      this.graphics.moveTo((lastX + firstX) / 2, (lastY + firstY) / 2);
      for (let i = 0; i < this.jellyPoints; i++) {
        const nextIdx = (i + 1) % this.jellyPoints;
        const cx = points[i * 2];
        const cy = points[i * 2 + 1];
        const nx = points[nextIdx * 2];
        const ny = points[nextIdx * 2 + 1];
        this.graphics.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
      }
      this.graphics.closePath();
      this.graphics.stroke({ color: 0xFFFFFF, alpha: 0.2, width: 1.5 });

      // --- Mask Generation ---
      this.maskGraphics.clear();
      this.maskGraphics.moveTo((lastX + firstX) / 2, (lastY + firstY) / 2);
      for (let i = 0; i < this.jellyPoints; i++) {
        const nextIdx = (i + 1) % this.jellyPoints;
        const cx = points[i * 2];
        const cy = points[i * 2 + 1];
        const nx = points[nextIdx * 2];
        const ny = points[nextIdx * 2 + 1];
        this.maskGraphics.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
      }
      this.maskGraphics.closePath();
      this.maskGraphics.fill({ color: 0xFFFFFF }); // Needs fill to act as mask
    }

    // Performance: skip highlight recalc when squash is minimal (micro-jitter only)
    const squashDeviation = Math.abs(this.squashX - 1) + Math.abs(this.squashY - 1);
    if (squashDeviation < 0.03 && this.wobbleAmplitude < 0.5) return;

    // --- Highlight (specular shine & Rim Light) ---
    this.highlightGraphics.clear();
    
    // Premium Rim Light (Inner Shadow Illusion)
    const runX = r * this.squashX;
    const runY = r * this.squashY;
    
    this.highlightGraphics.circle(-runX * 0.05, -runY * 0.05, r * 0.95);
    this.highlightGraphics.circle(-runX * 0.05 + r*0.15, -runY * 0.05 + r*0.15, r * 0.95);
    this.highlightGraphics.cut();
    this.highlightGraphics.fill({ color: 0xFFFFFF, alpha: 0.25 });

    const hlOffX = -r * 0.2 * this.squashY;
    const hlOffY = -r * 0.28 * this.squashX;
    const hlR = r * 0.3;
    
    // Dynamic split highlight
    const squashFactor = this.squashX / this.squashY; 
    if (squashFactor > 1.25) {
      const splitDist = (squashFactor - 1.25) * r * 0.4;
      this.highlightGraphics
        .ellipse(hlOffX - splitDist, hlOffY, hlR * this.squashX * 0.5, hlR * this.squashY)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
      this.highlightGraphics
        .ellipse(hlOffX + splitDist, hlOffY + splitDist*0.1, hlR * this.squashX * 0.5, hlR * this.squashY)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
    } else if (squashFactor < 0.8) {
      const splitDist = (0.8 - squashFactor) * r * 0.4;
      this.highlightGraphics
        .ellipse(hlOffX, hlOffY - splitDist, hlR * this.squashX, hlR * this.squashY * 0.5)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
      this.highlightGraphics
        .ellipse(hlOffX, hlOffY + splitDist, hlR * this.squashX, hlR * this.squashY * 0.5)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
    } else {
      this.highlightGraphics
        .ellipse(hlOffX, hlOffY, hlR * this.squashX, hlR * this.squashY)
        .fill({ color: 0xFFFFFF, alpha: 0.18 });
    }
    
    this.highlightGraphics
      .circle(hlOffX * 0.7 - r * 0.15, hlOffY * 0.7 - r * 0.08, r * 0.08)
      .fill({ color: 0xFFFFFF, alpha: 0.25 });
  }

  /** Sync PixiJS container position with Matter.js body */
  syncGraphics(): void {
    if (this._destroyed) return;
    this.container.position.set(this.body.position.x, this.body.position.y);
    this.container.rotation = this.body.angle;
  }

  /** Trigger golden glow aura (called after merge creates this creature) */
  triggerLevelUpGlow(): void {
    this.levelUpGlowAlpha = 1.0;
    this.wobbleAmplitude = Math.max(this.wobbleAmplitude, 6);
  }

  /** Animate the creature shrinking before merge */
  animateMerge(): Promise<void> {
    return new Promise((resolve) => {
      const duration = 250;
      const startTime = performance.now();
      const startScale = this.container.scale.x;

      // Create Explosion Particles via VFXManager
      const vfx = VFXManager.spawnMergeFX(
          this.level, 
          this.config.radius, 
          this.config.spriteDescriptor?.theme || 'animal', 
          this.config.color
      );
      if (this.container.parent) {
          vfx.position.set(this.container.x, this.container.y);
          this.container.parent.addChild(vfx);
      } else {
          this.container.addChild(vfx);
      }

      const animate = () => {
        if (this._destroyed) {
          resolve();
          return;
        }
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const t = progress;
        const eased = t * t * (2.7 * t - 1.7);
        const scale = startScale * 1.2 * (1 - eased);
        this.spriteContainer.scale.set(Math.max(0, scale));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  /** Destroy this creature */
  destroy(engine: Matter.Engine): void {
    if (this._destroyed) return;
    this._destroyed = true;
    Matter.Composite.remove(engine.world, this.body);
    this.container.destroy({ children: true });
  }

  /** Destroy only the visual container */
  destroyVisuals(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.container.destroy({ children: true });
  }

  get isDestroyed(): boolean {
    return this._destroyed;
  }
}
