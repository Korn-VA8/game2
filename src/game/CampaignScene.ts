/**
 * CampaignScene — Game scene for campaign mode.
 * Isolated from shop upgrades, uses CampaignBarrel with custom shapes,
 * and checks victory condition (target creature level reached).
 */

import Matter from 'matter-js';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CampaignBarrel } from './CampaignBarrel';
import type { BarrelConfig } from './CampaignBarrel';
import { Creature, getCreatureConfig, getCreatureRadius, MAX_LEVEL } from './Creature';
import { MergeVFX } from './MergeSystem';
import type { LevelConfig } from './LevelConfig';
import type { SkinManager } from '../meta/SkinManager';

/** Cooldown between drops (ms) */
const DROP_COOLDOWN = 500;
/** Game over timer (ms) */
const GAME_OVER_TIMEOUT = 3000;

export interface CampaignSceneCallbacks {
  onVictory?: (levelId: number) => void;
  onDefeat?: (levelId: number) => void;
  onMerge?: (level: number, x: number, y: number) => void;
  onDrop?: () => void;
}

export class CampaignScene {
  public container: Container;
  public readonly vfx: MergeVFX;

  private app: Application;
  private engine: Matter.Engine;
  private runner: Matter.Runner;
  private barrel: CampaignBarrel;
  private creatures: Creature[] = [];
  private gameContainer: Container;
  private uiContainer: Container;
  private dropPreview: Graphics;
  private goalText: Text;

  private levelConfig: LevelConfig;
  private skinManager: SkinManager | null = null;

  private nextCreatureLevel = 1;
  private canDrop = true;
  private dropCooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private isGameOver = false;
  private isVictory = false;

  private overflowTimers: Map<number, number> = new Map();
  private mouseX = 0;
  private lastDrawnMouseX = -1;
  private mergedThisTick: Set<number> = new Set();

  private boundHandlers: { type: string; handler: EventListenerOrEventListenerObject; target: EventTarget; options?: boolean | AddEventListenerOptions }[] = [];
  private callbacks: CampaignSceneCallbacks;

  constructor(
    app: Application,
    levelConfig: LevelConfig,
    callbacks: CampaignSceneCallbacks = {},
    skinManager?: SkinManager,
  ) {
    this.app = app;
    this.levelConfig = levelConfig;
    this.skinManager = skinManager ?? null;
    this.callbacks = callbacks;

    // Create containers
    this.container = new Container();
    this.gameContainer = new Container();
    this.uiContainer = new Container();
    this.container.addChild(this.gameContainer);
    this.container.addChild(this.uiContainer);

    // Create Matter.js engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.8, scale: 0.001 },
      positionIterations: 10,
      velocityIterations: 8,
      constraintIterations: 4,
    } as any);
    (this.engine as any).enableSleeping = true;

    this.runner = Matter.Runner.create({ delta: 1000 / 60 });

    // Create campaign barrel with the level's shape config
    const barrelConfig: BarrelConfig = {
      shape: levelConfig.barrelShape,
      widthRatio: levelConfig.widthRatio,
      heightRatio: levelConfig.heightRatio,
      obstacles: levelConfig.obstacles,
    };

    this.barrel = new CampaignBarrel(
      this.engine,
      app.screen.width,
      app.screen.height,
      barrelConfig,
    );
    this.gameContainer.addChild(this.barrel.container);

    // Create drop preview
    this.dropPreview = new Graphics();
    this.uiContainer.addChild(this.dropPreview);

    // Create goal text
    const goalLabel = `Цель: Ур. ${levelConfig.targetLevel}`;
    this.goalText = new Text({
      text: goalLabel,
      style: new TextStyle({
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 18,
        fontWeight: '700',
        fill: 0xf8b500,
        letterSpacing: 1,
        dropShadow: { color: 0x000000, blur: 4, distance: 1, alpha: 0.5 },
      }),
    });
    this.goalText.anchor.set(0.5, 0);
    this.goalText.position.set(app.screen.width / 2, 80);
    this.uiContainer.addChild(this.goalText);

    // Create VFX system
    this.vfx = new MergeVFX(this.container);

    // Roll first creature
    this.nextCreatureLevel = this.rollNextCreatureLevel();

    // Setup collision and input
    this.setupCollisionEvents();
    this.setupInputHandlers();
  }

  // ─── Lifecycle ────────────────────────────────────

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGameOver = false;
    this.isVictory = false;
    Matter.Runner.run(this.runner, this.engine);
    this.app.ticker.add(this.update, this);
  }

  stop(): void {
    this.isRunning = false;
    Matter.Runner.stop(this.runner);
    this.app.ticker.remove(this.update, this);
  }

  // ─── Update ───────────────────────────────────────

  private update = (): void => {
    if (!this.isRunning || this.isGameOver || this.isVictory) return;

    const dt = this.app.ticker.deltaMS / 1000;

    for (const creature of this.creatures) {
      if (creature.isDestroyed) continue;
      creature.updateJelly(dt);
      creature.syncGraphics();
    }

    this.barrel.updateBarrel(dt);
    this.checkGameOver();

    if (Math.abs(this.mouseX - this.lastDrawnMouseX) > 1) {
      this.drawDropPreview();
      this.lastDrawnMouseX = this.mouseX;
    }
  };

  // ─── Drop ─────────────────────────────────────────

  private dropCreature(dropX: number): void {
    if (!this.canDrop || this.isGameOver || this.isVictory) return;

    const dropZone = this.barrel.getDropZone();
    const clampedX = Math.max(
      dropZone.left + getCreatureRadius(this.nextCreatureLevel) + 5,
      Math.min(dropX, dropZone.right - getCreatureRadius(this.nextCreatureLevel) - 5),
    );
    const dropY = dropZone.y;

    const skinColor = this.getSkinColor(this.nextCreatureLevel);
    const creature = new Creature(this.nextCreatureLevel, clampedX, dropY, this.engine, skinColor);
    if (this.skinManager) {
      creature.setSpriteDescriptor(this.skinManager.getActiveFace(this.nextCreatureLevel));
    }
    this.creatures.push(creature);
    this.gameContainer.addChild(creature.container);

    this.callbacks.onDrop?.();

    this.canDrop = false;
    this.dropCooldownTimer = setTimeout(() => { this.canDrop = true; }, DROP_COOLDOWN);

    this.nextCreatureLevel = this.rollNextCreatureLevel();
  }

  /** Roll next creature — respects dropLevelCap from level config */
  private rollNextCreatureLevel(): number {
    const cap = this.levelConfig.dropLevelCap;
    if (cap !== null) {
      // Only drop levels 1 through cap, uniform random
      return Math.floor(Math.random() * cap) + 1;
    }
    // Default: 50/50 between level 1 and 2 (base behavior without upgrades)
    return Math.random() < 0.5 ? 1 : 2;
  }

  // ─── Merge ────────────────────────────────────────

  private setupCollisionEvents(): void {
    const handleCollisionJelly = (pairs: Matter.Pair[]) => {
      for (const pair of pairs) {
        const creatureA = (pair.bodyA as any).creatureRef as Creature | undefined;
        const creatureB = (pair.bodyB as any).creatureRef as Creature | undefined;

        const contact = pair.collision;
        const normal = contact.normal;
        const relVel = Matter.Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity);
        const impactSpeed = Math.abs(relVel.x * normal.x + relVel.y * normal.y);

        if (creatureA && !creatureA.isDestroyed) {
          creatureA.onCollision(impactSpeed, normal.x, normal.y);
        }
        if (creatureB && !creatureB.isDestroyed) {
          creatureB.onCollision(impactSpeed, -normal.x, -normal.y);
        }
      }
    };

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      handleCollisionJelly(event.pairs);

      for (const pair of event.pairs) {
        const creatureA = (pair.bodyA as any).creatureRef as Creature | undefined;
        const creatureB = (pair.bodyB as any).creatureRef as Creature | undefined;

        if (!creatureA || !creatureB) continue;
        if (creatureA.isDestroyed || creatureB.isDestroyed) continue;
        if (creatureA.level !== creatureB.level) continue;
        if (this.mergedThisTick.has(creatureA.id) || this.mergedThisTick.has(creatureB.id)) continue;

        this.mergedThisTick.add(creatureA.id);
        this.mergedThisTick.add(creatureB.id);
        this.mergeCreatures(creatureA, creatureB);
      }
    });

    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      handleCollisionJelly(event.pairs);
    });

    Matter.Events.on(this.engine, 'afterUpdate', () => {
      this.mergedThisTick.clear();
    });
  }

  private async mergeCreatures(a: Creature, b: Creature): Promise<void> {
    const newLevel = a.level + 1;
    const midX = (a.body.position.x + b.body.position.x) / 2;
    const midY = (a.body.position.y + b.body.position.y) / 2;

    this.callbacks.onMerge?.(a.level, midX, midY);

    Matter.Composite.remove(this.engine.world, a.body);
    Matter.Composite.remove(this.engine.world, b.body);

    if (a.level >= 6) {
      const intensity = 2 + (a.level - 6) * 0.8;
      this.vfx.screenShake(this.container, intensity);
    }

    a.animateMerge().then(() => a.destroyVisuals());
    b.animateMerge().then(() => b.destroyVisuals());
    this.creatures = this.creatures.filter(c => c !== a && c !== b);

    if (newLevel <= MAX_LEVEL) {
      const skinColor = this.getSkinColor(newLevel);
      const newCreature = new Creature(newLevel, midX, midY, this.engine, skinColor);
      if (this.skinManager) {
        newCreature.setSpriteDescriptor(this.skinManager.getActiveFace(newLevel));
      }
      this.creatures.push(newCreature);
      this.gameContainer.addChild(newCreature.container);
      newCreature.setExpression('merging', 1.0);
      newCreature.triggerLevelUpGlow();

      Matter.Body.applyForce(newCreature.body, newCreature.body.position, {
        x: 0, y: -0.02 * newCreature.body.mass,
      });

      // Check victory condition!
      if (newLevel >= this.levelConfig.targetLevel) {
        this.triggerVictory();
      }

      if (newLevel === MAX_LEVEL) {
        this.vfx.showDragonFirework(midX, midY);
      }
    } else {
      this.vfx.showDragonFirework(midX, midY);
      // Max level merged — definitely victory
      if (MAX_LEVEL >= this.levelConfig.targetLevel) {
        this.triggerVictory();
      }
    }
  }

  // ─── Victory / Defeat ─────────────────────────────

  private triggerVictory(): void {
    if (this.isVictory) return;
    this.isVictory = true;

    // Small delay to let the merge animation play
    setTimeout(() => {
      this.stop();
      this.callbacks.onVictory?.(this.levelConfig.id);
    }, 800);
  }

  private checkGameOver(): void {
    const topLine = this.barrel.getTopLine();
    const now = performance.now();

    for (const creature of this.creatures) {
      if (creature.isDestroyed) continue;
      const creatureTop = creature.body.position.y - getCreatureRadius(creature.level);

      if (creatureTop < topLine) {
        if (!this.overflowTimers.has(creature.id)) {
          this.overflowTimers.set(creature.id, now);
        } else {
          const startTime = this.overflowTimers.get(creature.id)!;
          if (now - startTime >= GAME_OVER_TIMEOUT) {
            this.triggerDefeat();
            return;
          }
        }
      } else {
        this.overflowTimers.delete(creature.id);
      }
    }
  }

  private triggerDefeat(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.stop();
    this.callbacks.onDefeat?.(this.levelConfig.id);
  }

  // ─── Skin ─────────────────────────────────────────

  private getSkinColor(level: number): number | undefined {
    if (!this.skinManager) return undefined;
    const hexStr = this.skinManager.getCreatureColor(level);
    return parseInt(hexStr.replace('#', ''), 16);
  }

  // ─── Input ────────────────────────────────────────

  private setupInputHandlers(): void {
    const canvas = this.app.canvas as HTMLCanvasElement;

    const addHandler = (target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      target.addEventListener(type, handler, options);
      this.boundHandlers.push({ type, handler, target, options });
    };

    addHandler(canvas, 'mousemove', (e: Event) => {
      this.mouseX = (e as MouseEvent).offsetX;
    });
    addHandler(canvas, 'click', (e: Event) => {
      if (!this.isRunning || this.isGameOver || this.isVictory) return;
      this.dropCreature((e as MouseEvent).offsetX);
    });
    addHandler(canvas, 'wheel', (e: Event) => { e.preventDefault(); }, { passive: false });

    addHandler(canvas, 'touchstart', (e: Event) => {
      if (!this.isRunning || this.isGameOver || this.isVictory) return;
      e.preventDefault();
      const touch = (e as TouchEvent).touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
    }, { passive: false });

    addHandler(canvas, 'touchmove', (e: Event) => {
      if (!this.isRunning || this.isGameOver || this.isVictory) return;
      e.preventDefault();
      const touch = (e as TouchEvent).touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
    }, { passive: false });

    addHandler(canvas, 'touchend', (e: Event) => {
      if (!this.isRunning || this.isGameOver || this.isVictory) return;
      e.preventDefault();
      this.dropCreature(this.mouseX);
    }, { passive: false });
  }

  private removeInputHandlers(): void {
    for (const { type, handler, target, options } of this.boundHandlers) {
      target.removeEventListener(type, handler, options);
    }
    this.boundHandlers = [];
  }

  // ─── Drawing ──────────────────────────────────────

  private drawDropPreview(): void {
    this.dropPreview.clear();
    if (!this.canDrop || this.isGameOver || this.isVictory) return;

    const dropZone = this.barrel.getDropZone();
    const clampedX = Math.max(
      dropZone.left + getCreatureRadius(this.nextCreatureLevel) + 5,
      Math.min(this.mouseX, dropZone.right - getCreatureRadius(this.nextCreatureLevel) - 5),
    );

    const startY = dropZone.y;
    const endY = this.barrel.centerY + this.barrel.halfH;
    const totalLen = endY - startY;

    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const segY = startY + t * totalLen;
      const segEnd = startY + (i + 1) / segments * totalLen;
      const alpha = 0.3 * (1 - t * 0.8);
      this.dropPreview.moveTo(clampedX, segY).lineTo(clampedX, segEnd).stroke({ color: 0xFFFFFF, alpha, width: 2 });
    }

    const config = getCreatureConfig(this.nextCreatureLevel);
    this.dropPreview.circle(clampedX, startY, config.radius * 0.55).fill({ color: config.color, alpha: 0.15 });
    this.dropPreview.circle(clampedX, startY, config.radius * 0.4).fill({ color: config.color, alpha: 0.5 });
    this.dropPreview.circle(clampedX - config.radius * 0.1, startY - config.radius * 0.1, config.radius * 0.12).fill({ color: 0xFFFFFF, alpha: 0.35 });
  }

  // ─── Cleanup ──────────────────────────────────────

  destroy(): void {
    this.stop();
    this.removeInputHandlers();

    if (this.dropCooldownTimer) clearTimeout(this.dropCooldownTimer);

    for (const creature of this.creatures) {
      creature.destroy(this.engine);
    }
    this.creatures = [];

    this.vfx.destroy();
    this.barrel.destroy();
    Matter.Engine.clear(this.engine);
    this.container.destroy({ children: true });
  }
}
