import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class SportTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const rot = time*2 - phys.vx*0.05;
    const speed = Math.sqrt(phys.vx*phys.vx + phys.vy*phys.vy);
    const impact = phys.squashY < 0.9;

    if (level===1) { // Ping-pong — spinning ball with seam
      const spinAngle = rot * 3;
      g.circle(0,0,r*0.95).stroke({color:0xFF4400,alpha:0.6,width:r*0.06});
      // Spinning seam
      g.moveTo(Math.cos(spinAngle)*r*0.9, -r*0.3).quadraticCurveTo(0, r*0.2, Math.cos(spinAngle+Math.PI)*r*0.9, -r*0.3)
       .stroke({color:0xFFFFFF,width:r*0.04,alpha:0.4});
      // Motion blur on fast move
      if(speed>3) g.circle(-phys.vx*0.3,-phys.vy*0.3,r*0.9).stroke({color:c,alpha:0.15,width:r*0.04});

    } else if (level===2) { // Tennis — fuzzy texture + bounce seam
      // Fuzzy dots
      for(let i=0;i<12;i++){
        const fa=Math.PI*2/12*i+rot*0.5;
        const fr=r*(0.7+Math.sin(i*3.7)*0.15);
        g.circle(Math.cos(fa)*fr, Math.sin(fa)*fr, r*0.04).fill({color:0xCCFF00,alpha:0.3});
      }
      g.moveTo(-r,0).quadraticCurveTo(0,-r*0.3,r,0).stroke({color:0xFFFFFF,width:r*0.06,alpha:0.6});
      g.moveTo(-r,0).quadraticCurveTo(0,r*0.3,r,0).stroke({color:0xFFFFFF,width:r*0.06,alpha:0.6});

    } else if (level===3) { // Baseball — animated stitches
      const stRot = rot*0.3;
      for(let i=0;i<2;i++){const s=i===0?-1:1;
        g.moveTo(s*r*0.3,-r*0.7).quadraticCurveTo(s*r*0.6,0,s*r*0.3,r*0.7).stroke({color:0xCC0000,width:r*0.04});
        // Cross stitches
        for(let j=0;j<5;j++){
          const t=j/4-0.5;
          const bx=s*r*(0.3+Math.sin(t*2)*0.2);
          const by=t*r*1.4;
          g.moveTo(bx-r*0.06,by+stRot*r*0.01).lineTo(bx+r*0.06,by-stRot*r*0.01)
           .stroke({color:0xCC0000,width:r*0.02,alpha:0.7});
        }
      }

    } else if (level===4) { // Basketball — spinning lines + texture
      const bRot = rot*0.5;
      g.moveTo(-r,0).lineTo(r,0).stroke({color:0x000000,alpha:0.5,width:r*0.04});
      g.moveTo(0,-r).quadraticCurveTo(-r*0.4*Math.cos(bRot),0,0,r).stroke({color:0x000000,alpha:0.5,width:r*0.04});
      g.moveTo(0,-r).quadraticCurveTo(r*0.4*Math.cos(bRot),0,0,r).stroke({color:0x000000,alpha:0.5,width:r*0.04});
      // Pebbled texture
      for(let i=0;i<8;i++){
        const pa=Math.PI*2/8*i+rot;
        g.circle(Math.cos(pa)*r*0.5, Math.sin(pa)*r*0.5, r*0.03).fill({color:0x000000,alpha:0.15});
      }

    } else if (level===5) { // Soccer — rotating pentagons + grass particles
      for(let i=0;i<5;i++){const a2=Math.PI*2/5*i+rot*0.3;
        g.circle(Math.cos(a2)*r*0.5,Math.sin(a2)*r*0.5,r*0.2).fill({color:0x000000,alpha:0.35});}
      // Center pentagon
      g.circle(0,0,r*0.18).fill({color:0x000000,alpha:0.4});
      // Grass particles when impacted
      if(impact){for(let i=0;i<6;i++){
        const gx=Math.cos(time*10+i*2)*r*(0.5+Math.random()*0.5);
        const gy=r*0.8+Math.sin(time*8+i)*r*0.3;
        g.moveTo(gx,gy).lineTo(gx+r*0.05,gy-r*0.15).stroke({color:0x33CC33,width:2,alpha:0.5});
      }}

    } else if (level===6) { // American football — spinning laces + trail
      g.moveTo(0,-r*0.6).lineTo(0,r*0.6).stroke({color:0xFFFFFF,width:r*0.04});
      for(let i=-2;i<=2;i++)g.moveTo(-r*0.12,i*r*0.2).lineTo(r*0.12,i*r*0.2).stroke({color:0xFFFFFF,width:r*0.03});
      // Spiral spin on movement
      if(speed>2){
        const trail=rot*2;
        g.moveTo(0,-r*0.8).quadraticCurveTo(Math.cos(trail)*r*0.3,-r*0.4,0,0)
         .stroke({color:0xFFFFFF,alpha:0.2,width:r*0.03});
      }

    } else if (level===7) { // Volleyball — rotating panel lines + impact spark
      for(let i=0;i<3;i++){const a2=Math.PI*2/3*i+rot*0.2;
        g.moveTo(0,0).lineTo(Math.cos(a2)*r,Math.sin(a2)*r).stroke({color:0xDDDD00,alpha:0.5,width:r*0.04});}
      // Panel highlights
      for(let i=0;i<3;i++){const a2=Math.PI*2/3*i+rot*0.2+Math.PI/3;
        g.circle(Math.cos(a2)*r*0.5,Math.sin(a2)*r*0.5,r*0.06).fill({color:0xFFFFFF,alpha:0.2});}
      if(impact) g.circle(0,0,r*0.3).fill({color:0xFFFF88,alpha:0.3});

    } else if (level===8) { // Bowling — animated pins + strike energy
      g.moveTo(-r*0.3,-r*0.4).quadraticCurveTo(0,-r*0.7,r*0.3,-r*0.4).stroke({color:0xDD0000,width:r*0.15});
      g.moveTo(-r*0.2,-r*0.5).quadraticCurveTo(0,-r*0.65,r*0.2,-r*0.5).stroke({color:0xFFFFFF,width:r*0.06});
      // Pin shape at bottom
      g.moveTo(-r*0.1,r*0.2).lineTo(-r*0.15,r*0.6).quadraticCurveTo(0,r*0.8,r*0.15,r*0.6).lineTo(r*0.1,r*0.2)
       .fill({color:0xFFFFFF,alpha:0.3});
      // Strike sparks on impact
      if(impact){for(let i=0;i<4;i++){
        const sa=Math.PI*2/4*i+time*5;
        this.drawStar(g,Math.cos(sa)*r*0.7,Math.sin(sa)*r*0.7,4,r*0.08,r*0.03,0xFFFF00);
      }}

    } else if (level===9) { // Pool 8-ball — rotating 8 + reflection
      g.circle(0,0,r*0.45).fill({color:0xFFFFFF,alpha:0.9});
      faceCtx.circle(0,0,r*0.3).fill({color:0x000000});
      // Number 8
      const eightY = Math.sin(rot*0.2)*r*0.02;
      faceCtx.circle(0,-r*0.08+eightY,r*0.08).stroke({color:0xFFFFFF,width:2});
      faceCtx.circle(0,r*0.08+eightY,r*0.08).stroke({color:0xFFFFFF,width:2});
      // Rolling reflection
      const refAngle = rot*0.5;
      g.ellipse(Math.cos(refAngle)*r*0.2,-r*0.3,r*0.12,r*0.06).fill({color:0xFFFFFF,alpha:0.25});

    } else if (level===10) { // Rugby — spinning ball + motion lines
      g.moveTo(0,-r*0.7).lineTo(0,r*0.7).stroke({color:0xFFFFFF,width:r*0.04});
      g.moveTo(-r*0.15,-r*0.3).lineTo(r*0.15,-r*0.3).stroke({color:0xFFFFFF,width:r*0.03});
      g.moveTo(-r*0.15,r*0.3).lineTo(r*0.15,r*0.3).stroke({color:0xFFFFFF,width:r*0.03});
      // Speed lines
      if(speed>2){for(let i=0;i<4;i++){
        const ly=-r*0.6+i*r*0.4;
        g.moveTo(-r*1.1,ly-phys.vy*0.1).lineTo(-r*0.8,ly).stroke({color:0xFFFFFF,alpha:0.15,width:2});
        g.moveTo(r*1.1,ly-phys.vy*0.1).lineTo(r*0.8,ly).stroke({color:0xFFFFFF,alpha:0.15,width:2});
      }}
      // Impact dust
      if(impact){g.circle(0,r*0.8,r*0.3).fill({color:0x886644,alpha:0.15});}

    } else { // L11 Trophy — golden cup with sparkles + victory aura
      // Cup handles
      g.moveTo(-r*0.5,-r*0.3).quadraticCurveTo(-r*0.8,0,-r*0.5,r*0.1).stroke({color:0xFFD700,width:r*0.06});
      g.moveTo(r*0.5,-r*0.3).quadraticCurveTo(r*0.8,0,r*0.5,r*0.1).stroke({color:0xFFD700,width:r*0.06});
      // Cup body
      g.moveTo(-r*0.5,-r*0.3).lineTo(-r*0.6,-r*0.7).quadraticCurveTo(0,-r*1.1,r*0.6,-r*0.7).lineTo(r*0.5,-r*0.3).stroke({color:0xFFD700,width:r*0.08});
      // Base
      g.moveTo(-r*0.15,r*0.3).lineTo(r*0.15,r*0.3).lineTo(r*0.3,r*0.7).lineTo(-r*0.3,r*0.7).fill({color:0xFFD700,alpha:0.6});
      // Stem
      g.moveTo(0,r*0.1).lineTo(0,r*0.35).stroke({color:0xFFD700,width:r*0.08,cap:'round'});
      // Star on top
      this.drawStar(g, 0, -r*0.9, 5, r*0.15, r*0.06, 0xFFFFFF);
      // Victory sparkles
      for(let i=0;i<6;i++){
        const sa=time*1.5+i*1.1;
        const sx=Math.cos(sa)*r*0.8;
        const sy=Math.sin(sa*0.7)*r*0.6-r*0.3;
        this.drawStar(g,sx,sy,4,r*0.06,r*0.025,0xFFFFFF);
      }
      // Victory aura
      const auraPulse=Math.sin(time*2)*0.15+0.3;
      g.circle(0,-r*0.3,r*1.1).stroke({color:0xFFD700,alpha:auraPulse,width:r*0.03});
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
