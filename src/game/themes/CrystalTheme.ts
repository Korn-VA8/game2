import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class CrystalTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const impactSparkle = phys.squashY < 0.8 ? 0.8 : 0;
    const shimmer = Math.sin(time*2+level)*0.3 + 0.5 + impactSparkle;

    if (level <= 3) {
      // Raw crystal — simple geometric facets
      const facets = 3 + level;
      for(let i=0; i<facets; i++) {
        const a1 = (Math.PI*2/facets)*i;
        const a2 = (Math.PI*2/facets)*(i+1);
        const midA = (a1+a2)/2;
        const depth = r*(0.3+level*0.03);
        g.moveTo(Math.cos(a1)*r*0.9, Math.sin(a1)*r*0.9)
         .lineTo(Math.cos(midA)*depth, Math.sin(midA)*depth)
         .lineTo(Math.cos(a2)*r*0.9, Math.sin(a2)*r*0.9)
         .closePath().fill({color: 0xFFFFFF, alpha: Math.min(1, 0.08+shimmer*0.1)});
      }
      // Distinctive color per low level
      const lowColors = [0xFF8888, 0x88FF88, 0x8888FF];
      g.circle(0, 0, r*0.3).fill({color: lowColors[level-1], alpha: 0.15+Math.sin(time*3)*0.05});

    } else if (level <= 6) {
      // Polished gem — more facets, inner glow, distinct coloring
      const facets = 3 + level;
      const gemColors = [0xFF44FF, 0x44FFFF, 0xFFFF44]; // Amethyst, Aquamarine, Topaz
      const gemColor = gemColors[level-4];
      for(let i=0; i<facets; i++) {
        const a1 = (Math.PI*2/facets)*i;
        const a2 = (Math.PI*2/facets)*(i+1);
        const midA = (a1+a2)/2;
        const depth = r*(0.3+level*0.03);
        // Alternate facet brightness
        const facetAlpha = i % 2 === 0 ? 0.12+shimmer*0.1 : 0.06+shimmer*0.05;
        g.moveTo(Math.cos(a1)*r*0.9, Math.sin(a1)*r*0.9)
         .lineTo(Math.cos(midA)*depth, Math.sin(midA)*depth)
         .lineTo(Math.cos(a2)*r*0.9, Math.sin(a2)*r*0.9)
         .closePath().fill({color: 0xFFFFFF, alpha: Math.min(1, facetAlpha)});
      }
      // Inner glow with gem-specific color
      g.circle(0, 0, r*(0.2+level*0.02)).fill({color: gemColor, alpha: 0.15+Math.sin(time*3)*0.05});
      // Floating sparkles
      if (level >= 6) {
        for(let i=0; i<level-4; i++) {
          const sx = Math.cos(time+i*2.5)*r*0.7;
          const sy = Math.sin(time*1.3+i*1.8)*r*0.6;
          this.drawStar(g,sx,sy,4,r*0.05,r*0.02,0xFFFFFF);
        }
      }

    } else if (level <= 8) {
      // Brilliant cut — many facets, sparkle trails, unique shapes
      const facets = 3 + level;
      for(let i=0; i<facets; i++) {
        const a1 = (Math.PI*2/facets)*i;
        const a2 = (Math.PI*2/facets)*(i+1);
        const midA = (a1+a2)/2;
        const depth = r*(0.3+level*0.03);
        g.moveTo(Math.cos(a1)*r*0.9, Math.sin(a1)*r*0.9)
         .lineTo(Math.cos(midA)*depth, Math.sin(midA)*depth)
         .lineTo(Math.cos(a2)*r*0.9, Math.sin(a2)*r*0.9)
         .closePath().fill({color: 0xFFFFFF, alpha: Math.min(1, 0.08+shimmer*0.12)});
      }
      // Prism rainbow effect
      const prismAngle = time * 0.5;
      for(let i=0; i<3; i++) {
        const rainbowColors = [0xFF4444, 0x44FF44, 0x4444FF];
        const pa = prismAngle + i * Math.PI*2/3;
        g.moveTo(0, 0).lineTo(Math.cos(pa)*r*0.8, Math.sin(pa)*r*0.8)
         .stroke({color: rainbowColors[i], width: r*0.03, alpha: 0.2+shimmer*0.1});
      }
      g.circle(0, 0, r*(0.2+level*0.02)).fill({color: 0xFFFFFF, alpha: 0.1+Math.sin(time*3)*0.05});
      // Sparkles
      for(let i=0; i<level-4; i++) {
        const sx = Math.cos(time+i*2.5)*r*0.7;
        const sy = Math.sin(time*1.3+i*1.8)*r*0.6;
        this.drawStar(g,sx,sy,4,r*0.05,r*0.02,0xFFFFFF);
      }

    } else {
      // L9-11: Royal gems — crown facet, aurora trails
      const facets = 3 + Math.min(level, 11);
      for(let i=0; i<facets; i++) {
        const a1 = (Math.PI*2/facets)*i;
        const a2 = (Math.PI*2/facets)*(i+1);
        const midA = (a1+a2)/2;
        const depth = r*(0.3+level*0.03);
        g.moveTo(Math.cos(a1)*r*0.9, Math.sin(a1)*r*0.9)
         .lineTo(Math.cos(midA)*depth, Math.sin(midA)*depth)
         .lineTo(Math.cos(a2)*r*0.9, Math.sin(a2)*r*0.9)
         .closePath().fill({color: 0xFFFFFF, alpha: Math.min(1, 0.08+shimmer*0.12)});
      }
      // Crown facet (L9+)
      g.moveTo(0,-r).lineTo(-r*0.2,-r*0.5).lineTo(r*0.2,-r*0.5).closePath().fill({color:0xFFFFFF,alpha:shimmer*0.4});
      g.moveTo(-r*0.3,-r*0.4).lineTo(0,-r*0.8).lineTo(r*0.3,-r*0.4).stroke({color:0xFFFFFF,alpha:0.5,width:2});
      // Intensifying glow per level
      const glowR = r * (0.25 + (level-9)*0.08);
      g.circle(0, 0, glowR).fill({color: 0xFFFFFF, alpha: 0.12+Math.sin(time*3)*0.05});
      // Rich sparkle field
      for(let i=0; i<level-3; i++) {
        const sx = Math.cos(time+i*2.5)*r*0.7;
        const sy = Math.sin(time*1.3+i*1.8)*r*0.6;
        this.drawStar(g,sx,sy,4,r*0.06,r*0.025,0xFFFFFF);
      }
      // L10+ outer ring
      if (level >= 10) {
        g.circle(0, 0, r*1.05).stroke({color: a, alpha: 0.2+Math.sin(time*2)*0.1, width: r*0.03});
      }
      // L11 double crown + aura
      if (level >= 11) {
        g.moveTo(-r*0.15,-r*0.7).lineTo(0,-r*1.0).lineTo(r*0.15,-r*0.7).closePath()
         .fill({color:0xFFFFFF, alpha:shimmer*0.5});
        g.circle(0, 0, r*1.15).stroke({color: 0xFFFFFF, alpha: 0.1+Math.sin(time*1.5)*0.08, width: r*0.02});
      }
    }

    SpriteGenerator.drawKawaiiFace(faceCtx, r, r*0.1, exp);
  }

  private static drawStar(g: Graphics, cx: number, cy: number, points: number, outer: number, inner: number, color: number) {
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
