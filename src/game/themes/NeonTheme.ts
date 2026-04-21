import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class NeonTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const glitch = (phys.squashY<0.9||Math.abs(phys.vx)>10)?(Math.sin(time*30)>0?r*0.1:-r*0.1):0;
    const pulse = Math.sin(time*3+level)*0.3+0.6;

    // Neon body glow — the entire body emanates light
    g.circle(0,0,r*0.95).fill({color:a, alpha:0.06+pulse*0.04});

    // Per-level unique neon patterns
    if(level===1) { // Simple LED dot
      g.circle(0,-r*0.2,r*0.15).fill({color:a,alpha:pulse*0.6});
      g.circle(0,-r*0.2,r*0.08).fill({color:0xFFFFFF,alpha:pulse*0.4});

    } else if(level===2) { // Binary code scrolling
      for(let i=0;i<3;i++){
        const by=-r*0.6+((time*40+i*r*0.4)%(r*1.2));
        const bits=[1,0,1,1,0];
        for(let j=0;j<5;j++){
          if(bits[(j+i)%5])
            g.rect(-r*0.5+j*r*0.2+glitch,by,r*0.08,r*0.04).fill({color:a,alpha:0.4});
        }
      }

    } else if(level===3) { // Heartbeat/pulse wave
      g.moveTo(-r*0.8,0);
      for(let x=-r*0.8;x<=r*0.8;x+=r*0.1){
        const wave=Math.sin(x*0.05+time*8)*r*0.15*(x>-r*0.2&&x<r*0.2?3:1);
        g.lineTo(x+glitch,wave);
      }
      g.stroke({color:a,width:r*0.04,alpha:pulse*0.7,cap:'round'});

    } else if(level===4) { // Concentric rings
      for(let i=1;i<=3;i++){
        const ringR=r*(0.2+i*0.2);
        const ringAlpha=pulse*(0.15+i*0.05);
        g.circle(0,0,ringR).stroke({color:a,alpha:ringAlpha,width:r*0.03});
      }
      // Orbiting dot
      const orbitA=time*3;
      g.circle(Math.cos(orbitA)*r*0.6,Math.sin(orbitA)*r*0.6,r*0.06).fill({color:0xFFFFFF,alpha:pulse});

    } else if(level===5) { // Circuit board + data packets
      // Grid
      const gridN=3;
      for(let i=0;i<gridN;i++){
        const gy=-r*0.4+i*r*0.4;
        g.moveTo(-r*0.7+glitch,gy).lineTo(r*0.7+glitch,gy).stroke({color:a,width:1,alpha:0.2});
      }
      for(let i=0;i<gridN;i++){
        const gx=-r*0.4+i*r*0.4;
        g.moveTo(gx+glitch,-r*0.7).lineTo(gx+glitch,r*0.7).stroke({color:a,width:1,alpha:0.2});
      }
      // Data packets moving
      for(let i=0;i<3;i++){
        const pkt=((time*50+i*40)%(r*1.4))-r*0.7;
        g.circle(pkt+glitch,-r*0.4+i*r*0.4,r*0.05).fill({color:0xFFFFFF,alpha:0.8});
      }

    } else if(level===6) { // Hexagonal mesh
      for(let i=0;i<6;i++){
        const ha=Math.PI*2/6*i;
        const hx=Math.cos(ha)*r*0.5;
        const hy=Math.sin(ha)*r*0.5;
        g.moveTo(hx,hy);
        const ha2=Math.PI*2/6*((i+1)%6);
        g.lineTo(Math.cos(ha2)*r*0.5,Math.sin(ha2)*r*0.5).stroke({color:a,alpha:0.3,width:r*0.03});
        // Node dots
        g.circle(hx,hy,r*0.04).fill({color:a,alpha:pulse*0.6});
      }
      // Center node
      g.circle(0,0,r*0.08).fill({color:0xFFFFFF,alpha:pulse*0.5});

    } else if(level===7) { // DNA helix
      for(let i=0;i<10;i++){
        const t=i/10;
        const y=-r*0.8+t*r*1.6;
        const x1=Math.sin(y*0.03+time*4)*r*0.35;
        const x2=-x1;
        g.circle(x1+glitch,y,r*0.04).fill({color:a,alpha:0.5});
        g.circle(x2+glitch,y,r*0.04).fill({color:0x00FFFF,alpha:0.5});
        if(i%2===0) g.moveTo(x1+glitch,y).lineTo(x2+glitch,y).stroke({color:0xFFFFFF,alpha:0.15,width:1});
      }

    } else if(level===8) { // Scan line + matrix rain
      // Scan line
      const scanY=((time*60)%(r*2))-r;
      g.moveTo(-r,scanY+glitch).lineTo(r,scanY+glitch).stroke({color:0xFFFFFF,width:2,alpha:0.2});
      // Matrix rain columns
      for(let i=0;i<5;i++){
        const mx=-r*0.8+i*r*0.4;
        for(let j=0;j<4;j++){
          const my=((time*30+j*r*0.3+i*r*0.5)%(r*2))-r;
          g.rect(mx+glitch,my,r*0.06,r*0.08).fill({color:a,alpha:0.3-j*0.05});
        }
      }

    } else if(level===9) { // Waveform equalizer
      for(let i=0;i<8;i++){
        const bx=-r*0.7+i*r*0.2;
        const bh=Math.abs(Math.sin(time*5+i*0.8))*r*0.5+r*0.1;
        g.rect(bx+glitch,-bh/2,r*0.12,bh).fill({color:a,alpha:0.3+pulse*0.1});
        g.rect(bx+glitch+r*0.02,-bh/2+r*0.02,r*0.08,bh*0.3).fill({color:0xFFFFFF,alpha:0.15});
      }

    } else if(level===10) { // Holographic display
      // Outer pulse ring
      g.circle(0,0,r*1.05).stroke({color:a,alpha:pulse*0.4,width:r*0.04});
      // Rotating triangular display
      for(let i=0;i<3;i++){
        const ta=Math.PI*2/3*i+time*1.5;
        const tx=Math.cos(ta)*r*0.6;
        const ty=Math.sin(ta)*r*0.6;
        g.moveTo(tx,ty).lineTo(tx+r*0.15,ty+r*0.1).lineTo(tx-r*0.15,ty+r*0.1).closePath()
         .fill({color:a,alpha:0.2+pulse*0.1});
      }
      // Glitch bars on impact
      if(glitch!==0){
        g.rect(-r+glitch,-r*0.1,r*2,r*0.05).fill({color:0xFF0044,alpha:0.4});
        g.rect(-r-glitch,r*0.2,r*2,r*0.03).fill({color:0x00FFFF,alpha:0.4});
      }

    } else { // L11 — Full neon overload: all effects combined
      // Outer double ring
      g.circle(0,0,r*1.1).stroke({color:a,alpha:pulse*0.3,width:r*0.03});
      g.circle(0,0,r*1.2).stroke({color:0xFFFFFF,alpha:pulse*0.15,width:r*0.02});
      // Equalizer bars
      for(let i=0;i<6;i++){
        const bx=-r*0.5+i*r*0.2;
        const bh=Math.abs(Math.sin(time*6+i))*r*0.4+r*0.1;
        g.rect(bx+glitch,-bh/2,r*0.1,bh).fill({color:a,alpha:0.25});
      }
      // Orbiting data particles
      for(let i=0;i<6;i++){
        const oa=time*2+i*Math.PI/3;
        const dist=r*(0.7+Math.sin(time+i)*0.1);
        g.circle(Math.cos(oa)*dist+glitch,Math.sin(oa)*dist,r*0.04).fill({color:0xFFFFFF,alpha:0.7});
      }
      // Chromatic aberration on movement
      if(glitch!==0){
        g.rect(-r+glitch*2,-r*0.15,r*2,r*0.06).fill({color:0xFF0044,alpha:0.3});
        g.rect(-r-glitch*2,r*0.15,r*2,r*0.04).fill({color:0x00FFFF,alpha:0.3});
      }
      // Central core glow
      g.circle(0,0,r*0.2).fill({color:0xFFFFFF,alpha:pulse*0.15});
    }

    // Wires — complexity grows with level (shared across all)
    const wireCount = 1+Math.floor(level/4);
    for(let w=0;w<wireCount;w++){
      const wa=(Math.PI*2/wireCount)*w+0.5;
      const wx=Math.cos(wa)*r*0.5; const wy=Math.sin(wa)*r*0.5;
      const wx2=Math.cos(wa+1.5)*r*0.3; const wy2=Math.sin(wa+1.5)*r*0.3;
      if(glitch!==0){
        g.moveTo(wx+glitch,wy).lineTo(wx2+glitch,wy2).stroke({color:0xFF0044,width:2,alpha:0.6});
        g.moveTo(wx-glitch,wy).lineTo(wx2-glitch,wy2).stroke({color:0x00FFFF,width:2,alpha:0.6});
      } else {
        g.moveTo(wx,wy).lineTo(wx2,wy2).stroke({color:a,width:2,alpha:0.3});
      }
    }

    SpriteGenerator.drawKawaiiFace(faceCtx, r, glitch*0.5, exp);
  }
}
