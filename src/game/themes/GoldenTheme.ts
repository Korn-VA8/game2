import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class GoldenTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const gleam = 0.5+Math.sin(time*4)*0.5+(phys.squashY<0.9?1:0);
    const shimmer = Math.sin(time*6+level)*0.3+0.5;

    // Golden body shimmer — traveling highlight band
    const bandAngle = time*2;
    const bx = Math.cos(bandAngle)*r*0.4;
    const by = Math.sin(bandAngle)*r*0.4;
    g.ellipse(bx, by, r*0.5, r*0.3).fill({color:0xFFFFFF, alpha:shimmer*0.08});

    // Crown grows with level
    const crownPoints = Math.min(3+Math.floor(level/2), 7);
    const crownH = r*(0.25+level*0.02);
    g.moveTo(-r*0.5,-r*0.8);
    for(let i=0;i<crownPoints;i++){const t=i/(crownPoints-1);
      const x=-r*0.5+t*r;const isTop=i%2===0;
      g.lineTo(x, isTop? -r*0.8-crownH : -r*0.8-crownH*0.4);}
    g.lineTo(r*0.5,-r*0.8).closePath().fill({color:0xFFD700}).stroke({color:0xFFFFFF,width:1.5});

    // Crown jewels (more with level)
    const jewelCount = Math.min(Math.floor(level/2)+1, 4);
    const jewelColors = [0xFF3366, 0x33CCFF, 0x33FF33, 0xFFFF33];
    for(let i=0;i<jewelCount;i++){
      const jx = -r*0.3 + i*(r*0.6/(jewelCount-1 || 1));
      g.circle(jx, -r*0.8-crownH*0.5, r*0.05+i*0.005)
       .fill({color:jewelColors[i%4], alpha:Math.min(1, 0.5+gleam)});
    }

    // Level-specific wealth items
    if(level<=2) {
      // Simple gold coins floating
      for(let i=0;i<level+1;i++){
        const cx=Math.cos(time*1.5+i*2)*r*0.5;
        const cy=Math.sin(time*2+i*1.5)*r*0.4;
        g.circle(cx,cy,r*0.1).fill({color:0xFFD700,alpha:0.5+shimmer*0.2});
        g.circle(cx,cy,r*0.06).fill({color:0xFFE866,alpha:0.4});
      }
    } else if(level<=4) {
      // Floating coins + chain links
      for(let i=0;i<Math.min(level,4);i++){
        const sx=Math.cos(time*2+i*2)*r*0.6;
        let sy=-r*0.7+Math.sin(time*3+i*2)*r*0.4;
        if(phys.squashY<0.9)sy-=phys.squashVelY*5;
        g.circle(sx,sy,r*0.08).fill({color:0xFFD700,alpha:0.6});
        g.circle(sx,sy,r*0.05).fill({color:0xFFFFFF,alpha:0.3});
      }
      // Chain
      if(level>=4){
        g.moveTo(-r*0.3,r*0.2).quadraticCurveTo(0,r*0.4+Math.sin(time*3)*r*0.05,r*0.3,r*0.2)
         .stroke({color:0xFFD700,width:r*0.04,alpha:0.5});
      }
    } else if(level<=6) {
      // Diamond sparkles + gold dust
      for(let i=0;i<level;i++){
        const sx=Math.cos(time*2+i*2)*r*0.6;
        const sy=Math.sin(time*3+i*2)*r*0.5;
        this.drawStar(g,sx,sy,4,r*0.08+i*0.01,r*0.03,0xFFFFFF);
      }
      // Gold dust trail
      for(let i=0;i<8;i++){
        const dx=Math.cos(time*4+i)*r*(0.3+i*0.08);
        const dy=Math.sin(time*3+i*1.3)*r*(0.3+i*0.06);
        g.circle(dx,dy,r*0.025).fill({color:0xFFD700,alpha:0.3+shimmer*0.1});
      }
    } else {
      // Rich sparkle field with orbiting gems
      for(let i=0;i<Math.min(level-1,8);i++){
        const sx=Math.cos(time*2+i*2.5)*r*0.7;
        let sy=-r*0.7+Math.sin(time*3+i*2)*r*0.5;
        if(phys.squashY<0.9)sy-=phys.squashVelY*5;
        this.drawStar(g,sx,sy,4,r*0.08+i*0.01,r*0.03,0xFFFFFF);
      }
      // Gold dust aura
      for(let i=0;i<12;i++){
        const da=time*0.8+i*0.52;
        const dist=r*(0.6+Math.sin(time+i)*0.2);
        g.circle(Math.cos(da)*dist,Math.sin(da)*dist,r*0.02).fill({color:0xFFD700,alpha:0.4});
      }
    }

    // Golden ring for L7+
    if(level>=7){
      const ringPulse = 0.3+Math.sin(time*2)*0.1;
      g.circle(0,0,r*1.05).stroke({color:0xFFD700,alpha:ringPulse,width:r*0.04});
      // Inner ring
      if(level>=9) g.circle(0,0,r*0.9).stroke({color:0xFFE866,alpha:ringPulse*0.5,width:r*0.02});
    }

    // Scepter for L10+
    if(level>=10){
      // Animated scepter with jewel glow
      const scepterWobble = Math.sin(time*2)*r*0.02;
      g.moveTo(r*0.5+scepterWobble,r*0.1).lineTo(r*0.5+scepterWobble,r*0.8).stroke({color:0xFFD700,width:r*0.06,cap:'round'});
      g.circle(r*0.5+scepterWobble,r*0.05,r*0.1).fill({color:0xFFD700});
      // Glowing orb on scepter
      const orbPulse = 0.5+Math.sin(time*5)*0.3;
      g.circle(r*0.5+scepterWobble,r*0.05,r*0.06).fill({color:0xFF3366,alpha:orbPulse});
    }

    // L11 — royal cape flowing
    if(level>=11){
      const capeWave = Math.sin(time*3)*r*0.1;
      g.moveTo(-r*0.6,r*0.3).quadraticCurveTo(-r*0.8,r*0.6+capeWave,-r*0.5,r*0.9+capeWave)
       .stroke({color:0x8B0000,width:r*0.12,alpha:0.6,cap:'round'});
      g.moveTo(r*0.6,r*0.3).quadraticCurveTo(r*0.8,r*0.6-capeWave,r*0.5,r*0.9-capeWave)
       .stroke({color:0x8B0000,width:r*0.12,alpha:0.6,cap:'round'});
      // Double ring aura
      g.circle(0,0,r*1.15).stroke({color:0xFFD700,alpha:0.15+Math.sin(time*1.5)*0.08,width:r*0.02});
    }

    SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);
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
