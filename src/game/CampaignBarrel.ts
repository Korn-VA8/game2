import Matter from 'matter-js';
import { Container, Graphics } from 'pixi.js';
import type { BarrelShape, ObstacleDef } from './LevelConfig';

const WALL_THICKNESS = 40;
const WALL_OPTIONS: Matter.IBodyDefinition = {
  isStatic: true,
  restitution: 0.45,
  friction: 0.05,
  label: 'barrel_wall',
  collisionFilter: { group: -1 },
  chamfer: { radius: 10 },
};

// ─── Shape Configuration ────────────────────────────

export interface BarrelConfig {
  shape: BarrelShape;
  /** Width ratio relative to default barrel (1.0 = standard) */
  widthRatio: number;
  /** Height ratio relative to default barrel (1.0 = standard) */
  heightRatio: number;
  /** Static obstacles inside the barrel */
  obstacles: ObstacleDef[];
}

const DEFAULT_CONFIG: BarrelConfig = {
  shape: 'U',
  widthRatio: 1.0,
  heightRatio: 1.0,
  obstacles: [],
};

// ─── CampaignBarrel Class ───────────────────────────

/**
 * CampaignBarrel — Supports multiple barrel shapes for campaign mode.
 * All shapes are built from static Matter.js bodies (line segments)
 * and rendered with PixiJS Graphics.
 *
 * iPhone 16 Pro safe area: the barrel always stays within
 * (screenWidth - 20px) horizontally and vertically centered.
 */
export class CampaignBarrel {
  public container: Container;
  public centerX: number;
  public centerY: number;

  /** Effective half-width and half-height of the barrel interior */
  public halfW: number;
  public halfH: number;

  private config: BarrelConfig;
  private segments: Matter.Body[] = [];
  private obstacleBodies: Matter.Body[] = [];
  private graphics: Graphics;
  private engine: Matter.Engine;
  private lid: Matter.Body | null = null;
  public isLidClosed = false;
  private time = 0;

  /** The wall vertices (for drawing and physics) */
  private leftWall: { x: number; y: number }[] = [];
  private rightWall: { x: number; y: number }[] = [];
  private floor: { x: number; y: number }[] = [];

  constructor(
    engine: Matter.Engine,
    screenWidth: number,
    screenHeight: number,
    config: BarrelConfig = DEFAULT_CONFIG,
  ) {
    this.engine = engine;
    this.config = config;

    // Safe area: 10px padding on each side
    const maxBarrelWidth = screenWidth - 20;
    const maxBarrelHeight = screenHeight * 0.55; // leave room for HUD and drop zone

    // Standard barrel dimensions
    const stdHalfW = Math.min(maxBarrelWidth / 2, 200);
    const stdHalfH = Math.min(maxBarrelHeight / 2, 200);

    this.halfW = stdHalfW * config.widthRatio;
    this.halfH = stdHalfH * config.heightRatio;

    // Center position
    this.centerX = screenWidth / 2;
    this.centerY = screenHeight / 2 + 40;

    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    // Build shape geometry
    this.buildShapeVertices();
    this.buildPhysics();
    this.buildObstacles();
    this.drawGraphics();
  }

  // ─── Shape Vertex Generation ──────────────────────

  private buildShapeVertices(): void {
    const cx = this.centerX;
    const cy = this.centerY;
    const hw = this.halfW;
    const hh = this.halfH;

    // Gap at the top (opening for dropping)
    const gapHalfW = hw * 0.75; // opening is 75% of barrel width

    switch (this.config.shape) {
      case 'U': {
        // Straight walls, flat bottom
        this.leftWall = [
          { x: cx - hw, y: cy - hh },
          { x: cx - hw, y: cy + hh },
        ];
        this.rightWall = [
          { x: cx + hw, y: cy - hh },
          { x: cx + hw, y: cy + hh },
        ];
        this.floor = [
          { x: cx - hw, y: cy + hh },
          { x: cx + hw, y: cy + hh },
        ];
        break;
      }

      case 'V': {
        // Funnel — walls angle inward toward bottom
        const bottomHalfW = hw * 0.3;
        this.leftWall = [
          { x: cx - hw, y: cy - hh },
          { x: cx - bottomHalfW, y: cy + hh },
        ];
        this.rightWall = [
          { x: cx + hw, y: cy - hh },
          { x: cx + bottomHalfW, y: cy + hh },
        ];
        this.floor = [
          { x: cx - bottomHalfW, y: cy + hh },
          { x: cx + bottomHalfW, y: cy + hh },
        ];
        break;
      }

      case 'W': {
        // Split barrel — triangular wedge on the floor
        const wedgeHalfW = hw * 0.15;
        const wedgeHeight = hh * 0.5;
        this.leftWall = [
          { x: cx - hw, y: cy - hh },
          { x: cx - hw, y: cy + hh },
        ];
        this.rightWall = [
          { x: cx + hw, y: cy - hh },
          { x: cx + hw, y: cy + hh },
        ];
        // Floor is split: left floor, wedge up, wedge down, right floor
        this.floor = [
          { x: cx - hw, y: cy + hh },
          { x: cx - wedgeHalfW, y: cy + hh },
          { x: cx, y: cy + hh - wedgeHeight },
          { x: cx + wedgeHalfW, y: cy + hh },
          { x: cx + hw, y: cy + hh },
        ];
        break;
      }

      case 'cup': {
        // Wide top, narrow bottom with curved transition
        const bottomHalfW = hw * 0.5;
        const midY = cy + hh * 0.3;
        this.leftWall = [
          { x: cx - hw, y: cy - hh },
          { x: cx - hw, y: midY },
          { x: cx - bottomHalfW, y: cy + hh },
        ];
        this.rightWall = [
          { x: cx + hw, y: cy - hh },
          { x: cx + hw, y: midY },
          { x: cx + bottomHalfW, y: cy + hh },
        ];
        this.floor = [
          { x: cx - bottomHalfW, y: cy + hh },
          { x: cx + bottomHalfW, y: cy + hh },
        ];
        break;
      }

      case 'asym': {
        // Left wall straight, right wall angled inward
        const rightBottomX = cx + hw * 0.4;
        this.leftWall = [
          { x: cx - hw, y: cy - hh },
          { x: cx - hw, y: cy + hh },
        ];
        this.rightWall = [
          { x: cx + hw, y: cy - hh },
          { x: rightBottomX, y: cy + hh },
        ];
        this.floor = [
          { x: cx - hw, y: cy + hh },
          { x: rightBottomX, y: cy + hh },
        ];
        break;
      }
    }
  }

  // ─── Physics Body Creation ────────────────────────

  private buildPhysics(): void {
    // Remove old segments
    for (const seg of this.segments) {
      Matter.Composite.remove(this.engine.world, seg);
    }
    this.segments = [];

    /**
     * Create a wall body between two points, offset OUTWARD so the inner
     * face of the rectangle exactly matches the visual line.
     *
     * outwardSide: 'left' or 'right' relative to the direction p1→p2.
     *   - Left wall segments: 'left'  (outward = away from barrel center)
     *   - Right wall segments: 'right' (outward = away from barrel center)
     *   - Floor segments: 'left'  (outward = downward)
     */
    const createWallSegment = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      outwardSide: 'left' | 'right',
    ) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Compute outward normal perpendicular to segment
      // 'left' of direction p1→p2: normal = (-dy, dx) / len
      // 'right' of direction p1→p2: normal = (dy, -dx) / len
      let nx: number, ny: number;
      if (outwardSide === 'left') {
        nx = -dy / length;
        ny = dx / length;
      } else {
        nx = dy / length;
        ny = -dx / length;
      }

      // Offset the center so the INNER face sits exactly on the visual line
      const offset = WALL_THICKNESS / 2;
      const midX = (p1.x + p2.x) / 2 + nx * offset;
      const midY = (p1.y + p2.y) / 2 + ny * offset;

      const body = Matter.Bodies.rectangle(midX, midY, length + 10, WALL_THICKNESS, {
        ...(WALL_OPTIONS as Matter.IChamferableBodyDefinition),
        angle,
      });
      this.segments.push(body);
      Matter.Composite.add(this.engine.world, body);
    };

    // Build left wall segments (outward = left of direction top→bottom)
    for (let i = 0; i < this.leftWall.length - 1; i++) {
      createWallSegment(this.leftWall[i], this.leftWall[i + 1], 'left');
    }

    // Build right wall segments (outward = right of direction top→bottom)
    for (let i = 0; i < this.rightWall.length - 1; i++) {
      createWallSegment(this.rightWall[i], this.rightWall[i + 1], 'right');
    }

    // Build floor segments (outward = left of direction left→right = downward)
    for (let i = 0; i < this.floor.length - 1; i++) {
      createWallSegment(this.floor[i], this.floor[i + 1], 'left');
    }

    // Build lid across the top opening
    const leftTopX = this.leftWall[0].x;
    const leftTopY = this.leftWall[0].y;
    const rightTopX = this.rightWall[0].x;
    const rightTopY = this.rightWall[0].y;
    const lidMidX = (leftTopX + rightTopX) / 2;
    const lidMidY = (leftTopY + rightTopY) / 2 - WALL_THICKNESS / 2;
    const lidWidth = Math.sqrt((rightTopX - leftTopX) ** 2 + (rightTopY - leftTopY) ** 2);

    this.lid = Matter.Bodies.rectangle(lidMidX, lidMidY, lidWidth + 20, WALL_THICKNESS, {
      ...(WALL_OPTIONS as Matter.IChamferableBodyDefinition),
      isSensor: !this.isLidClosed,
      label: 'barrel_lid',
      angle: 0,
    });
    this.segments.push(this.lid);
    Matter.Composite.add(this.engine.world, this.lid);
  }

  // ─── Obstacles ────────────────────────────────────

  private buildObstacles(): void {
    for (const obs of this.obstacleBodies) {
      Matter.Composite.remove(this.engine.world, obs);
    }
    this.obstacleBodies = [];

    const barrelW = this.halfW * 2;
    const barrelH = this.halfH * 2;

    for (const def of this.config.obstacles) {
      const ox = this.centerX + def.x * barrelW;
      const oy = this.centerY + def.y * barrelH;
      const or = def.radiusFraction * barrelW;

      const body = Matter.Bodies.circle(ox, oy, or, {
        isStatic: true,
        restitution: 0.5,
        friction: 0.05,
        label: 'obstacle',
      });
      this.obstacleBodies.push(body);
      Matter.Composite.add(this.engine.world, body);
    }
  }

  // ─── Drawing ──────────────────────────────────────

  drawGraphics(): void {
    this.graphics.clear();

    const pulseAlpha = 0.7 + Math.sin(this.time * 1.5) * 0.15;

    // Draw walls with glow effect
    const drawPath = (points: { x: number; y: number }[], color: number, alpha: number, width: number) => {
      if (points.length < 2) return;
      this.graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.graphics.lineTo(points[i].x, points[i].y);
      }
      this.graphics.stroke({ color, alpha, width });
    };

    // Outer glow
    drawPath(this.leftWall, 0x6bb5ff, 0.1 * pulseAlpha, 12);
    drawPath(this.rightWall, 0x6bb5ff, 0.1 * pulseAlpha, 12);
    drawPath(this.floor, 0x6bb5ff, 0.1 * pulseAlpha, 12);

    // Main walls
    drawPath(this.leftWall, 0x4a90d9, pulseAlpha, 4);
    drawPath(this.rightWall, 0x4a90d9, pulseAlpha, 4);
    drawPath(this.floor, 0x4a90d9, pulseAlpha, 4);

    // Inner glow
    drawPath(this.leftWall, 0x6bb5ff, 0.15 * pulseAlpha, 8);
    drawPath(this.rightWall, 0x6bb5ff, 0.15 * pulseAlpha, 8);
    drawPath(this.floor, 0x6bb5ff, 0.15 * pulseAlpha, 8);

    // Draw obstacles as glowing circles
    const barrelW = this.halfW * 2;
    const barrelH = this.halfH * 2;
    for (const def of this.config.obstacles) {
      const ox = this.centerX + def.x * barrelW;
      const oy = this.centerY + def.y * barrelH;
      const or = def.radiusFraction * barrelW;

      // Outer glow
      this.graphics.circle(ox, oy, or + 3).fill({ color: 0x6bb5ff, alpha: 0.08 * pulseAlpha });
      // Main circle
      this.graphics.circle(ox, oy, or).stroke({ color: 0x4a90d9, alpha: pulseAlpha * 0.8, width: 3 });
      // Inner fill
      this.graphics.circle(ox, oy, or).fill({ color: 0x1a1a2e, alpha: 0.6 });
      // Cross pattern
      this.graphics.moveTo(ox - or * 0.4, oy - or * 0.4).lineTo(ox + or * 0.4, oy + or * 0.4).stroke({ color: 0x4a90d9, alpha: 0.3, width: 2 });
      this.graphics.moveTo(ox + or * 0.4, oy - or * 0.4).lineTo(ox - or * 0.4, oy + or * 0.4).stroke({ color: 0x4a90d9, alpha: 0.3, width: 2 });
    }

    // Draw emergency lid if closed
    if (this.isLidClosed && this.lid) {
      const lx = this.leftWall[0].x;
      const ly = this.leftWall[0].y;
      const rx = this.rightWall[0].x;
      const ry = this.rightWall[0].y;
      this.graphics.moveTo(lx, ly).lineTo(rx, ry).stroke({ color: 0xe94560, alpha: 0.9, width: 8 });
      this.graphics.moveTo(lx, ly).lineTo(rx, ry).stroke({ color: 0xffffff, alpha: 0.8, width: 3 });
    }

    // Danger line
    const lineY = this.getTopLine();
    const lineLeft = this.centerX - this.halfW * 0.7;
    const lineRight = this.centerX + this.halfW * 0.7;
    const dangerPulse = 0.3 + Math.sin(this.time * 3) * 0.15;
    this.graphics.moveTo(lineLeft, lineY).lineTo(lineRight, lineY).stroke({ color: 0xe94560, alpha: dangerPulse, width: 1.5 });

    // Dashed pattern for danger line
    const dashLength = 8;
    const gapLength = 6;
    let currentX = lineLeft;
    while (currentX < lineRight) {
      const endX = Math.min(currentX + dashLength, lineRight);
      this.graphics.moveTo(currentX, lineY).lineTo(endX, lineY).stroke({ color: 0xe94560, alpha: dangerPulse + 0.15, width: 1 });
      currentX = endX + gapLength;
    }
  }

  // ─── Public API ───────────────────────────────────

  updateBarrel(dt: number): void {
    this.time += dt;
    if (Math.floor(this.time * 5) !== Math.floor((this.time - dt) * 5)) {
      this.drawGraphics();
    }
  }

  setLidClosed(closed: boolean): void {
    this.isLidClosed = closed;
    if (this.lid) {
      this.lid.isSensor = !closed;
    }
    this.drawGraphics();
  }

  getTopLine(): number {
    // Top of the barrel walls + small margin
    return this.leftWall[0].y + this.halfH * 0.15;
  }

  getDropZone(): { left: number; right: number; y: number } {
    const topLeft = this.leftWall[0];
    const topRight = this.rightWall[0];
    return {
      left: topLeft.x + 10,
      right: topRight.x - 10,
      y: topLeft.y - 20,
    };
  }

  /** Get the barrel's radius equivalent (for compatibility with existing code) */
  get radius(): number {
    return Math.max(this.halfW, this.halfH);
  }

  destroy(): void {
    for (const seg of this.segments) {
      Matter.Composite.remove(this.engine.world, seg);
    }
    for (const obs of this.obstacleBodies) {
      Matter.Composite.remove(this.engine.world, obs);
    }
    this.segments = [];
    this.obstacleBodies = [];
    this.container.destroy({ children: true });
  }
}
