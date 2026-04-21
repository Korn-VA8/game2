import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

export class AnimalTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const inertiaY = Math.max(-1, Math.min(1, phys.vy * 0.05));
    const earWag = Math.sin(time * 0.8) * 0.08;
    const earDrop = inertiaY * r * 0.3;

    // Blush for earlier levels
    if (level < 8) {
      const blushAlpha = 0.25 + Math.sin(time * 3) * 0.1;
      faceCtx.circle(-r * 0.45, r * 0.05, r * 0.15).fill({ color: 0xFF5555, alpha: blushAlpha });
      faceCtx.circle(r * 0.45, r * 0.05, r * 0.15).fill({ color: 0xFF5555, alpha: blushAlpha });
    }

    if (level === 1) { // Mouse
      // Ears
      const ey = -r*0.75 + earWag*r + Math.max(0, earDrop);
      g.circle(-r*0.5, ey, r*0.25).fill({ color: c }).circle(-r*0.5, ey, r*0.12).fill({ color: a });
      g.circle(r*0.5, ey, r*0.25).fill({ color: c }).circle(r*0.5, ey, r*0.12).fill({ color: a });
      // Whiskers
      faceCtx.moveTo(-r*0.4, 0).lineTo(-r*0.8, -r*0.1).stroke({ color: 0x3A2240, width: 2, cap: 'round' });
      faceCtx.moveTo(-r*0.4, r*0.1).lineTo(-r*0.8, r*0.1).stroke({ color: 0x3A2240, width: 2, cap: 'round' });
      faceCtx.moveTo(r*0.4, 0).lineTo(r*0.8, -r*0.1).stroke({ color: 0x3A2240, width: 2, cap: 'round' });
      faceCtx.moveTo(r*0.4, r*0.1).lineTo(r*0.8, r*0.1).stroke({ color: 0x3A2240, width: 2, cap: 'round' });
      // Nose
      faceCtx.circle(0, r*0.1, r*0.05).fill({ color: 0xFF8888 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 2) { // Hamster
      // Chubby cheeks
      g.circle(-r*0.5, r*0.2, r*0.3).fill({ color: a, alpha: 0.5 });
      g.circle(r*0.5, r*0.2, r*0.3).fill({ color: a, alpha: 0.5 });
      // Eye patch
      g.circle(r*0.35, -r*0.15, r*0.2).fill({ color: a, alpha: 0.4 });
      // Little hands
      faceCtx.circle(-r*0.2, r*0.4, r*0.08).fill({ color: c });
      faceCtx.circle(r*0.2, r*0.4, r*0.08).fill({ color: c });
      // Ears
      const ey = -r*0.7 + earWag*r + Math.max(0, earDrop);
      g.circle(-r*0.4, ey, r*0.2).fill({ color: c }).circle(-r*0.4, ey, r*0.1).fill({ color: a });
      g.circle(r*0.4, ey, r*0.2).fill({ color: c }).circle(r*0.4, ey, r*0.1).fill({ color: a });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 3) { // Bunny
      // Long ears
      const earTipY = -r*1.2 + Math.max(0, earDrop * 2);
      const lagX = phys.vx * 0.1;
      g.moveTo(-r*0.3, -r*0.6).quadraticCurveTo(-r*0.5 - lagX, -r*0.9, -r*0.3 - lagX, earTipY).quadraticCurveTo(-r*0.1 - lagX, -r*0.9, -r*0.1, -r*0.6).fill({ color: c });
      g.moveTo(r*0.3, -r*0.6).quadraticCurveTo(r*0.1 - lagX, -r*0.9, r*0.3 - lagX, earTipY).quadraticCurveTo(r*0.5 - lagX, -r*0.9, r*0.5, -r*0.6).fill({ color: c });
      // Bunny teeth
      if (exp === 'idle') {
        faceCtx.rect(-r*0.06, r*0.15, r*0.05, r*0.1).fill({ color: 0xFFFFFF });
        faceCtx.rect(0.01, r*0.15, r*0.05, r*0.1).fill({ color: 0xFFFFFF });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 4) { // Cat
      // Tabby stripes
      g.moveTo(-r*0.15, -r*0.6).lineTo(-r*0.2, -r*0.3).stroke({ color: a, width: r*0.06, cap: 'round' });
      g.moveTo(0, -r*0.65).lineTo(0, -r*0.3).stroke({ color: a, width: r*0.06, cap: 'round' });
      g.moveTo(r*0.15, -r*0.6).lineTo(r*0.2, -r*0.3).stroke({ color: a, width: r*0.06, cap: 'round' });
      // Pointy ears
      const earTipY = -r*0.9 + earDrop*1.5;
      const earTipX = earWag*r + Math.abs(inertiaY)*r*0.2;
      g.moveTo(-r*0.7, -r*0.5).lineTo(-r*0.5 - earTipX, earTipY).lineTo(-r*0.3, -r*0.5).fill({ color: c });
      g.moveTo(r*0.7, -r*0.5).lineTo(r*0.5 + earTipX, earTipY).lineTo(r*0.3, -r*0.5).fill({ color: c });
      g.moveTo(-r*0.6, -r*0.55).lineTo(-r*0.5 - earTipX, earTipY + r*0.1).lineTo(-r*0.4, -r*0.55).fill({ color: a });
      g.moveTo(r*0.6, -r*0.55).lineTo(r*0.5 + earTipX, earTipY + r*0.1).lineTo(r*0.4, -r*0.55).fill({ color: a });
      // Custom cat mouth override
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);
      if (exp === 'idle') {
         faceCtx.moveTo(-r*0.15, r*0.15).quadraticCurveTo(-r*0.07, r*0.25, 0, r*0.15).quadraticCurveTo(r*0.07, r*0.25, r*0.15, r*0.15).stroke({ color: 0x3A2240, width: 2, cap: 'round' });
      }

    } else if (level === 5) { // Corgi
      // Big side ears
      const lagY = phys.vy * 0.1;
      g.moveTo(-r*0.5, -r*0.4).lineTo(-r*0.9, -r*0.5 + lagY).lineTo(-r*0.6, -r*0.1).fill({ color: c });
      g.moveTo(r*0.5, -r*0.4).lineTo(r*0.9, -r*0.5 + lagY).lineTo(r*0.6, -r*0.1).fill({ color: c });
      g.moveTo(-r*0.6, -r*0.35).lineTo(-r*0.8, -r*0.4 + lagY).lineTo(-r*0.65, -r*0.2).fill({ color: 0xFFFFFF });
      g.moveTo(r*0.6, -r*0.35).lineTo(r*0.8, -r*0.4 + lagY).lineTo(r*0.65, -r*0.2).fill({ color: 0xFFFFFF });
      // Back spot
      g.ellipse(0, r*0.2, r*0.4, r*0.6).fill({ color: 0xFFFFFF, alpha: 0.3 });
      // Tongue
      faceCtx.ellipse(0, r*0.25 + phys.vy*0.02, r*0.1, r*0.15).fill({ color: 0xFF8888 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 6) { // Fox
      // White chest
      g.moveTo(-r*0.4, 0).lineTo(0, r*0.5).lineTo(r*0.4, 0).fill({ color: 0xFFFFFF, alpha: 0.8 });
      // Sharp ears
      const earTipY = -r*0.9 + earDrop;
      g.moveTo(-r*0.6, -r*0.5).lineTo(-r*0.5, earTipY).lineTo(-r*0.3, -r*0.5).fill({ color: c });
      g.moveTo(r*0.6, -r*0.5).lineTo(r*0.5, earTipY).lineTo(r*0.3, -r*0.5).fill({ color: c });
      g.circle(-r*0.5, earTipY, r*0.1).fill({ color: 0x222222 }); // black tips
      g.circle(r*0.5, earTipY, r*0.1).fill({ color: 0x222222 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 7) { // Raccoon
      // Bandit mask
      g.moveTo(-r*0.8, -r*0.1).quadraticCurveTo(0, r*0.1, r*0.8, -r*0.1).lineTo(r*0.5, -r*0.4).quadraticCurveTo(0, -r*0.2, -r*0.5, -r*0.4).fill({ color: 0x2A1B30, alpha: 0.8 });
      // Ears
      g.moveTo(-r*0.6, -r*0.5).lineTo(-r*0.5, -r*0.8 + earDrop).lineTo(-r*0.3, -r*0.5).fill({ color: c });
      g.moveTo(r*0.6, -r*0.5).lineTo(r*0.5, -r*0.8 + earDrop).lineTo(r*0.3, -r*0.5).fill({ color: c });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 8) { // Panda
      // Black eye drops
      g.ellipse(-r*0.35, -r*0.1, r*0.25, r*0.2).fill({ color: 0x2A1B30 });
      g.ellipse(r*0.35, -r*0.1, r*0.25, r*0.2).fill({ color: 0x2A1B30 });
      // Bamboo leaf
      const leafRot = Math.sin(time*0.6) * 0.2 + phys.vx * 0.05;
      faceCtx.moveTo(0, r*0.2).lineTo(r*0.4 * Math.cos(leafRot), r*0.2 + r*0.4 * Math.sin(leafRot)).stroke({ color: 0x44CF6C, width: r*0.1, cap: 'round' });
      // Small ears
      const ey = -r*0.7 + Math.max(0, earDrop);
      g.circle(-r*0.5, ey, r*0.2).fill({ color: 0x2A1B30 });
      g.circle(r*0.5, ey, r*0.2).fill({ color: 0x2A1B30 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 9) { // Bear
      // Massive round ears
      const ey = -r*0.6 + earDrop*0.5;
      g.circle(-r*0.6, ey, r*0.3).fill({ color: c });
      g.circle(r*0.6, ey, r*0.3).fill({ color: c });
      // Light snout
      g.circle(0, r*0.1, r*0.4).fill({ color: 0xFFFFFF, alpha: 0.4 });
      // Angry eyebrows if fast or impact
      if (exp === 'impact' || phys.vy > 10) {
         faceCtx.moveTo(-r*0.5, -r*0.4).lineTo(-r*0.2, -r*0.2).stroke({ color: 0x3A2240, width: r*0.08, cap: 'round' });
         faceCtx.moveTo(r*0.5, -r*0.4).lineTo(r*0.2, -r*0.2).stroke({ color: 0x3A2240, width: r*0.08, cap: 'round' });
      }
      // Scar
      g.moveTo(-r*0.4, -r*0.3).lineTo(-r*0.2, -r*0.6).stroke({ color: 0x3A2240, alpha: 0.5, width: r*0.05 });
      g.moveTo(-r*0.35, -r*0.4).lineTo(-r*0.25, -r*0.45).stroke({ color: 0x3A2240, alpha: 0.5, width: r*0.03 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 10) { // Lion
      // Animated flame-like mane
      for(let i=0; i<12; i++) {
        const baseAngle = Math.PI*2/12 * i;
        const angle = baseAngle + Math.sin(time * 0.8 + i) * 0.05 + phys.vx * 0.05;
        const px = Math.cos(angle) * r * 0.8;
        const py = Math.sin(angle) * r * 0.8;
        g.moveTo(px, py).lineTo(Math.cos(angle)*(r*1.4) - phys.vx*0.2, Math.sin(angle)*(r*1.4) - phys.vy*0.2).lineTo(Math.cos(angle+0.3)*r*0.8, Math.sin(angle+0.3)*r*0.8).fill({ color: a });
      }
      // Crown
      const crownY = -r*0.9 + phys.vy * 0.1;
      g.moveTo(-r*0.3, crownY).lineTo(-r*0.4, crownY - r*0.4).lineTo(-r*0.1, crownY - r*0.2).lineTo(0, crownY - r*0.5).lineTo(r*0.1, crownY - r*0.2).lineTo(r*0.4, crownY - r*0.4).lineTo(r*0.3, crownY).fill({ color: 0xFFD700 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);

    } else if (level === 11) { // Dragon
      // procedural back scales
      for(let i=0; i<5; i++) {
         const scaleY = -r*0.8 + i*r*0.3;
         const scaleX = r + Math.sin(time*0.5 + i)*r*0.1;
         g.moveTo(r*0.7, scaleY).lineTo(scaleX, scaleY - r*0.2).lineTo(r*0.8, scaleY+r*0.2).fill({ color: a });
      }
      // Horns
      g.moveTo(-r*0.3, -r*0.8).quadraticCurveTo(-r*0.6, -r*1.2, -r*0.9, -r*0.9).stroke({ color: a, width: r*0.15, cap: 'round' });
      g.moveTo(r*0.3, -r*0.8).quadraticCurveTo(r*0.6, -r*1.2, r*0.9, -r*0.9).stroke({ color: a, width: r*0.15, cap: 'round' });
      // Wings flapping
      const flap = Math.sin(time*1.5) * r * 0.4 - phys.vy * 0.2;
      g.moveTo(-r*0.8, 0).quadraticCurveTo(-r*1.5, -r*0.5 + flap, -r*1.2, r*0.2).fill({ color: a, alpha: 0.8 });
      g.moveTo(r*0.8, 0).quadraticCurveTo(r*1.5, -r*0.5 + flap, r*1.2, r*0.2).fill({ color: a, alpha: 0.8 });
      // Fire breath if fast or impact
      if (phys.vy > 8 || exp === 'impact') {
         faceCtx.moveTo(0, r*0.2).lineTo(-r*0.3, r*0.8).lineTo(0, r*0.6).lineTo(r*0.3, r*0.8).fill({ color: 0xFF5555, alpha: 0.8 });
         faceCtx.moveTo(0, r*0.2).lineTo(-r*0.15, r*0.6).lineTo(0, r*0.4).lineTo(r*0.15, r*0.6).fill({ color: 0xFFFF55, alpha: 0.9 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r * 0.1, exp);
    }
  }
}
