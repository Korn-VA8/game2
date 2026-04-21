import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class SpookyTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const flicker = Math.sin(time * 7 + level * 1.3) * 0.15;
    // Outer ghostly aura — pulsing ring
    g.circle(0, 0, r*0.9).stroke({ color: a, alpha: 0.3 + flicker + Math.sin(time*3)*0.1, width: r*0.15 });

    if (level === 1) { // Ghost wisp
      for(let i=0; i<3; i++) {
        const wx = Math.sin(time*1.5+i*2)*r*0.3;
        const wy = -r*0.5+i*r*0.25+Math.cos(time*2+i)*r*0.1;
        g.circle(wx, wy, r*0.08).fill({ color: 0xFFFFFF, alpha: 0.3+Math.sin(time*3+i)*0.15 });
      }
    } else if (level === 2) { // Candy corn
      // Striped candy corn pattern
      g.moveTo(-r*0.3, r*0.3).lineTo(0, -r*0.6).lineTo(r*0.3, r*0.3).fill({ color: 0xFFFF00, alpha: 0.5 });
      g.moveTo(-r*0.2, r*0.1).lineTo(0, -r*0.3).lineTo(r*0.2, r*0.1).fill({ color: 0xFF8800, alpha: 0.5 });
      for(let i=0; i<3; i++) {
        const wx = Math.sin(time*1.5+i*2.5)*r*0.3;
        const wy = -r*0.4+i*r*0.3+Math.cos(time*2+i)*r*0.1;
        g.circle(wx, wy, r*0.06).fill({ color: 0xFFFFFF, alpha: 0.25+Math.sin(time*3+i)*0.1 });
      }
    } else if (level === 3) { // Eyeball
      // Bloodshot veins
      for(let i=0; i<4; i++) {
        const va = Math.PI*2/4*i + 0.3;
        g.moveTo(0,0).quadraticCurveTo(Math.cos(va)*r*0.3, Math.sin(va)*r*0.3, Math.cos(va)*r*0.7, Math.sin(va)*r*0.7)
         .stroke({ color: 0xFF3333, width: r*0.03, alpha: 0.5 });
      }
      faceCtx.circle(0, 0, r*0.35).fill({ color: a, alpha: 0.6 }); // iris
      faceCtx.circle(0, 0, r*0.15).fill({ color: 0x000000 }); // pupil
      faceCtx.circle(r*0.08, -r*0.08, r*0.06).fill({ color: 0xFFFFFF, alpha: 0.8 }); // glint
    } else if (level === 4) { // Spider
      // Web radials
      for(let i=0; i<3; i++) {
        const a2 = Math.PI*2/3*i - 0.5;
        g.moveTo(0,0).lineTo(Math.cos(a2)*r*0.9, Math.sin(a2)*r*0.9).stroke({color:0xFFFFFF,alpha:0.2,width:1});
      }
      g.circle(0,0,r*0.4).stroke({color:0xFFFFFF,alpha:0.15,width:1});
      // Spider legs
      for(let i=0; i<4; i++) {
        const legA = -Math.PI*0.6 + i*0.4;
        const lagX = Math.sin(time*2+i)*r*0.05;
        g.moveTo(Math.cos(legA)*r*0.5, Math.sin(legA)*r*0.5)
         .quadraticCurveTo(Math.cos(legA)*r*0.8+lagX, Math.sin(legA)*r*0.8, Math.cos(legA)*r+lagX, Math.sin(legA)*r*0.6)
         .stroke({color:0x2A1B30, width:r*0.04, cap:'round'});
      }
    } else if (level === 5) { // Witch hat
      g.circle(0,0,r*0.4).stroke({color:0xFFFFFF,alpha:0.15,width:1});
      // Hat brim
      g.ellipse(0, -r*0.6, r*0.7, r*0.1).fill({color:0x2A1B30, alpha:0.8});
      // Hat cone
      g.moveTo(-r*0.4, -r*0.6).lineTo(0, -r*1.3+Math.sin(time)*r*0.05).lineTo(r*0.4, -r*0.6).fill({color:0x2A1B30, alpha:0.8});
      // Hat buckle
      g.rect(-r*0.1, -r*0.65, r*0.2, r*0.08).fill({color:0xFFD700, alpha:0.8});
    } else if (level === 6) { // Bat
      const flap = Math.sin(time*4)*r*0.15;
      // Left wing
      g.moveTo(-r*0.6,-r*0.3).quadraticCurveTo(-r*1.1,-r*0.6+flap,-r*0.9,-r*0.1)
       .quadraticCurveTo(-r*0.7, r*0.1, -r*0.5, -r*0.2).fill({color:0x2A1B30,alpha:0.7});
      // Right wing
      g.moveTo(r*0.6,-r*0.3).quadraticCurveTo(r*1.1,-r*0.6+flap,r*0.9,-r*0.1)
       .quadraticCurveTo(r*0.7, r*0.1, r*0.5, -r*0.2).fill({color:0x2A1B30,alpha:0.7});
      // Wing membrane lines
      g.moveTo(-r*0.6,-r*0.25).lineTo(-r*0.9,-r*0.3+flap*0.5).stroke({color:0x1A0B20,width:1,alpha:0.5});
      g.moveTo(r*0.6,-r*0.25).lineTo(r*0.9,-r*0.3+flap*0.5).stroke({color:0x1A0B20,width:1,alpha:0.5});
    } else if (level === 7) { // Frankenstein
      // Bolts
      g.rect(-r*0.85, -r*0.1, r*0.2, r*0.08).fill({color:0x888888});
      g.rect(r*0.65, -r*0.1, r*0.2, r*0.08).fill({color:0x888888});
      // Stitches
      g.moveTo(0, -r*0.8).lineTo(0, r*0.8).stroke({color:0x2A1B30, width:r*0.04, alpha:0.5});
      for(let i=-2; i<=2; i++) {
        g.moveTo(-r*0.1, i*r*0.25).lineTo(r*0.1, i*r*0.25).stroke({color:0x2A1B30, width:r*0.03, alpha:0.5});
      }
      // Flat top
      g.moveTo(-r*0.5, -r*0.8).lineTo(r*0.5, -r*0.8).stroke({color:0x2A1B30, width:r*0.1, cap:'round'});
    } else if (level === 8) { // Pumpkin
      // Pumpkin ribs
      for(let i=-1; i<=1; i++) {
        g.moveTo(i*r*0.3,-r).quadraticCurveTo(i*r*0.3+r*0.15,0,i*r*0.3,r).stroke({color:0x000000,alpha:0.3,width:3});
      }
      // Stem
      g.moveTo(-r*0.05, -r*0.85).quadraticCurveTo(0, -r*1.1, r*0.1, -r*0.9).stroke({color:0x228822, width:r*0.08, cap:'round'});
    } else if (level === 9) { // Skeleton
      // Bone cross
      g.moveTo(-r*0.6, -r*0.6).lineTo(r*0.6, r*0.6).stroke({color:0xFFFFFF, width:r*0.08, cap:'round'});
      g.moveTo(r*0.6, -r*0.6).lineTo(-r*0.6, r*0.6).stroke({color:0xFFFFFF, width:r*0.08, cap:'round'});
      // Bone knobs
      const knobR = r*0.08;
      g.circle(-r*0.6, -r*0.6, knobR).fill({color:0xFFFFFF});
      g.circle(r*0.6, -r*0.6, knobR).fill({color:0xFFFFFF});
      g.circle(-r*0.6, r*0.6, knobR).fill({color:0xFFFFFF});
      g.circle(r*0.6, r*0.6, knobR).fill({color:0xFFFFFF});
      // Jaw detail
      faceCtx.moveTo(-r*0.3, r*0.3).lineTo(-r*0.25, r*0.2).lineTo(-r*0.15, r*0.3).lineTo(-r*0.1, r*0.2)
       .lineTo(0, r*0.3).lineTo(r*0.1, r*0.2).lineTo(r*0.15, r*0.3).lineTo(r*0.2, r*0.2).lineTo(r*0.3, r*0.3)
       .stroke({color:0xFFFFFF, width:2});
    } else if (level === 10) { // Reaper
      // Hood
      g.moveTo(-r*0.8, r*0.1).quadraticCurveTo(-r*0.6, -r*1.1, 0, -r*1.0)
       .quadraticCurveTo(r*0.6, -r*1.1, r*0.8, r*0.1).fill({color:0x1A0B20, alpha:0.8});
      // Scythe handle
      const scytheX = r*0.7;
      g.moveTo(scytheX, -r*0.8).lineTo(scytheX, r*0.8).stroke({color:0x888888, width:r*0.06, cap:'round'});
      // Scythe blade
      g.moveTo(scytheX, -r*0.8).quadraticCurveTo(scytheX-r*0.6, -r*0.9, scytheX-r*0.5, -r*0.5)
       .fill({color:0xCCCCCC, alpha:0.8});
    } else if (level === 11) { // Demon lord
      // Horns
      g.moveTo(-r*0.4, -r*0.7).quadraticCurveTo(-r*0.7, -r*1.3, -r*0.3, -r*1.1).fill({color:0x440000, alpha:0.9});
      g.moveTo(r*0.4, -r*0.7).quadraticCurveTo(r*0.7, -r*1.3, r*0.3, -r*1.1).fill({color:0x440000, alpha:0.9});
      // Dark aura rings
      const auraP = Math.sin(time*2)*0.3+0.5;
      g.circle(0, 0, r*1.15).stroke({color:0xFF0044, alpha:auraP*0.3, width:r*0.06});
      g.circle(0, 0, r*1.3).stroke({color:0xFF0044, alpha:auraP*0.15, width:r*0.03});
      // Flame wisps from bottom
      for(let i=0; i<5; i++) {
        const fx = -r*0.4 + i*r*0.2 + Math.sin(time*3+i)*r*0.05;
        const fh = Math.sin(time*4+i*1.5)*r*0.15 + r*0.25;
        g.moveTo(fx, r*0.7).quadraticCurveTo(fx+r*0.05, r*0.7-fh, fx+r*0.1, r*0.7)
         .fill({color:0xFF3300, alpha:0.4});
      }
    }

    // Spooky custom face — triangle eyes + zigzag mouth (except L3 eyeball which has its own face)
    if (level !== 3) {
      if (exp === 'impact' || exp === 'falling') {
        SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);
      } else {
        const glow = Math.sin(time*4+level) > 0 ? a : 0xFFFF00;
        faceCtx.moveTo(-r*0.4,-r*0.1).lineTo(-r*0.2,-r*0.3).lineTo(0,-r*0.1).closePath().fill({color:glow});
        faceCtx.moveTo(r*0.4,-r*0.1).lineTo(r*0.2,-r*0.3).lineTo(0,-r*0.1).closePath().fill({color:glow});
        faceCtx.moveTo(-r*0.5,r*0.3).lineTo(-r*0.25,r*0.2).lineTo(0,r*0.4).lineTo(r*0.25,r*0.2).lineTo(r*0.5,r*0.3)
         .lineTo(r*0.25,r*0.5).lineTo(0,r*0.3).lineTo(-r*0.25,r*0.5).closePath().fill({color:glow});
      }
    }

    // Hovering fog for idle creatures
    if (Math.abs(phys.vx)<0.5 && Math.abs(phys.vy)<0.5) {
      for(let i=0;i<4;i++){
        const drift=(time+i)%2;
        g.ellipse((i-1.5)*r*0.3,r*0.8+drift*r*0.2,r*0.3*(1-drift),r*0.1).fill({color:0xFFFFFF,alpha:0.1*(1-drift)});
      }
    }
  }
}
