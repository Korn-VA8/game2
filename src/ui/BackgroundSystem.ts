import { Container, Graphics, Sprite, BlurFilter } from 'pixi.js';

interface GlowOrb {
  sprite: Sprite;
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
  scalePhase: number;
  scaleSpeed: number;
  baseScale: number;
}

interface ShapeDrop {
  gfx: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotationSpeed: number;
  scalePhase: number;
  scaleSpeed: number;
  alphaPhase: number;
  alphaSpeed: number;
}

export class BackgroundSystem extends Container {
  private sw: number;
  private sh: number;

  private glowContainer: Container;
  private shapesContainer: Container;
  private dustContainer: Container;
  private gridContainer: Container;

  private orbs: GlowOrb[] = [];
  private shapes: ShapeDrop[] = [];
  private dustDrops: ShapeDrop[] = [];

  private baseColor = 0x120a21; // Dark indigo
  private bgRect: Graphics;

  private flashGfx: Graphics;
  private flashAlpha = 0;

  // Anomaly effects
  private anomalyMultiplier = 1.0;
  private targetAnomalyMultiplier = 1.0;
  private swirlAngle = 0;
  private isSwirling = false;
  
  // Display Mode
  private displayMode: 'menu' | 'gameplay' | 'static' = 'menu';

  constructor(sw: number, sh: number) {
    super();
    this.sw = sw;
    this.sh = sh;

    // 1. Base Layer
    this.bgRect = new Graphics();
    this.bgRect.rect(0, 0, sw, sh).fill(this.baseColor);
    this.addChild(this.bgRect);

    // 2. Glow Layer (Ambient Color Spots)
    this.glowContainer = new Container();
    this.addChild(this.glowContainer);
    this.initGlows();

    // 3. Floating Geometry
    this.shapesContainer = new Container();
    this.addChild(this.shapesContainer);
    this.initShapes();

    // 4. Ambient Dust
    this.dustContainer = new Container();
    this.addChild(this.dustContainer);
    this.initDust();

    // 5. Static Grid (for non-menu screens)
    this.gridContainer = new Container();
    this.gridContainer.alpha = 0; // hidden by default
    this.gridContainer.visible = false;
    this.addChild(this.gridContainer);
    this.initGrid();

    // 6. Flash Layer (for merges)
    this.flashGfx = new Graphics();
    this.flashGfx.rect(0, 0, sw, sh).fill(0xffffff);
    this.flashGfx.alpha = 0;
    this.flashGfx.blendMode = 'add';
    this.addChild(this.flashGfx);
  }

  private initGlows() {
    // 3 huge blurry orbs for ambient gradients
    const colors = [0x6b21a8, 0x9d174d, 0x0f766e]; // Purple, Pink, Teal
    const radius = Math.max(this.sw, this.sh) * 0.6;

    for (let i = 0; i < 3; i++) {
      // Create a heavily blurred circle
      const gfx = new Graphics();
      gfx.circle(0, 0, radius).fill(colors[i]);
      
      const blur = new BlurFilter({ strength: 100, quality: 4 });
      gfx.filters = [blur];
      gfx.alpha = 0.5;

      // Extract to texture for performance (so we don't run blur filter every frame)
      // Actually, since we scale and move them, and BlurFilter is costly,
      // it's better to just use cacheAsBitmap or let Pixi handle it if it's static.
      // But we will move the sprite instead of redrawing the graphics.
      
      // Wait, Pixi v8 generateTexture is async, so we'll just keep the Graphics with the filter. 
      // It's just 3 shapes, should be fine. To be extremely fast, we could generate a radial gradient texture manually, 
      // but let's stick to graphics + blur for now, and fallback if slow.
      // A better way: just create a radial gradient using Canvas API and convert to Sprite.
      const canvas = document.createElement('canvas');
      const R = 256;
      canvas.width = R * 2;
      canvas.height = R * 2;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(R, R, 0, R, R, R);
      grad.addColorStop(0, `#${colors[i].toString(16).padStart(6, '0')}88`); // 50% opacity center
      grad.addColorStop(1, `#${colors[i].toString(16).padStart(6, '0')}00`); // 0% opacity edge
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, R * 2, R * 2);

      const sprite = Sprite.from(canvas);
      sprite.anchor.set(0.5);
      
      // Scale it up to fill the screen
      const targetScale = (radius * 2) / (R * 2);
      sprite.scale.set(targetScale);

      sprite.blendMode = 'screen';

      this.glowContainer.addChild(sprite);

      this.orbs.push({
        sprite,
        baseX: this.sw / 2 + (Math.random() - 0.5) * this.sw * 0.5,
        baseY: this.sh / 2 + (Math.random() - 0.5) * this.sh * 0.5,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        speedX: (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
        speedY: (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
        scalePhase: Math.random() * Math.PI * 2,
        scaleSpeed: Math.random() * 0.5 + 0.2,
        baseScale: targetScale,
      });
    }
  }

  private initShapes() {
    const numShapes = 8;
    const padding = 100;

    for (let i = 0; i < numShapes; i++) {
      const gfx = new Graphics();
      
      // Random shape: softly rounded rect or circle or hollow ring
      const type = Math.random();
      const size = Math.random() * 40 + 20;
      
      gfx.alpha = Math.random() * 0.15 + 0.05; // 0.05 - 0.20
      gfx.blendMode = 'add';

      // Use white/light blue for ambient glass feel
      const color = 0xffffff;

      if (type < 0.33) {
        gfx.circle(0, 0, size).fill(color);
      } else if (type < 0.66) {
        gfx.roundRect(-size/2, -size/2, size, size, size * 0.3).fill(color);
      } else {
        gfx.circle(0, 0, size).stroke({ width: Math.max(2, size * 0.1), color: color });
      }

      // No blur needed — at alpha 0.05-0.20 blur is imperceptible, saves GPU

      const x = Math.random() * this.sw;
      const y = Math.random() * this.sh;
      gfx.position.set(x, y);

      this.shapesContainer.addChild(gfx);

      this.shapes.push({
        gfx,
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: -(Math.random() * 15 + 5), // Float up
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        scalePhase: Math.random() * Math.PI * 2,
        scaleSpeed: Math.random() * 2 + 1,
        alphaPhase: Math.random() * Math.PI * 2,
        alphaSpeed: Math.random() * 1 + 0.5,
      });
    }
  }

  private initDust() {
    const numDust = 20;
    
    for (let i = 0; i < numDust; i++) {
      const gfx = new Graphics();
      const size = Math.random() * 2 + 1;
      gfx.circle(0, 0, size).fill(0xffffff);
      gfx.alpha = Math.random() * 0.3 + 0.1;
      
      const x = Math.random() * this.sw;
      const y = Math.random() * this.sh;
      gfx.position.set(x, y);

      this.dustContainer.addChild(gfx);

      this.dustDrops.push({
        gfx,
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -(Math.random() * 25 + 10), // Float up slightly faster than shapes
        rotationSpeed: 0,
        scalePhase: 0,
        scaleSpeed: 0,
        alphaPhase: Math.random() * Math.PI * 2,
        alphaSpeed: Math.random() * 3 + 1,
      });
    }
  }

  private initGrid() {
    this.gridContainer.removeChildren();
    const grid = new Graphics();
    for (let x = 0; x < this.sw; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.sh);
    }
    for (let y = 0; y < this.sh; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(this.sw, y);
    }
    grid.stroke({ color: 0xffffff, alpha: 0.02, width: 0.5 });
    this.gridContainer.addChild(grid);
  }

  /**
   * Called automatically by Ticker
   * @param dt delta time in seconds (e.g., 0.016 for 60fps)
   */
  update(dt: number) {
    if (this.displayMode === 'static') return;

    if (dt > 0.1) dt = 0.1; // Cap at 100ms to prevent huge jumps

    // Smooth transition for anomaly multiplier
    this.anomalyMultiplier += (this.targetAnomalyMultiplier - this.anomalyMultiplier) * 5 * dt;

    // 1. Update Glows (Lissajous)
    for (const orb of this.orbs) {
      orb.phaseX += orb.speedX * this.anomalyMultiplier * dt;
      orb.phaseY += orb.speedY * this.anomalyMultiplier * dt;
      orb.scalePhase += orb.scaleSpeed * this.anomalyMultiplier * dt;

      // Move in a bounding box around center
      const rangeX = this.sw * 0.4;
      const rangeY = this.sh * 0.4;
      
      orb.sprite.x = orb.baseX + Math.sin(orb.phaseX) * rangeX;
      orb.sprite.y = orb.baseY + Math.cos(orb.phaseY) * rangeY;

      // Breathing scale — use baseScale to prevent drift
      const breath = 1.0 + Math.sin(orb.scalePhase) * 0.15;
      orb.sprite.scale.set(orb.baseScale * breath);
    }

    // Swirl logic for centrifuge/black hole
    if (this.isSwirling) {
      this.swirlAngle += 2 * dt;
    }

    // 2. Update Shapes
    for (const s of this.shapes) {
      s.x += s.vx * this.anomalyMultiplier * dt;
      s.y += s.vy * this.anomalyMultiplier * dt;
      s.gfx.rotation += s.rotationSpeed * this.anomalyMultiplier * dt;

      s.scalePhase += s.scaleSpeed * dt;
      s.alphaPhase += s.alphaSpeed * dt;

      this.wrapBounds(s, 100);
      
      s.gfx.position.set(s.x, s.y);
      const sScale = 1.0 + Math.sin(s.scalePhase) * 0.2;
      s.gfx.scale.set(sScale);
    }

    // 3. Update Dust
    for (const d of this.dustDrops) {
      d.x += d.vx * this.anomalyMultiplier * dt;
      d.y += d.vy * this.anomalyMultiplier * dt;
      
      if (this.isSwirling) {
        // Add a bit of circular motion around center
        const dx = d.x - this.sw/2;
        const dy = d.y - this.sh/2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
          const nx = -dy / dist;
          const ny = dx / dist;
          d.x += nx * 100 * dt;
          d.y += ny * 100 * dt;
        }
      }

      d.alphaPhase += d.alphaSpeed * dt;

      this.wrapBounds(d, 20);

      d.gfx.position.set(d.x, d.y);
      d.gfx.alpha = (Math.sin(d.alphaPhase) * 0.5 + 0.5) * 0.4; // 0 to 0.4
    }

    // 4. Update Flash
    if (this.flashAlpha > 0) {
      this.flashAlpha -= 2.0 * dt; // Fade out in 0.5s
      if (this.flashAlpha < 0) this.flashAlpha = 0;
      this.flashGfx.alpha = this.flashAlpha;
    }
  }

  private wrapBounds(obj: ShapeDrop, pad: number) {
    if (obj.y < -pad) {
      obj.y = this.sh + pad;
      obj.x = Math.random() * this.sw;
    } else if (obj.y > this.sh + pad) {
      obj.y = -pad;
      obj.x = Math.random() * this.sw;
    }
    
    if (obj.x < -pad) obj.x = this.sw + pad;
    if (obj.x > this.sw + pad) obj.x = -pad;
  }

  // ─── API for Game Events ──────────────────────────

  public setMode(mode: 'menu' | 'gameplay' | 'static') {
    this.displayMode = mode;
    
    if (mode === 'menu') {
      this.glowContainer.visible = true;
      this.glowContainer.alpha = 1;
      this.shapesContainer.visible = true;
      this.shapesContainer.alpha = 1;
      this.dustContainer.visible = true;
      this.dustContainer.alpha = 1;
      this.gridContainer.visible = false;
    } else if (mode === 'gameplay') {
      // Keep ambient alive but dimmed — world breathes during gameplay
      this.glowContainer.visible = true;
      this.glowContainer.alpha = 0.4;
      this.shapesContainer.visible = true;
      this.shapesContainer.alpha = 0.3;
      this.dustContainer.visible = true;
      this.dustContainer.alpha = 0.7;
      this.gridContainer.visible = false;
    } else {
      this.glowContainer.visible = false;
      this.shapesContainer.visible = false;
      this.dustContainer.visible = false;
      this.gridContainer.visible = true;
      this.gridContainer.alpha = 1;
    }
  }

  public triggerMergeFlash(intensity: number = 0.3) {
    this.flashAlpha = Math.min(1.0, this.flashAlpha + intensity);
  }

  public setAnomalyState(type: string | null) {
    if (!type) {
      this.targetAnomalyMultiplier = 1.0;
      this.isSwirling = false;
      return;
    }

    switch (type) {
      case 'blackHole':
        this.targetAnomalyMultiplier = 3.0;
        this.isSwirling = true;
        break;
      case 'centrifuge':
        this.targetAnomalyMultiplier = 4.0;
        this.isSwirling = true;
        break;
      case 'zeroG':
      case 'moon':
        this.targetAnomalyMultiplier = 0.2; // Slow down
        this.isSwirling = false;
        break;
      case 'tornado':
        this.targetAnomalyMultiplier = 5.0;
        this.isSwirling = true;
        break;
      default:
        this.targetAnomalyMultiplier = 1.0;
        this.isSwirling = false;
        break;
    }
  }

  public resize(sw: number, sh: number) {
    this.sw = sw;
    this.sh = sh;
    this.bgRect.clear();
    this.bgRect.rect(0, 0, sw, sh).fill(this.baseColor);
    
    this.flashGfx.clear();
    this.flashGfx.rect(0, 0, sw, sh).fill(0xffffff);

    this.initGrid(); // redraw grid to fill new screen size
  }
}
