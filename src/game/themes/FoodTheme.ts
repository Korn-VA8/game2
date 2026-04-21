import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class FoodTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const inertiaY = Math.max(-2, Math.min(2, phys.vy * 0.05));
    const speed = Math.sqrt(phys.vx * phys.vx + phys.vy * phys.vy);

    // Common dynamic glaze logic for mid-to-high levels
    const drawGlaze = (color: number) => {
      const glazeWobble = Math.sin(time * 1.2) * r * 0.05;
      const glazeStretch = Math.max(0, phys.vy * 0.03 * r);
      const glazeImpact = phys.squashY < 0.9 ? r * 0.15 : 0;
      g.moveTo(-r, 0).quadraticCurveTo(-r*0.5, r*0.3 + glazeWobble + glazeImpact - glazeStretch, 0, 0)
       .quadraticCurveTo(r*0.5, r*0.4 - glazeWobble + glazeImpact - glazeStretch, r, 0)
       .lineTo(r, -r).lineTo(-r, -r).fill({ color, alpha: 0.9 });
    };

    if (level === 1) { // Caramel / Candy
      // Swirl pattern spinning slowly
      const rot = time * 0.5;
      for (let i = 0; i < 4; i++) {
        const offset = (Math.PI * 2 / 4) * i;
        g.moveTo(0,0);
        for(let j = 1; j <= 10; j++) {
           const angle = rot + offset + j * 0.25;
           const dist = j * r * 0.09;
           g.lineTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
        }
        g.stroke({ color: a, width: r*0.12, cap: 'round' });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 2) { // Marmalade / Jelly
      // Sugar coating (static points along edges)
      for(let i = 0; i < 16; i++) {
         const angle = (Math.PI * 2 / 16) * i + Math.sin(time*0.5)*0.1;
         const px = Math.cos(angle) * r * 0.9;
         const py = Math.sin(angle) * r * 0.9;
         g.rect(px, py, r*0.06, r*0.06).fill({ color: 0xFFFFFF, alpha: 0.8 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 3) { // Cookie
      // Bumpy edge — manual scalloped border (dash not supported in PixiJS v8)
      const bumps = 14;
      for (let i = 0; i < bumps; i++) {
        const ba1 = (Math.PI * 2 / bumps) * i;
        const ba2 = (Math.PI * 2 / bumps) * (i + 0.5);
        const bumpR = r * (0.92 + Math.sin(i * 3.7) * 0.04);
        g.circle(Math.cos(ba1) * bumpR, Math.sin(ba1) * bumpR, r * 0.08).fill({ color: a, alpha: 0.6 });
        g.circle(Math.cos(ba2) * bumpR * 0.98, Math.sin(ba2) * bumpR * 0.98, r * 0.06).fill({ color: a, alpha: 0.4 });
      }
      // Chocolate chips (deterministic shake on impact)
      const shake = phys.squashY < 0.9 ? Math.sin(time*20)*r*0.05 : 0;
      const chips = [
        {x: -0.4, y: -0.3}, {x: 0.3, y: -0.5}, {x: 0.5, y: 0.2},
        {x: -0.5, y: 0.4}, {x: 0.1, y: 0.5}, {x: -0.1, y: 0.0}
      ];
      for (const chip of chips) {
         g.ellipse(chip.x*r + shake, chip.y*r + shake, r*0.1, r*0.07).fill({ color: 0x3d2314 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 4) { // Donut
      // Inner hole
      g.circle(0, 0, r*0.3).fill({ color: 0xFFFFFF, alpha: 0.5 }); // Soft hole blend
      g.circle(0, 0, r*0.3).stroke({ color: c, width: r*0.1 });
      // Glaze
      drawGlaze(a);
      // Sprinkles (react to phys)
      for (let i = 0; i < 8; i++) {
         const angle = i * 2.4;
         const dist = r * 0.6;
         const px = Math.cos(angle) * dist;
         const py = Math.sin(angle) * dist - r*0.2;
         const fColor = [0xFFFFFF, 0x33CCFF, 0xFFFF33][i % 3];
         g.moveTo(px, py).lineTo(px + r*0.1, py + r*0.05).stroke({ color: fColor, width: r*0.05, cap: 'round' });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, r*0.1, exp);

    } else if (level === 5) { // Cupcake
      // Paper cup ridges at bottom
      for(let i=-3; i<=3; i++) {
        g.moveTo(i*r*0.2, r*0.2).lineTo(i*r*0.15, r*0.9).stroke({ color: c, width: r*0.05, alpha: 0.5 });
      }
      // Frosting dome
      g.moveTo(-r*0.9, r*0.2).quadraticCurveTo(0, -r*1.4 - inertiaY, r*0.9, r*0.2).fill({ color: a });
      // Cherry on top (wobbles with inertia)
      const cherryX = phys.vx * 0.1;
      const cherryY = -r*0.9 + Math.max(0, inertiaY)*0.5;
      g.circle(cherryX, cherryY, r*0.15).fill({ color: 0xFF2222 });
      g.moveTo(cherryX, cherryY).quadraticCurveTo(cherryX + r*0.1, cherryY - r*0.2, cherryX + r*0.3, cherryY - r*0.1).stroke({ color: 0x228822, width: r*0.04 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 6) { // Ice Cream
      // Waffle cone pattern below
      g.moveTo(-r*0.8, r*0.1).lineTo(0, r*1.2).lineTo(r*0.8, r*0.1).fill({ color: 0xDEB887 });
      g.moveTo(-r*0.8, r*0.1).lineTo(0, r*1.2).lineTo(r*0.8, r*0.1).stroke({ color: 0x8B4513, width: r*0.02 });
      for(let i=1; i<4; i++) {
         g.moveTo(-r*0.8 + i*r*0.4, r*0.1).lineTo(0, r*1.2).stroke({ color: 0x8B4513, width: r*0.02, alpha: 0.3 });
         g.moveTo(r*0.8 - i*r*0.4, r*0.1).lineTo(0, r*1.2).stroke({ color: 0x8B4513, width: r*0.02, alpha: 0.3 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r*0.2, exp);

    } else if (level === 7) { // Lollipop
      // Stick
      g.moveTo(0, r).lineTo(0, r*1.6).stroke({ color: 0xFFFFFF, width: r*0.15, cap: 'round' });
      // Inner spiral
      const rot = time * 2;
      for (let i = 0; i < 3; i++) {
        const offset = (Math.PI * 2 / 3) * i;
        g.moveTo(0,0);
        for(let j = 1; j <= 12; j++) {
           const angle = rot + offset + j * 0.3;
           const dist = j * r * 0.08;
           g.lineTo(Math.cos(angle)*dist, Math.sin(angle)*dist);
        }
        const stripeColor = [0xFFFFFF, 0xFF3366, 0x33CCFF][i];
        g.stroke({ color: stripeColor, width: r*0.1, cap: 'round' });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 8) { // Layered Cake
      // Horizontal cream layers
      const layers = 3;
      for(let i=0; i<layers; i++) {
        const ly = -r*0.5 + i * r*0.5;
        g.moveTo(-r*0.8, ly).quadraticCurveTo(0, ly + Math.sin(time*2 + i)*r*0.1, r*0.8, ly).stroke({ color: 0xFFFFFF, width: r*0.15, cap: 'round' });
      }
      // Candle
      const candleY = -r*0.8;
      g.moveTo(0, candleY).lineTo(0, candleY - r*0.3).stroke({ color: 0xFFFFFF, width: r*0.1, cap: 'round' });
      const flicker = Math.sin(time * 8) * 0.1 + 0.1;
      g.moveTo(0, candleY - r*0.35).lineTo(0, candleY - r*0.5 - flicker*r).stroke({ color: 0xFF9900, width: r*0.08, cap: 'round' });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, r*0.2, exp);

    } else if (level === 9) { // Pizza
      // Cheese stretch when falling
      if (phys.vy > 2) {
         g.moveTo(-r*0.3, r*0.8).quadraticCurveTo(0, r*1.2, r*0.3, r*0.8).stroke({ color: 0xFFD700, width: r*0.05 });
      }
      // Pepperoni
      const peps = [{x:-0.4,y:-0.4}, {x:0.4,y:-0.2}, {x:0.1,y:0.4}, {x:-0.3,y:0.2}];
      for (const p of peps) {
         g.circle(p.x*r, p.y*r, r*0.18).fill({ color: 0xCC3333 });
         g.circle(p.x*r - r*0.05, p.y*r - r*0.05, r*0.04).fill({ color: 0xFF9999 }); // highlight
      }
      // Crust
      g.circle(0, 0, r).stroke({ color: 0xD2691E, width: r*0.15 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 10) { // Burger
      // Bun sesame seeds (deterministic positions based on index)
      const seedPositions = [
        {x: -0.35, y: -0.75}, {x: -0.1, y: -0.82}, {x: 0.15, y: -0.7},
        {x: 0.35, y: -0.78}, {x: -0.25, y: -0.65}, {x: 0.05, y: -0.6},
        {x: 0.3, y: -0.55}, {x: -0.15, y: -0.5}
      ];
      for (const seed of seedPositions) {
         g.ellipse(seed.x*r, seed.y*r, r*0.03, r*0.05).fill({ color: 0xFFFFFF, alpha: 0.8 });
      }
      // Lettuce
      const lettuceY = -r*0.1;
      g.moveTo(-r*0.9, lettuceY);
      for(let x=-r*0.9; x<=r*0.9; x+=r*0.2) {
        g.quadraticCurveTo(x+r*0.1, lettuceY + Math.sin(time*3 + x)*r*0.1 + phys.vy*0.05, x+r*0.2, lettuceY);
      }
      g.stroke({ color: 0x33CC33, width: r*0.1, cap: 'round' });
      // Cheese corner hanging
      g.moveTo(-r*0.4, 0).lineTo(-r*0.2, r*0.4 - inertiaY).lineTo(0, 0).fill({ color: 0xFFD700 });
      // Patty
      g.moveTo(-r*0.8, r*0.2).lineTo(r*0.8, r*0.2).stroke({ color: 0x5C4033, width: r*0.2, cap: 'round' });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r*0.3, exp);

    } else if (level === 11) { // Grand Feast Cake
       // Multi-tier
       g.moveTo(-r*1.1, r*0.6).lineTo(r*1.1, r*0.6).stroke({ color: a, width: r*0.4, cap: 'round' });
       g.moveTo(-r*0.8, r*0.1).lineTo(r*0.8, r*0.1).stroke({ color: c, width: r*0.5, cap: 'round' });
       g.moveTo(-r*0.5, -r*0.5).lineTo(r*0.5, -r*0.5).stroke({ color: 0xFFFFFF, width: r*0.6, cap: 'round' });
       
       // Procedural flying confetti
       const confettiCount = 12;
       for (let i = 0; i < confettiCount; i++) {
          const orbit = time * (1 + (i%3)*0.2);
          const dist = r * 0.6 * ((i%4)+1);
          let px = Math.cos(orbit + i * 2.1) * dist + phys.vx * 0.1 * (i%3);
          let py = Math.sin(orbit + i * 1.7) * dist - r * 0.2 + phys.vy * 0.1 * (i%3);
          
          if (speed > 5) {
             py -= speed * (i%4); // fountain effect on impact/falling
             px += (i%2===0?1:-1) * speed * 2;
          }
          const fColor = [0xFF3366, 0x33CCFF, 0xFFFF33, 0x33FF33][i % 4];
          g.rect(px, py, r*0.08, r*0.08).fill({ color: fColor });
       }
       
       // Crown candle
       const cx = 0, cy = -r*1.1;
       g.moveTo(cx-r*0.1, cy).lineTo(cx, cy-r*0.3).lineTo(cx+r*0.1, cy).stroke({ color: 0xFF9900, width: r*0.08, cap: 'round' });
       
       SpriteGenerator.drawKawaiiFace(faceCtx, r, r*0.2, exp);
    }
  }
}
