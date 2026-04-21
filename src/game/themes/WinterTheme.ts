import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class WinterTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    // Falling snowflakes — shared ambient effect for all levels
    for(let i=0; i<6; i++) {
      const sx = -r*0.7+i*r*0.3+Math.sin(time*2+i)*r*0.1-phys.vx*0.1;
      const rawY = ((time*30+i*20)%(r*3))-r*1.5-phys.vy*0.1;
      const sy = rawY>r ? rawY-r*2.5 : rawY;
      g.circle(sx, sy, r*0.06).fill({color:0xFFFFFF, alpha:0.8});
    }

    if (level === 1) { // Ice cube
      // Ice cube facets
      g.moveTo(-r*0.6, -r*0.4).lineTo(r*0.6, -r*0.4).lineTo(r*0.4, r*0.4).lineTo(-r*0.4, r*0.4).closePath()
       .stroke({color:0xCCEEFF, width:r*0.03, alpha:0.5});
      g.moveTo(-r*0.2, -r*0.8).lineTo(r*0.2, -r*0.8).lineTo(r*0.15, -r*0.4).lineTo(-r*0.15, -r*0.4).closePath()
       .fill({color:0xFFFFFF, alpha:0.3});
    } else if (level === 2) { // Snowball with icicles
      g.circle(0, r*0.6, r*0.2).fill({color:0xFFFFFF,alpha:0.5});
      g.moveTo(-r*0.3,-r*0.8).lineTo(-r*0.25,-r*1.1).lineTo(-r*0.2,-r*0.8).fill({color:0xCCEEFF,alpha:0.6});
      g.moveTo(r*0.2,-r*0.8).lineTo(r*0.25,-r*1.05).lineTo(r*0.3,-r*0.8).fill({color:0xCCEEFF,alpha:0.6});
      g.moveTo(0,-r*0.85).lineTo(0.05*r,-r*1.15).lineTo(0.1*r,-r*0.85).fill({color:0xCCEEFF,alpha:0.5});
    } else if (level === 3) { // Penguin
      // White belly
      g.ellipse(0, r*0.1, r*0.5, r*0.6).fill({color:0xFFFFFF, alpha:0.6});
      // Flippers
      const flapAng = Math.sin(time*1.5)*0.2;
      g.moveTo(-r*0.7, -r*0.1).quadraticCurveTo(-r*0.9, r*0.3+flapAng*r, -r*0.6, r*0.4).fill({color:c, alpha:0.7});
      g.moveTo(r*0.7, -r*0.1).quadraticCurveTo(r*0.9, r*0.3+flapAng*r, r*0.6, r*0.4).fill({color:c, alpha:0.7});
      // Beak
      faceCtx.moveTo(-r*0.08, r*0.05).lineTo(0, r*0.18).lineTo(r*0.08, r*0.05).fill({color:0xFF6B00});
    } else if (level === 4) { // Snowman (buttons + carrot)
      g.circle(0,r*0.1,r*0.06).fill({color:0x333333});
      g.circle(0,r*0.3,r*0.06).fill({color:0x333333});
      faceCtx.moveTo(0,r*0.05).lineTo(r*0.2,r*0.1).lineTo(0,r*0.15).fill({color:0xFF6B00}); // carrot nose
    } else if (level === 5) { // Snow globe
      // Globe dome
      g.circle(0, -r*0.1, r*0.7).stroke({color:0xCCDDFF, width:r*0.03, alpha:0.4});
      // Tiny house inside
      g.rect(-r*0.15, r*0.1, r*0.3, r*0.2).fill({color:0x884422, alpha:0.5});
      g.moveTo(-r*0.2, r*0.1).lineTo(0, -r*0.05).lineTo(r*0.2, r*0.1).fill({color:0xCC4444, alpha:0.5});
      // Inner snowflakes
      for(let i=0; i<4; i++) {
        const fx = Math.sin(time+i*2)*r*0.4;
        const fy = Math.cos(time*0.7+i*1.5)*r*0.3 - r*0.1;
        g.circle(fx, fy, r*0.04).fill({color:0xFFFFFF, alpha:0.6});
      }
    } else if (level === 6) { // Scarf
      const windY = Math.sin(time*6)*r*0.1-phys.vy*0.15;
      const windX = -phys.vx*0.2;
      g.moveTo(-r*0.8,r*0.4).quadraticCurveTo(0,r*0.6,r*0.8,r*0.4).stroke({color:a,width:r*0.2,cap:'round'});
      g.moveTo(r*0.6,r*0.45).lineTo(r*0.7+windY+windX,r*0.9+windY).stroke({color:a,width:r*0.15,cap:'round'});
      // Scarf stripes
      g.moveTo(-r*0.5,r*0.42).quadraticCurveTo(0,r*0.55,r*0.5,r*0.42).stroke({color:0xFFFFFF,width:r*0.04,alpha:0.4});
    } else if (level === 7) { // Earmuffs
      // Headband
      g.moveTo(-r*0.6, -r*0.6).quadraticCurveTo(0, -r*0.9, r*0.6, -r*0.6).stroke({color:a, width:r*0.06, cap:'round'});
      // Ear muffs
      g.circle(-r*0.65, -r*0.5, r*0.18).fill({color:a});
      g.circle(r*0.65, -r*0.5, r*0.18).fill({color:a});
      // Scarf
      const windY = Math.sin(time*6)*r*0.1-phys.vy*0.15;
      g.moveTo(-r*0.8,r*0.4).quadraticCurveTo(0,r*0.6,r*0.8,r*0.4).stroke({color:a,width:r*0.2,cap:'round'});
      g.moveTo(r*0.6,r*0.45).lineTo(r*0.7+windY,r*0.9+windY).stroke({color:a,width:r*0.15,cap:'round'});
    } else if (level === 8) { // Beanie hat
      g.moveTo(-r*0.7,-r*0.6).quadraticCurveTo(0,-r*0.4,r*0.7,-r*0.6).stroke({color:a,width:r*0.25,cap:'round'});
      // Hat body
      g.moveTo(-r*0.65,-r*0.65).quadraticCurveTo(-r*0.3,-r*1.1,0,-r*1.0)
       .quadraticCurveTo(r*0.3,-r*1.1,r*0.65,-r*0.65).fill({color:a, alpha:0.8});
      // Pompom
      g.circle(0,-r*1.05,r*0.12).fill({color:0xFFFFFF});
      // Snow accumulation
      const accum = Math.max(0,1-Math.abs(phys.vx)-Math.abs(phys.vy));
      if(accum>0.5) g.circle(0,-r*1.15,r*0.08*accum).fill({color:0xFFFFFF,alpha:0.6});
    } else if (level === 9) { // Ice crystal
      // Hexagonal ice crystal overlay
      for(let i=0; i<6; i++) {
        const ca = Math.PI*2/6*i;
        g.moveTo(0,0).lineTo(Math.cos(ca)*r*0.8, Math.sin(ca)*r*0.8).stroke({color:0xCCEEFF, width:r*0.03, alpha:0.4});
        // Branch details
        const bx = Math.cos(ca)*r*0.5;
        const by = Math.sin(ca)*r*0.5;
        g.moveTo(bx, by).lineTo(bx+Math.cos(ca+0.5)*r*0.2, by+Math.sin(ca+0.5)*r*0.2).stroke({color:0xAADDFF, width:r*0.02, alpha:0.3});
        g.moveTo(bx, by).lineTo(bx+Math.cos(ca-0.5)*r*0.2, by+Math.sin(ca-0.5)*r*0.2).stroke({color:0xAADDFF, width:r*0.02, alpha:0.3});
      }
    } else if (level === 10) { // Polar bear
      // Massive round ears
      const ey = -r*0.6 + phys.vy*0.05;
      g.circle(-r*0.55, ey, r*0.22).fill({color:0xFFFFFF, alpha:0.7});
      g.circle(r*0.55, ey, r*0.22).fill({color:0xFFFFFF, alpha:0.7});
      // Snout
      g.circle(0, r*0.1, r*0.3).fill({color:0xFFFFFF, alpha:0.4});
      faceCtx.circle(0, r*0.1, r*0.06).fill({color:0x333333}); // nose
      // Scarf
      g.moveTo(-r*0.8,r*0.4).quadraticCurveTo(0,r*0.6,r*0.8,r*0.4).stroke({color:0xFF4444,width:r*0.15,cap:'round'});
    } else if (level === 11) { // Aurora Borealis
      // Northern lights overlay
      for(let i=0; i<4; i++) {
        const waveY = -r*0.6 + i*r*0.3;
        const phase = time*1.5 + i*0.8;
        const colors = [0x44FF88, 0x44AAFF, 0x8844FF, 0x44FFCC];
        g.moveTo(-r, waveY);
        for(let x=-r; x<=r; x+=r*0.2) {
          g.quadraticCurveTo(x+r*0.1, waveY+Math.sin(phase+x*0.02)*r*0.15, x+r*0.2, waveY);
        }
        g.stroke({color:colors[i], width:r*0.12, alpha:0.25+Math.sin(time*2+i)*0.1, cap:'round'});
      }
      // Snow crown
      g.circle(0,-r*0.9,r*0.25).fill({color:0xFFFFFF, alpha:0.7});
      if(Math.abs(phys.vx)<1) g.circle(0,-r*1.1,r*0.12).fill({color:0xFFFFFF, alpha:0.5});
    }

    SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);
  }
}
