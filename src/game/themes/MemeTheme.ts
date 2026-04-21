import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class MemeTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    if (level===1) { // Troll smile
      faceCtx.moveTo(-r*0.4,r*0.15).quadraticCurveTo(0,r*0.6,r*0.4,r*0.15).stroke({color:0,width:3,cap:'round'});
      SpriteGenerator.drawKawaiiFace(faceCtx,r,-r*0.1,exp);

    } else if (level===2) { // Tears (crying)
      g.moveTo(-r*0.35,r*0.05).lineTo(-r*0.3,r*0.5+Math.sin(time*5)*r*0.05).stroke({color:0x44AAFF,width:r*0.06,cap:'round'});
      g.moveTo(r*0.35,r*0.05).lineTo(r*0.4,r*0.6+Math.sin(time*5+1)*r*0.05).stroke({color:0x44AAFF,width:r*0.06,cap:'round'});
      SpriteGenerator.drawKawaiiFace(faceCtx,r,0,exp);

    } else if (level===3) { // Mustache
      faceCtx.moveTo(-r*0.35,r*0.1).quadraticCurveTo(-r*0.2,r*0.3,0,r*0.15).quadraticCurveTo(r*0.2,r*0.3,r*0.35,r*0.1).fill({color:0x3A2240});
      SpriteGenerator.drawKawaiiFace(faceCtx,r,-r*0.1,exp);

    } else if (level===4) { // Upside-down smile
      SpriteGenerator.drawKawaiiFace(faceCtx,r,0,exp);
      faceCtx.moveTo(-r*0.15,r*0.2).quadraticCurveTo(0,r*0.05,r*0.15,r*0.2).stroke({color:0x3A2240,width:2,cap:'round'});

    } else if (level===5) { // Sparkle eyes ✨
      this.drawStar(faceCtx,-r*0.35,-r*0.05,5,r*0.15,r*0.06,0xFFD700);
      this.drawStar(faceCtx,r*0.35,-r*0.05,5,r*0.15,r*0.06,0xFFD700);
      faceCtx.moveTo(-r*0.1,r*0.2).quadraticCurveTo(0,r*0.3,r*0.1,r*0.2).stroke({color:0x3A2240,width:2,cap:'round'});

    } else if (level===6) { // Heart eyes
      for(const sx of [-1,1]){const ex=sx*r*0.35;
        faceCtx.moveTo(ex,0).quadraticCurveTo(ex-r*0.12,-r*0.18,ex,r*0.05).quadraticCurveTo(ex+r*0.12,-r*0.18,ex,0).fill({color:0xFF3366});}
      faceCtx.moveTo(-r*0.1,r*0.2).quadraticCurveTo(0,r*0.3,r*0.1,r*0.2).stroke({color:0x3A2240,width:2,cap:'round'});

    } else if (level===7) { // Sunglasses (deal with it)
      g.rect(-r*0.6,-r*0.15,r*0.45,r*0.18).fill({color:0x111111});
      g.rect(r*0.15,-r*0.15,r*0.45,r*0.18).fill({color:0x111111});
      g.moveTo(-r*0.15,-r*0.06).lineTo(r*0.15,-r*0.06).stroke({color:0x111111,width:r*0.04});
      faceCtx.moveTo(-r*0.15,r*0.2).quadraticCurveTo(0,r*0.3,r*0.15,r*0.2).stroke({color:0x3A2240,width:2,cap:'round'});

    } else if (level===8) { // MLG pixelated glasses
      const lagY = -phys.vy*0.8;
      const bounceY = Math.abs(Math.sin(time*3))*r*0.05+Math.min(lagY,r*0.5);
      // Pixel-art style glasses (thinner)
      g.rect(-r*0.6,-r*0.2+bounceY,r*0.5,r*0.18).fill({color:0x000000});
      g.rect(r*0.1,-r*0.2+bounceY,r*0.5,r*0.18).fill({color:0x000000});
      g.moveTo(-r*0.1,-r*0.11+bounceY).lineTo(r*0.1,-r*0.11+bounceY).stroke({color:0x000000,width:r*0.04});
      // Pixel glare
      g.rect(-r*0.5,-r*0.18+bounceY,r*0.1,r*0.05).fill({color:0xFFFFFF,alpha:0.6});
      faceCtx.moveTo(-r*0.2,r*0.2).quadraticCurveTo(0,r*0.35,r*0.2,r*0.2).stroke({color:0,width:3,cap:'round'});

    } else if (level===9) { // MLG + Mountain Dew
      const lagY = -phys.vy*0.8;
      const bounceY = Math.abs(Math.sin(time*3))*r*0.05+Math.min(lagY,r*0.5);
      g.rect(-r*0.6,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.rect(r*0.1,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.moveTo(-r*0.1,-r*0.1+bounceY).lineTo(r*0.1,-r*0.1+bounceY).stroke({color:0x000000,width:r*0.05});
      // Glare trail
      const glareX = (time*r)%(r*0.5)-r*0.2;
      g.moveTo(-r*0.5+glareX,-r*0.15+bounceY).lineTo(-r*0.4+glareX,-r*0.05+bounceY).stroke({color:0xFFFFFF,width:2});
      // Mountain Dew can
      g.rect(r*0.55, r*0.1, r*0.2, r*0.4).fill({color:0x33CC33, alpha:0.6});
      g.rect(r*0.55, r*0.15, r*0.2, r*0.08).fill({color:0xFFFFFF, alpha:0.3});
      faceCtx.moveTo(-r*0.2,r*0.2).quadraticCurveTo(r*0.3,r*0.4,r*0.4,r*0.1).stroke({color:0,width:3});

    } else if (level===10) { // MLG spinning + doritos
      const lagY = -phys.vy*0.8;
      const bounceY = Math.abs(Math.sin(time*3))*r*0.05+Math.min(lagY,r*0.5);
      // Rainbow-tinted glasses
      const hueShift = Math.sin(time*2)*50;
      g.rect(-r*0.6,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.rect(r*0.1,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.moveTo(-r*0.1,-r*0.1+bounceY).lineTo(r*0.1,-r*0.1+bounceY).stroke({color:0x000000,width:r*0.05});
      // Rainbow lens tint
      g.rect(-r*0.55,-r*0.18+bounceY,r*0.4,r*0.15).fill({color:0xFF00FF, alpha:0.15+Math.sin(time*4)*0.1});
      g.rect(r*0.15,-r*0.18+bounceY,r*0.4,r*0.15).fill({color:0x00FFFF, alpha:0.15+Math.cos(time*4)*0.1});
      // Doritos
      const dRot = time*1.5;
      g.moveTo(-r*0.7+Math.cos(dRot)*r*0.1, r*0.4).lineTo(-r*0.55, r*0.1+Math.sin(dRot)*r*0.05).lineTo(-r*0.4, r*0.4).fill({color:0xFF6600, alpha:0.7});
      faceCtx.moveTo(-r*0.3,r*0.2).quadraticCurveTo(0,r*0.45,r*0.3,r*0.15).stroke({color:0,width:3});

    } else { // L11 — Full MLG setup + illuminati + airhorn
      const lagY = -phys.vy*0.8;
      const bounceY = Math.abs(Math.sin(time*3))*r*0.05+Math.min(lagY,r*0.5);
      // Chromatic aberration on fast movement
      if(Math.abs(phys.vx)>5) {
        g.rect(-r*0.6-phys.vx*1.5,-r*0.2,r*0.2,r*0.2).fill({color:c,alpha:0.5});
      }
      g.rect(-r*0.6,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.rect(r*0.1,-r*0.2+bounceY,r*0.5,r*0.2).fill({color:0x000000});
      g.moveTo(-r*0.1,-r*0.1+bounceY).lineTo(r*0.1,-r*0.1+bounceY).stroke({color:0x000000,width:r*0.05});
      // Glare
      const glareX = (time*r)%(r*0.5)-r*0.2;
      g.moveTo(-r*0.5+glareX,-r*0.15+bounceY).lineTo(-r*0.4+glareX,-r*0.05+bounceY).stroke({color:0xFFFFFF,width:2});
      // Illuminati triangle
      const triPulse = Math.sin(time*3)*0.2+0.6;
      g.moveTo(0, -r*0.9).lineTo(-r*0.3, -r*0.5).lineTo(r*0.3, -r*0.5).closePath()
       .stroke({color:0xFFD700, width:r*0.03, alpha:triPulse});
      // Eye of providence
      g.circle(0, -r*0.7, r*0.08).fill({color:0xFFD700, alpha:triPulse});
      faceCtx.moveTo(-r*0.2,r*0.2).quadraticCurveTo(r*0.3,r*0.4,r*0.4,r*0.1).stroke({color:0,width:3});
    }
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
