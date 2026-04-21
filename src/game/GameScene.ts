import Matter from 'matter-js';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { Barrel } from './Barrel';
import { Creature, getCreatureConfig, getCreatureRadius, MAX_LEVEL } from './Creature';
import { ScoreSystem } from './ScoreSystem';
import { UpgradeManager } from '../meta/UpgradeManager';
import { SkinManager } from '../meta/SkinManager';
import { MergeVFX } from './MergeSystem';
import { t } from '../i18n/i18n';

/** Cooldown between drops (ms) */
const DROP_COOLDOWN = 500;
/** Game over timer (ms) — creature above line for this long = game over */
const GAME_OVER_TIMEOUT = 3000;

export interface GameSceneCallbacks {
  onGameOver?: (score: number, coins: number) => void;
  onMerge?: (level: number, x: number, y: number) => void;
  onScoreChange?: (score: number) => void;
  onDrop?: () => void;
}

export class GameScene {
  public container: Container;
  public readonly vfx: MergeVFX;

  /** Economy systems (provided externally or created with defaults) */
  public readonly scoreSystem: ScoreSystem;
  public readonly upgradeManager: UpgradeManager;
  private skinManager: SkinManager | null = null;

  private app: Application;
  private engine: Matter.Engine;
  private runner: Matter.Runner;
  private barrel: Barrel;
  private creatures: Creature[] = [];
  private gameContainer: Container;
  private uiContainer: Container;
  private dropPreview: Graphics;
  private nextPreview: Graphics;

  private nextCreatureLevel = 1;
  private canDrop = true;
  private dropCooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  // Game over detection
  private overflowTimers: Map<number, number> = new Map(); // creatureId → timestamp
  private isGameOver = false;


  // Mouse position for drop preview
  private mouseX = 0;

  // Anomalies System
  private anomalyTimer = 0;
  private anomalyWait = 30000 + Math.random() * 30000; // Random 30s-60s
  private anomalyDuration = 10000; // 10 seconds
  private currentAnomaly: 'NONE' | 'BLACK_HOLE' | 'TORNADO' | 'MOON' = 'NONE';
  private anomalyText: Text;
  private baseGravityScale = 0.001;

  // Stored listener refs for cleanup
  private boundHandlers: { type: string; handler: EventListenerOrEventListenerObject; target: EventTarget; options?: boolean | AddEventListenerOptions }[] = [];

  // Callbacks
  private callbacks: GameSceneCallbacks;

  // Merge dedup per tick
  private mergedThisTick: Set<number> = new Set();

  constructor(
    app: Application,
    callbacks: GameSceneCallbacks = {},
    scoreSystem?: ScoreSystem,
    upgradeManager?: UpgradeManager,
    skinManager?: SkinManager,
  ) {
    this.app = app;
    this.scoreSystem = scoreSystem ?? new ScoreSystem();
    this.upgradeManager = upgradeManager ?? new UpgradeManager();
    this.skinManager = skinManager ?? null;
    this.callbacks = callbacks;

    // Create containers
    this.container = new Container();
    this.gameContainer = new Container();
    this.uiContainer = new Container();
    this.container.addChild(this.gameContainer);
    this.container.addChild(this.uiContainer);

    // Create Matter.js engine with jelly-tuned params
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.8, scale: 0.001 },
      positionIterations: 10,  // stable stacking
      velocityIterations: 8,   // accurate bounces
      constraintIterations: 4,
    } as any);

    // Enable sleeping for settled bodies (performance)
    (this.engine as any).enableSleeping = true;

    this.runner = Matter.Runner.create({
      delta: 1000 / 60,
    });

    // Create barrel at center of screen
    const cx = app.screen.width / 2;
    const cy = app.screen.height / 2 + 40;
    this.barrel = new Barrel(this.engine, cx, cy);
    this.gameContainer.addChild(this.barrel.container);

    // Create drop preview line
    this.dropPreview = new Graphics();
    this.uiContainer.addChild(this.dropPreview);

    // Create next creature preview
    this.nextPreview = new Graphics();
    this.uiContainer.addChild(this.nextPreview);

    // Create anomaly UI text
    this.anomalyText = new Text({
      text: '',
      style: {
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 32,
        fontWeight: '900',
        fill: 0xffffff,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 6,
          distance: 2,
        },
      },
    });
    this.anomalyText.anchor.set(0.5);
    this.anomalyText.position.set(cx, 160);
    this.anomalyText.alpha = 0;
    this.uiContainer.addChild(this.anomalyText);

    // Create VFX system
    this.vfx = new MergeVFX(this.container);

    // Roll first next creature
    this.nextCreatureLevel = this.rollNextCreatureLevel();
    this.drawNextPreview();

    // Setup collision events
    this.setupCollisionEvents();

    // Setup input handlers
    this.setupInputHandlers();
  }

  /** Start the game loop */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isGameOver = false;
    
    this.endAnomaly();
    this.anomalyTimer = 0;
    this.anomalyWait = 30000 + Math.random() * 30000;

    Matter.Runner.run(this.runner, this.engine);

    // Start the update loop via PixiJS ticker
    this.app.ticker.add(this.update, this);
  }

  /** Stop the game */
  stop(): void {
    this.isRunning = false;
    Matter.Runner.stop(this.runner);
    this.app.ticker.remove(this.update, this);
  }

  // Cached mouse position for drop preview optimization
  private lastDrawnMouseX = -1;

  /** Main update loop (called each frame) */
  private update = (): void => {
    if (!this.isRunning || this.isGameOver) return;

    const dt = this.app.ticker.deltaMS / 1000; // seconds

    // Sync all creature graphics + update jelly animations
    for (const creature of this.creatures) {
      if (creature.isDestroyed) continue;
      creature.updateJelly(dt);
      creature.syncGraphics();
    }

    // Apply magnetism attraction between same-level creatures
    this.applyMagnetism();
    
    // Process Random Physics Anomalies
    this.updateAnomalies(dt);

    // Update barrel animations (pulse/glow)
    this.barrel.updateBarrel(dt);

    // Check game over condition
    this.checkGameOver();

    // Update drop preview only if mouse moved
    if (Math.abs(this.mouseX - this.lastDrawnMouseX) > 1) {
      this.drawDropPreview();
      this.lastDrawnMouseX = this.mouseX;
    }
  };

  // ─── DROP MECHANICS ─────────────────────────────

  /** Drop a creature at the given X position */
  private dropCreature(dropX: number): void {
    if (!this.canDrop || this.isGameOver || (this.currentAnomaly !== 'NONE' && this.currentAnomaly !== 'MOON')) return;

    const dropZone = this.barrel.getDropZone();
    // Clamp X to the drop zone
    const clampedX = Math.max(
      dropZone.left + getCreatureRadius(this.nextCreatureLevel) + 5,
      Math.min(dropX, dropZone.right - getCreatureRadius(this.nextCreatureLevel) - 5)
    );
    const dropY = dropZone.y - 20;

    // Create the creature with skin color
    const skinColor = this.getSkinColor(this.nextCreatureLevel);
    const creature = new Creature(this.nextCreatureLevel, clampedX, dropY, this.engine, skinColor);
    // Apply face descriptor from active skin
    if (this.skinManager) {
      creature.setSpriteDescriptor(this.skinManager.getActiveFace(this.nextCreatureLevel));
    }
    this.creatures.push(creature);
    this.gameContainer.addChild(creature.container);

    // Fire drop callback (for sound)
    this.callbacks.onDrop?.();

    // Cooldown
    this.canDrop = false;
    this.dropCooldownTimer = setTimeout(() => {
      this.canDrop = true;
    }, DROP_COOLDOWN);

    // Roll next creature
    this.nextCreatureLevel = this.rollNextCreatureLevel();
    this.drawNextPreview();
  }

  /** Roll next creature level using UpgradeManager drop mutation table */
  private rollNextCreatureLevel(): number {
    return this.upgradeManager.rollNextCreatureLevel();
  }

  // ─── MERGE SYSTEM ───────────────────────────────

  /** Setup Matter.js collision events for merge detection and jelly deformation */
  private setupCollisionEvents(): void {
    // --- Jelly deformation on any collision ---
    const handleCollisionJelly = (pairs: Matter.Pair[]) => {
      for (const pair of pairs) {
        const creatureA = (pair.bodyA as any).creatureRef as Creature | undefined;
        const creatureB = (pair.bodyB as any).creatureRef as Creature | undefined;

        // Calculate impact force from collision
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

    // Trigger jelly on both start and active (continuous contact)
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      handleCollisionJelly(event.pairs);

      // --- Merge detection ---
      for (const pair of event.pairs) {
        const creatureA = (pair.bodyA as any).creatureRef as Creature | undefined;
        const creatureB = (pair.bodyB as any).creatureRef as Creature | undefined;

        if (!creatureA || !creatureB) continue;
        if (creatureA.isDestroyed || creatureB.isDestroyed) continue;
        if (creatureA.level !== creatureB.level) continue;

        // Dedup: skip if either creature already merged
        if (this.mergedThisTick.has(creatureA.id) || this.mergedThisTick.has(creatureB.id)) continue;

        this.mergedThisTick.add(creatureA.id);
        this.mergedThisTick.add(creatureB.id);

        this.mergeCreatures(creatureA, creatureB);
      }
    });

    // Continuous jelly deformation while touching
    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      handleCollisionJelly(event.pairs);
    });

    // Clear deduplication lock at the end of every physics engine step
    Matter.Events.on(this.engine, 'afterUpdate', () => {
      this.mergedThisTick.clear();
    });
  }

  /** Merge two creatures of the same level */
  private async mergeCreatures(a: Creature, b: Creature): Promise<void> {
    const newLevel = a.level + 1;
    const midX = (a.body.position.x + b.body.position.x) / 2;
    const midY = (a.body.position.y + b.body.position.y) / 2;
    const config = getCreatureConfig(a.level);

    // Notify callback — scoring is handled in main.ts to avoid double-counting
    this.callbacks.onMerge?.(a.level, midX, midY);

    // --- CRITICAL: Remove bodies from physics IMMEDIATELY (sync) to prevent cascade ---
    // This stops the physics engine from generating new collision events with these creatures
    Matter.Composite.remove(this.engine.world, a.body);
    Matter.Composite.remove(this.engine.world, b.body);

    // --- VFX: Merge particles (handled by Creature.animateMerge → VFXManager) ---
    // Note: spawnMergeParticles removed here to avoid double VFX spawn (audit fix #2)

    // --- VFX: Screen shake for high-level merges (≥6) ---
    if (a.level >= 6) {
      const intensity = 2 + (a.level - 6) * 0.8;
      this.vfx.screenShake(this.container, intensity);
    }

    // Animate shrink on both creatures (visual only — bodies already removed)
    a.animateMerge().then(() => a.destroyVisuals());
    b.animateMerge().then(() => b.destroyVisuals());

    this.creatures = this.creatures.filter(c => c !== a && c !== b);
    // Note: Deduplication locks (mergedThisTick) are cleared securely in 'afterUpdate' event

    // Create new creature at the midpoint (only if not max level)
    if (newLevel <= MAX_LEVEL) {
      const skinColor = this.getSkinColor(newLevel);
      const newCreature = new Creature(newLevel, midX, midY, this.engine, skinColor);
      // Apply face descriptor from active skin
      if (this.skinManager) {
        newCreature.setSpriteDescriptor(this.skinManager.getActiveFace(newLevel));
      }
      this.creatures.push(newCreature);
      this.gameContainer.addChild(newCreature.container);
      newCreature.setExpression('merging', 1.0);
      newCreature.triggerLevelUpGlow();

      // Give the new creature a small upward impulse for "pop" feel
      Matter.Body.applyForce(newCreature.body, newCreature.body.position, {
        x: 0,
        y: -0.02 * newCreature.body.mass,
      });

      // --- VFX: Dragon firework for level 11 ---
      if (newLevel === MAX_LEVEL) {
        this.vfx.showDragonFirework(midX, midY);
      }
    } else {
      // Max level exceeded — still show firework for the final merge
      this.vfx.showDragonFirework(midX, midY);
    }
  }



  // ─── SKIN INTEGRATION ──────────────────────────────

  /** Get skin color for a creature level */
  private getSkinColor(level: number): number | undefined {
    if (!this.skinManager) return undefined;
    const hexStr = this.skinManager.getCreatureColor(level);
    return parseInt(hexStr.replace('#', ''), 16);
  }

  // ─── MAGNETISM ────────────────────────────────────

  /** Apply magnetic attraction between same-level creatures */
  private applyMagnetism(): void {
    const magnetRadius = this.upgradeManager.getEffect('magnetism') as number;
    if (magnetRadius <= 0) return;

    const len = this.creatures.length;
    for (let i = 0; i < len; i++) {
      const a = this.creatures[i];
      if (a.isDestroyed) continue;

      for (let j = i + 1; j < len; j++) {
        const b = this.creatures[j];
        if (b.isDestroyed) continue;
        if (a.level !== b.level) continue;

        const dx = b.body.position.x - a.body.position.x;
        const dy = b.body.position.y - a.body.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sumR = a.body.circleRadius! + b.body.circleRadius!;

        // Only apply within magnetism radius (centered from surface, not center)
        if (dist > sumR + magnetRadius) continue;
        if (dist < 1) continue; // avoid division by zero

        // Force strength: stronger when closer
        const overlap = sumR + magnetRadius - dist;
        const strength = 0.00004 * overlap;
        const nx = dx / dist;
        const ny = dy / dist;

        // Wake sleeping bodies so magnetism actually works (audit fix #7)
        Matter.Sleeping.set(a.body, false);
        Matter.Sleeping.set(b.body, false);

        Matter.Body.applyForce(a.body, a.body.position, {
          x: nx * strength * a.body.mass,
          y: ny * strength * a.body.mass,
        });
        Matter.Body.applyForce(b.body, b.body.position, {
          x: -nx * strength * b.body.mass,
          y: -ny * strength * b.body.mass,
        });
      }
    }
  }

  // ─── RANDOM ANOMALIES ─────────────────────────────

  private updateAnomalies(dt: number): void {
    if (this.currentAnomaly === 'NONE') {
      this.anomalyTimer += dt * 1000;
      if (this.anomalyTimer >= this.anomalyWait) {
         this.startRandomAnomaly();
      }
    } else {
      this.anomalyTimer -= dt * 1000;
      this.applyAnomalyPhysics();
      if (this.anomalyTimer <= 0) {
         this.endAnomaly();
      }
    }
  }

  private startRandomAnomaly(): void {
    const types: ('BLACK_HOLE' | 'TORNADO' | 'MOON')[] = 
      ['BLACK_HOLE', 'TORNADO', 'MOON'];
    this.currentAnomaly = types[Math.floor(Math.random() * types.length)];
    this.anomalyTimer = this.anomalyDuration;
    
    // Only close lid if it's not moon gravity
    this.barrel.setLidClosed(this.currentAnomaly !== 'MOON');
    
    // UI Warning Text
    const names = {
       'BLACK_HOLE': `${t('anomaly_prefix')}\n${t('anomaly_blackhole')}`,
       'TORNADO': `${t('anomaly_prefix')}\n${t('anomaly_tornado')}`,
       'MOON': `${t('anomaly_prefix')}\n${t('anomaly_moon')}`,
    };
    const colors = {
       'BLACK_HOLE': 0x8a2be2,
       'TORNADO': 0x32cd32,
       'MOON': 0xaaaaaa
    };
    
    this.anomalyText.text = names[this.currentAnomaly];
    this.anomalyText.style.fill = colors[this.currentAnomaly];
    this.anomalyText.alpha = 1;
    this.anomalyText.scale.set(0);
    
    const duration = 1500;
    const startObj = performance.now();
    const anim = () => {
      if (!this.isRunning || this.currentAnomaly === 'NONE') return;
      const p = Math.min((performance.now() - startObj) / duration, 1);
      const eased = p * p * (3 - 2 * p);
      if (p < 0.2) this.anomalyText.scale.set(eased * 5); // Pop in
      else if (p < 0.8) this.anomalyText.scale.set(1 + Math.sin(p * Math.PI * 12) * 0.05); // Shake
      else {
        this.anomalyText.scale.set(1);
        this.anomalyText.alpha = 1 - (p - 0.8) * 5; // Fade out
      }
      if (p < 1 && this.anomalyTimer > 0) requestAnimationFrame(anim);
      else this.anomalyText.alpha = 0;
    };
    requestAnimationFrame(anim);
    
    // Physics initialization per anomaly
    if (this.currentAnomaly === 'MOON') {
      this.engine.gravity.y = 0.2; // 2x weaker than before
      this.engine.gravity.x = 0;
      this.engine.gravity.scale = this.baseGravityScale;
    } else {
      this.engine.gravity.y = 0; // Black Hole and Centrifuge rely entirely on forces
      this.engine.gravity.x = 0;
      this.engine.gravity.scale = this.baseGravityScale;
    }
  }

  private applyAnomalyPhysics(): void {
    const cx = this.barrel.centerX;
    const cy = this.barrel.centerY;
    
    if (this.currentAnomaly === 'TORNADO') {
      const timeSec = (this.anomalyDuration - this.anomalyTimer) / 1000;
      const angle = timeSec * Math.PI * 1.6; // 2x faster rotation
      this.engine.gravity.x = Math.cos(angle) * 3.6; // 2x stronger gravity
      this.engine.gravity.y = Math.sin(angle) * 3.6;
      return; 
    }
    
    const bodies = Matter.Composite.allBodies(this.engine.world);
    for (const body of bodies) {
      if (!body.label.startsWith('creature_')) continue;
      
      const dx = body.position.x - cx;
      const dy = body.position.y - cy;
      const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
      
      if (this.currentAnomaly === 'BLACK_HOLE') {
        const force = 0.00070 * body.mass; // 2x stronger
        Matter.Body.applyForce(body, body.position, { x: -(dx/dist)*force, y: -(dy/dist)*force });
      }
    }
  }

  private endAnomaly(): void {
    this.currentAnomaly = 'NONE';
    this.anomalyText.alpha = 0;
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 1.8;
    this.engine.gravity.scale = this.baseGravityScale;
    this.barrel.setLidClosed(false);
    this.anomalyWait = 30000 + Math.random() * 30000; // reroll next timer
  }

  // ─── GAME OVER DETECTION ─────────────────────────

  /** Check if any creature is above the danger line for too long */
  private checkGameOver(): void {
    const topLine = this.barrel.getTopLine();
    const now = performance.now();

    for (const creature of this.creatures) {
      if (creature.isDestroyed) continue;

      const creatureTop = creature.body.position.y - getCreatureRadius(creature.level);

      if (creatureTop < topLine) {
        // Creature is above the line
        if (!this.overflowTimers.has(creature.id)) {
          this.overflowTimers.set(creature.id, now);
        } else {
          const startTime = this.overflowTimers.get(creature.id)!;
          if (now - startTime >= GAME_OVER_TIMEOUT) {
            this.triggerGameOver();
            return;
          }
        }
      } else {
        // Creature is back inside
        this.overflowTimers.delete(creature.id);
      }
    }
  }

  /** Trigger game over */
  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.endAnomaly(); // Reset gravity/anomaly state before stopping (audit fix #4)
    this.stop();

    // GameOverPopup is created by main.ts via onGameOver callback
    this.callbacks.onGameOver?.(this.scoreSystem.score, this.scoreSystem.coins);
    console.log(`[GameScene] Game Over! Score: ${this.scoreSystem.score}, Coins: ${this.scoreSystem.coins}`);
  }

  // ─── INPUT HANDLERS ─────────────────────────────

  private setupInputHandlers(): void {
    const canvas = this.app.canvas as HTMLCanvasElement;

    const addHandler = (target: EventTarget, type: string, handler: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      target.addEventListener(type, handler, options);
      this.boundHandlers.push({ type, handler, target, options });
    };

    // --- Desktop: Mouse ---
    addHandler(canvas, 'mousemove', (e: Event) => {
      this.mouseX = (e as MouseEvent).offsetX;
    });

    addHandler(canvas, 'click', (e: Event) => {
      if (!this.isRunning || this.isGameOver) return;
      this.dropCreature((e as MouseEvent).offsetX);
    });

    // Mouse wheel (disabled)
    addHandler(canvas, 'wheel', (e: Event) => {
      e.preventDefault();
    }, { passive: false });

    // --- Mobile: Touch ---
    addHandler(canvas, 'touchstart', (e: Event) => {
      if (!this.isRunning || this.isGameOver) return;
      e.preventDefault();
      const touch = (e as TouchEvent).touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
    }, { passive: false });

    addHandler(canvas, 'touchmove', (e: Event) => {
      if (!this.isRunning || this.isGameOver) return;
      e.preventDefault();
      const touch = (e as TouchEvent).touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
    }, { passive: false });

    addHandler(canvas, 'touchend', (e: Event) => {
      if (!this.isRunning || this.isGameOver) return;
      e.preventDefault();
      this.dropCreature(this.mouseX);
    }, { passive: false });
  }

  /** Remove all event listeners to prevent memory leaks */
  private removeInputHandlers(): void {
    for (const { type, handler, target, options } of this.boundHandlers) {
      target.removeEventListener(type, handler, options);
    }
    this.boundHandlers = [];
  }

  // ─── DRAWING ────────────────────────────────────

  /** Draw the drop preview line */
  private drawDropPreview(): void {
    this.dropPreview.clear();

    if (!this.canDrop || this.isGameOver || (this.currentAnomaly !== 'NONE' && this.currentAnomaly !== 'MOON')) return;

    const dropZone = this.barrel.getDropZone();
    const clampedX = Math.max(
      dropZone.left + getCreatureRadius(this.nextCreatureLevel) + 5,
      Math.min(this.mouseX, dropZone.right - getCreatureRadius(this.nextCreatureLevel) - 5)
    );

    const startY = dropZone.y - 40;
    const endY = this.barrel.centerY + this.barrel.radius;
    const totalLen = endY - startY;

    // Gradient beam — solid line that fades toward bottom
    const segments = 12;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const segY = startY + t * totalLen;
      const segEnd = startY + (i + 1) / segments * totalLen;
      const alpha = 0.3 * (1 - t * 0.8); // Fades from 0.3 to 0.06
      this.dropPreview
        .moveTo(clampedX, segY)
        .lineTo(clampedX, segEnd)
        .stroke({ color: 0xFFFFFF, alpha, width: 2 });
    }

    // Glowing preview circle at drop point
    const config = getCreatureConfig(this.nextCreatureLevel);
    // Outer glow
    this.dropPreview
      .circle(clampedX, startY, config.radius * 0.55)
      .fill({ color: config.color, alpha: 0.15 });
    // Inner solid
    this.dropPreview
      .circle(clampedX, startY, config.radius * 0.4)
      .fill({ color: config.color, alpha: 0.5 });
    // Highlight
    this.dropPreview
      .circle(clampedX - config.radius * 0.1, startY - config.radius * 0.1, config.radius * 0.12)
      .fill({ color: 0xFFFFFF, alpha: 0.35 });
  }

  /** Draw the next creature preview */
  private drawNextPreview(): void {
    this.nextPreview.clear();

    const config = getCreatureConfig(this.nextCreatureLevel);
    const previewX = this.app.screen.width - 50;
    const previewY = 50;

    // Outer glow
    this.nextPreview
      .circle(previewX, previewY, 30)
      .fill({ color: config.color, alpha: 0.15 });

    // Background circle
    this.nextPreview
      .circle(previewX, previewY, 25)
      .fill({ color: 0x2a2a4e, alpha: 0.8 });

    // Creature preview (scaled down)
    this.nextPreview
      .circle(previewX, previewY, 18)
      .fill({ color: config.color, alpha: 0.9 });

    // Specular highlight
    this.nextPreview
      .circle(previewX - 5, previewY - 5, 6)
      .fill({ color: 0xFFFFFF, alpha: 0.3 });

    // Border with glow
    this.nextPreview
      .circle(previewX, previewY, 25)
      .stroke({ color: 0x4a90d9, alpha: 0.6, width: 2 });
  }

  // ─── CLEANUP ────────────────────────────────────

  /** Destroy the entire scene */
  destroy(): void {
    this.stop();
    this.removeInputHandlers();

    if (this.dropCooldownTimer) {
      clearTimeout(this.dropCooldownTimer);
    }

    for (const creature of this.creatures) {
      creature.destroy(this.engine);
    }
    this.creatures = [];

    this.vfx.destroy();
    this.barrel.destroy();
    Matter.Engine.clear(this.engine);
    this.container.destroy({ children: true });
  }

  // ─── PUBLIC API (for Agent 2, 5, 6) ──────────────

  /** Get current barrel center for UI positioning */
  getBarrelCenter(): { x: number; y: number } {
    return { x: this.barrel.centerX, y: this.barrel.centerY };
  }

  /** Set barrel radius multiplier (from UpgradeManager) */
  setBarrelRadiusMultiplier(mult: number): void {
    this.barrel.setRadiusMultiplier(mult);
  }



  /** Remove top N creatures (for rewarded video "continue" feature) */
  removeTopCreatures(count: number): void {
    // Sort by Y position (ascending = highest first)
    const sorted = [...this.creatures]
      .filter(c => !c.isDestroyed)
      .sort((a, b) => a.body.position.y - b.body.position.y);

    const toRemove = new Set(sorted.slice(0, count));
    for (const creature of toRemove) {
      // Generate explosion particles before destroying!
      const config = getCreatureConfig(creature.level);
      this.vfx.spawnMergeParticles(creature.body.position.x, creature.body.position.y, config.color, creature.level);
      creature.destroy(this.engine);
    }
    // Batch filter (audit fix #5: avoid O(n²) repeated filter)
    this.creatures = this.creatures.filter(c => !toRemove.has(c));

    // Reset overflow timers
    this.overflowTimers.clear();
  }

  /** Resume after game over (for rewarded video continuation) */
  resume(): void {
    this.isGameOver = false;
    this.overflowTimers.clear();
    this.start();
  }
}
