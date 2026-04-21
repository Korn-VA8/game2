import Matter from 'matter-js';
import { Container, Graphics } from 'pixi.js';

const SEGMENT_COUNT = 48;
const GAP_FRACTION = 0.25; // 25% open top
const BASE_RADIUS = 200;
const WALL_THICKNESS = 80;
const WALL_OPTIONS: Matter.IBodyDefinition = {
  isStatic: true,
  restitution: 0.45,   // walls bounce jelly-like
  friction: 0.05,      // slippery glass surface
  label: 'barrel_wall',
  collisionFilter: {
    group: -1,         // wall segments don't collide with each other
  },
  chamfer: { radius: 10 }, // Smooth edges to prevent snagging on rectangles
};

export class Barrel {
  public container: Container;
  public centerX: number;
  public centerY: number;
  public radius: number;

  private baseRadius: number;
  private radiusMultiplier = 1.0;
  private segments: Matter.Body[] = [];
  private graphics: Graphics;
  private engine: Matter.Engine;
  private lid: Matter.Body | null = null;
  public isLidClosed = false;
  private time = 0;

  constructor(engine: Matter.Engine, centerX: number, centerY: number, radius: number = BASE_RADIUS) {
    this.engine = engine;
    this.centerX = centerX;
    this.centerY = centerY;
    this.baseRadius = radius;
    this.radius = radius;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);

    this.buildSegments();
    this.drawGraphics();
  }

  /** Build the barrel wall segments as rectangles placed around the circumference */
  private buildSegments(): void {
    // Remove old segments
    for (const seg of this.segments) {
      Matter.Composite.remove(this.engine.world, seg);
    }
    this.segments = [];

    const totalAngle = 2 * Math.PI;
    const gapAngle = totalAngle * GAP_FRACTION;
    // The gap is centred at the top (-π/2)
    const gapStart = -Math.PI / 2 - gapAngle / 2;
    const gapEnd = -Math.PI / 2 + gapAngle / 2;

    // Build the Lid across the gap
    const lx = this.centerX + this.radius * Math.cos(gapStart);
    const ly = this.centerY + this.radius * Math.sin(gapStart);
    const rx = this.centerX + this.radius * Math.cos(gapEnd);
    const ry = this.centerY + this.radius * Math.sin(gapEnd);
    const midX = (lx + rx) / 2;
    const midY = (ly + ry) / 2;
    const gapDist = Math.sqrt((rx - lx)**2 + (ry - ly)**2);
    
    this.lid = Matter.Bodies.rectangle(midX, midY, gapDist + 20, WALL_THICKNESS, {
      ...(WALL_OPTIONS as Matter.IChamferableBodyDefinition),
      isSensor: !this.isLidClosed,
      label: 'barrel_lid',
      angle: 0
    });
    this.segments.push(this.lid);
    Matter.Composite.add(this.engine.world, this.lid);

    // Arc length covered by wall segments
    const wallAngle = totalAngle - gapAngle;
    const segmentAngle = wallAngle / SEGMENT_COUNT;
    // Segment length (chord approximation at the pushed out radius)
    const physicsRadius = this.radius + WALL_THICKNESS / 2;
    const segmentLength = 2 * physicsRadius * Math.sin(segmentAngle / 2) + 10; // +10 overlap

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const a = gapEnd + segmentAngle * i + segmentAngle / 2;
      const x = this.centerX + physicsRadius * Math.cos(a);
      const y = this.centerY + physicsRadius * Math.sin(a);

      const seg = Matter.Bodies.rectangle(x, y, segmentLength, WALL_THICKNESS, {
        ...(WALL_OPTIONS as Matter.IChamferableBodyDefinition),
        angle: a + Math.PI / 2,
      });
      this.segments.push(seg);
      Matter.Composite.add(this.engine.world, seg);
    }

    // Bottom arc segments (additional floor support is already handled by the circular segments)
    // The circular arrangement creates a natural floor at the bottom.

    // Store the gap boundaries for external use (drop zone)
    (this as any)._gapStart = gapStart;
    (this as any)._gapEnd = gapEnd;
  }

  /** Draw barrel outline with PixiJS Graphics */
  private drawGraphics(): void {
    this.graphics.clear();

    const totalAngle = 2 * Math.PI;
    const gapAngle = totalAngle * GAP_FRACTION;
    const gapStart = -Math.PI / 2 - gapAngle / 2;
    const gapEnd = -Math.PI / 2 + gapAngle / 2;

    // Pulse alpha based on time
    const pulseAlpha = 0.7 + Math.sin(this.time * 1.5) * 0.15;

    // Outer glow ring (soft wide stroke)
    this.graphics
      .arc(this.centerX, this.centerY, this.radius + 2, gapEnd, gapStart + 2 * Math.PI)
      .stroke({ color: 0x6bb5ff, alpha: 0.1 * pulseAlpha, width: 12 });

    // Main barrel wall (thicker)
    this.graphics
      .arc(this.centerX, this.centerY, this.radius, gapEnd, gapStart + 2 * Math.PI)
      .stroke({ color: 0x4a90d9, alpha: pulseAlpha, width: 4 });

    // Inner glow arc
    this.graphics
      .arc(this.centerX, this.centerY, this.radius - 3, gapEnd, gapStart + 2 * Math.PI)
      .stroke({ color: 0x6bb5ff, alpha: 0.15 * pulseAlpha, width: 8 });

    // Accent dots along the arc
    const arcAngle = totalAngle - gapAngle;
    const dotCount = 24;
    for (let i = 0; i < dotCount; i++) {
      const t = i / dotCount;
      const a = gapEnd + arcAngle * t;
      const dx = this.centerX + (this.radius + 1) * Math.cos(a);
      const dy = this.centerY + (this.radius + 1) * Math.sin(a);
      this.graphics.circle(dx, dy, 1.5).fill({ color: 0x6bb5ff, alpha: 0.15 * pulseAlpha });
    }

    // Draw the emergency lid if closed
    if (this.isLidClosed && this.lid) {
      const lx = this.centerX + this.radius * Math.cos(gapStart);
      const ly = this.centerY + this.radius * Math.sin(gapStart);
      const rx = this.centerX + this.radius * Math.cos(gapEnd);
      const ry = this.centerY + this.radius * Math.sin(gapEnd);
      
      // Neon barrier
      this.graphics.moveTo(lx, ly).lineTo(rx, ry).stroke({ color: 0xe94560, alpha: 0.9, width: 8 });
      this.graphics.moveTo(lx, ly).lineTo(rx, ry).stroke({ color: 0xffffff, alpha: 0.8, width: 3 });
      
      // Hex pattern across lid
      const hexCount = 6;
      for (let i = 1; i <= hexCount; i++) {
        const px = lx + (rx - lx) * (i / (hexCount + 1));
        const py = ly + (ry - ly) * (i / (hexCount + 1));
        this.graphics.circle(px, py, 6).fill({ color: 0xe94560, alpha: 0.8 });
      }
    }

    // Draw the danger line (top boundary)
    const lineY = this.getTopLine();
    const lineLeft = this.centerX - this.radius * 0.7;
    const lineRight = this.centerX + this.radius * 0.7;

    // Pulsing danger line
    const dangerPulse = 0.3 + Math.sin(this.time * 3) * 0.15;
    this.graphics
      .moveTo(lineLeft, lineY)
      .lineTo(lineRight, lineY)
      .stroke({ color: 0xe94560, alpha: dangerPulse, width: 1.5 });

    // Dashed pattern for danger line
    const dashLength = 8;
    const gapLength2 = 6;
    let currentX = lineLeft;
    while (currentX < lineRight) {
      const endX = Math.min(currentX + dashLength, lineRight);
      this.graphics
        .moveTo(currentX, lineY)
        .lineTo(endX, lineY)
        .stroke({ color: 0xe94560, alpha: dangerPulse + 0.15, width: 1 });
      currentX = endX + gapLength2;
    }
  }

  /** Update barrel animations (call every frame) */
  updateBarrel(dt: number): void {
    this.time += dt;
    // Redraw with pulse at ~5fps for performance
    if (Math.floor(this.time * 5) !== Math.floor((this.time - dt) * 5)) {
      this.drawGraphics();
    }
  }

  /** Close or open the emergency lid for anomalies */
  setLidClosed(closed: boolean): void {
    this.isLidClosed = closed;
    if (this.lid) {
      this.lid.isSensor = !closed;
    }
    this.drawGraphics();
  }

  /** Set the radius multiplier (for barrel size upgrades) */
  setRadiusMultiplier(mult: number): void {
    this.radiusMultiplier = mult;
    this.radius = this.baseRadius * this.radiusMultiplier;
    this.buildSegments();
    this.drawGraphics();
  }

  /** Get the Y-coordinate of the top danger line */
  getTopLine(): number {
    // The top line is where the gap opening is (top of barrel minus some margin)
    const gapAngle = 2 * Math.PI * GAP_FRACTION;
    const halfGap = gapAngle / 2;
    // Y of the gap edge points
    return this.centerY + this.radius * Math.sin(-Math.PI / 2 + halfGap);
  }

  /** Get the angular position of the gap center (for drop positioning) */
  getGapCenterAngle(): number {
    return -Math.PI / 2;
  }

  /** Get the left and right X boundaries for the drop zone */
  getDropZone(): { left: number; right: number; y: number } {
    const totalAngle = 2 * Math.PI;
    const gapAngle = totalAngle * GAP_FRACTION;
    const halfGap = gapAngle / 2;

    const leftAngle = -Math.PI / 2 - halfGap;
    const rightAngle = -Math.PI / 2 + halfGap;

    const leftX = this.centerX + this.radius * Math.cos(leftAngle);
    const rightX = this.centerX + this.radius * Math.cos(rightAngle);
    const y = this.centerY + this.radius * Math.sin(-Math.PI / 2 + halfGap);

    return {
      left: Math.min(leftX, rightX),
      right: Math.max(leftX, rightX),
      y,
    };
  }

  /** Destroy the barrel, removing all physics bodies */
  destroy(): void {
    for (const seg of this.segments) {
      Matter.Composite.remove(this.engine.world, seg);
    }
    this.segments = [];
    this.container.destroy({ children: true });
  }
}
