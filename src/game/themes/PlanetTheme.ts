import { Graphics } from 'pixi.js';
import type { CreatureExpression, SpritePhysicsInfo } from '../SpriteGenerator';
import { SpriteGenerator } from '../SpriteGenerator';

/**
 * PlanetTheme: Bold, high-contrast celestial bodies ordered outward from the Sun.
 * L1: Moon, L2: Mercury, L3: Venus, L4: Earth, L5: Mars, L6: Jupiter,
 * L7: Saturn, L8: Uranus, L9: Neptune, L10: Sun, L11: Black Hole
 */
export class PlanetTheme {
  public static draw(g: Graphics, faceCtx: Graphics, r: number, level: number, c: number, a: number, exp: CreatureExpression, time: number, phys: SpritePhysicsInfo) {
    const speed = Math.sqrt(phys.vx * phys.vx + phys.vy * phys.vy);
    const rot = (time * 0.5) % (Math.PI * 2);

    // ── Global: ambient starfield (twinkling white stars around) ──
    for (let i = 0; i < 4; i++) {
        const sa = i * 1.7 + level * 0.5;
        const sd = r * (1.1 + Math.sin(time * 2 + i * 3) * 0.2);
        const sx = Math.cos(sa) * sd;
        const sy = Math.sin(sa) * sd;
        const twinkle = 0.5 + Math.sin(time * 5 + i * 2.1) * 0.5;
        g.circle(sx, sy, r * 0.03).fill({ color: 0xFFFFFF, alpha: twinkle });
    }

    // Bold, solid crater helper
    const crater = (cx: number, cy: number, cr: number, darkCol: number, lightCol: number) => {
      const projX = Math.sin(rot + cx / r) * r * Math.cos(cy / r);
      if (Math.cos(rot + cx / r) > 0) {
        const scaleX = Math.abs(Math.cos(rot + cx / r));
        // Outer rim
        g.ellipse(projX, cy, cr * scaleX, cr).fill({ color: lightCol, alpha: 1.0 });
        // Inner pit
        g.ellipse(projX, cy + cr * 0.15, cr * 0.8 * scaleX, cr * 0.8).fill({ color: darkCol, alpha: 1.0 });
      }
    };

    if (level === 1) {
      // ═══ L1: MOON ═══
      // Base is pale grey. Draw solid dark grey Maria (seas).
      const mareX1 = Math.sin(rot+0.5)*r*0.6;
      if (Math.cos(rot+0.5) > -0.2) g.ellipse(mareX1, -r*0.2, r*0.4, r*0.3).fill({ color: 0x999999, alpha: 1.0 });
      const mareX2 = Math.sin(rot-1)*r*0.5;
      if (Math.cos(rot-1) > -0.2) g.ellipse(mareX2, r*0.4, r*0.35, r*0.2).fill({ color: 0x888888, alpha: 1.0 });
      
      // Big bold craters
      crater(-r*0.4, -r*0.5, r*0.25, 0x666666, 0xDDDDDD);
      crater(r*0.6, 0, r*0.2, 0x666666, 0xDDDDDD);
      crater(-r*0.1, r*0.6, r*0.15, 0x666666, 0xDDDDDD);
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 2) {
      // ═══ L2: MERCURY ═══
      // Base is brownish grey. Draw blazing thick lava cracks
      const pulse = 0.7 + Math.sin(time*5)*0.3 + (phys.squashY < 0.9 ? 1 : 0);
      g.moveTo(Math.sin(rot)*r, -r*0.5).quadraticCurveTo(Math.sin(rot+1)*r*0.1, 0, Math.sin(rot+2)*r*0.8, r*0.5)
       .stroke({ color: 0xFF2200, width: r*0.15, alpha: 1.0, cap: 'round' });
      g.moveTo(Math.sin(rot)*r, -r*0.5).quadraticCurveTo(Math.sin(rot+1)*r*0.1, 0, Math.sin(rot+2)*r*0.8, r*0.5)
       .stroke({ color: 0xFFDD00, width: r*0.06, alpha: Math.min(1.0, pulse), cap: 'round' });
       
      crater(-r*0.5, r*0.2, r*0.18, 0x5A4A3A, 0xAA9A8A);
      crater(r*0.3, -r*0.4, r*0.2, 0x5A4A3A, 0xAA9A8A);
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 3) {
      // ═══ L3: VENUS ═══
      // Base is dense orange/yellow. Draw THICK opaque swirling atmosphere bands.
      const bandStrokes = [{y:-r*0.5, c:0xFFDDBB, w:r*0.4, s:1.2}, {y:-r*0.1, c:0xCC8833, w:r*0.3, s:0.8}, {y:r*0.3, c:0xFFCC77, w:r*0.4, s:1.5}, {y:r*0.7, c:0xAA5522, w:r*0.3, s:1.0}];
      for (const b of bandStrokes) {
        const wave = Math.sin(rot*b.s) * r*0.15;
        g.moveTo(-r*1.1, b.y-wave).quadraticCurveTo(0, b.y+wave*2, r*1.1, b.y-wave)
         .stroke({ color: b.c, width: b.w, alpha: 1.0, cap: 'round' });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 4) {
      // ═══ L4: EARTH ═══
      // Base is ocean blue. Draw THICK OPAQUE green continents.
      const drawContinent = (cx: number, cy: number, size: number) => {
        const ax = Math.sin(rot + cx) * r * 0.8;
        if (Math.cos(rot + cx) > -0.2) {
          const sc = Math.abs(Math.cos(rot + cx));
          g.ellipse(ax, cy, size * sc, size * 0.8).fill({ color: 0x33AA33, alpha: 1.0 }); // Solid Green
          // Sand outline
          g.ellipse(ax, cy, size * sc, size * 0.8).stroke({ color: 0xDDCC88, width: r*0.05, alpha: 1.0 });
        }
      };
      drawContinent(0, -r*0.2, r*0.4);
      drawContinent(2, r*0.3, r*0.35);
      
      // OPAQUE White polar caps
      g.ellipse(0, -r*0.9, r*0.5, r*0.25).fill({ color: 0xFFFFFF, alpha: 1.0 });
      g.ellipse(0, r*0.9, r*0.5, r*0.25).fill({ color: 0xFFFFFF, alpha: 1.0 });

      // Solid white clouds sweeping across
      g.moveTo(-r, -r*0.3).lineTo(Math.sin(rot*1.5)*r, -r*0.35).stroke({ color: 0xFFFFFF, width: r*0.1, alpha: 0.9, cap: 'round' });
      g.moveTo(Math.sin(rot*1.5 + 2)*r, r*0.2).lineTo(r, r*0.15).stroke({ color: 0xFFFFFF, width: r*0.15, alpha: 0.9, cap: 'round' });

      // Slowly rotating atmosphere haze (barely visible white overlay requested by user)
      const atmosRot = time * 0.15; // very slow rotation
      for (let i = 0; i < 5; i++) {
        const aa = atmosRot + i * Math.PI * 2 / 5;
        const ax = Math.cos(aa) * r * 0.45;
        const ay = Math.sin(aa) * r * 0.35;
        g.ellipse(ax, ay, r * 0.55, r * 0.35).fill({ color: 0xFFFFFF, alpha: 0.05 });
      }
      // Thin atmosphere rim
      g.circle(0, 0, r * 0.98).stroke({ color: 0x88CCFF, alpha: 0.1, width: r * 0.06 });

      // Moon orbiting
      const ma = time * 1.5;
      if (Math.sin(ma) > 0) {
        g.circle(Math.cos(ma)*r*1.3, Math.sin(ma)*r*0.2, r*0.15).fill({ color: 0xCCCCCC, alpha: 1.0 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 5) {
      // ═══ L5: MARS ═══
      // Base is rusty red. Draw dark red canyon and dark terrain
      g.circle(Math.sin(rot+1.5)*r*0.4, -r*0.3, r*0.35).fill({ color: 0x992211, alpha: 1.0 });
      
      // Big deep canyon (Valles Marineris)
      const tx = Math.sin(rot)*r*0.7;
      if (Math.cos(rot) > 0) {
        g.moveTo(tx - r*0.5, 0).quadraticCurveTo(tx, r*0.2, tx + r*0.4, -r*0.1)
         .stroke({ color: 0x661100, width: r*0.15, alpha: 1.0, cap: 'round' });
      }
      // Opaque Polar cap
      g.ellipse(0, -r*0.9, r*0.4, r*0.2).fill({ color: 0xFFFFFF, alpha: 1.0 });
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 6) {
      // ═══ L6: JUPITER ═══
      // Base is tan. Draw solid massive alternating brown/white bands
      g.moveTo(-r, -r*0.6).lineTo(r, -r*0.6).stroke({ color: 0xFFFFFF, width: r*0.25, alpha: 0.9 });
      g.moveTo(-r, -r*0.2).lineTo(r, -r*0.2).stroke({ color: 0x884422, width: r*0.3, alpha: 1.0 });
      g.moveTo(-r, r*0.3).lineTo(r, r*0.3).stroke({ color: 0xFFFFFF, width: r*0.2, alpha: 0.8 });
      g.moveTo(-r, r*0.7).lineTo(r, r*0.7).stroke({ color: 0x995533, width: r*0.25, alpha: 1.0 });

      // Giant Red Spot (Bold and Opaque)
      const spotX = Math.sin(rot*1.5)*r*0.6;
      if (Math.cos(rot*1.5) > -0.2) {
        g.ellipse(spotX, -r*0.2, r*0.3*Math.abs(Math.cos(rot*1.5)), r*0.2).fill({ color: 0xAA2200, alpha: 1.0 });
        g.ellipse(spotX, -r*0.2, r*0.15*Math.abs(Math.cos(rot*1.5)), r*0.1).fill({ color: 0xFF7755, alpha: 1.0 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, r*0.1, exp);

    } else if (level === 7) {
      // ═══ L7: SATURN ═══
      // Base is pale gold. Draw solid yellow bands.
      g.moveTo(-r, -r*0.4).lineTo(r, -r*0.4).stroke({ color: 0xFFEEAA, width: r*0.3, alpha: 1.0 });
      g.moveTo(-r, r*0.2).lineTo(r, r*0.2).stroke({ color: 0xCCAA77, width: r*0.2, alpha: 1.0 });

      // BOLD OPAQUE RINGS
      const tiltY = r*0.3;
      // Back rings
      g.ellipse(0, 0, r*1.8, tiltY).stroke({ color: 0xFFDD99, width: r*0.15, alpha: 1.0 });
      g.ellipse(0, 0, r*1.4, tiltY*0.75).stroke({ color: 0xFFFFFF, width: r*0.1, alpha: 1.0 });

      // Front rings
      g.ellipse(0, r*0.1, r*1.85, tiltY).stroke({ color: 0xFFDD99, width: r*0.15, alpha: 1.0 });
      
      SpriteGenerator.drawKawaiiFace(faceCtx, r, -r*0.1, exp);

    } else if (level === 8) {
      // ═══ L8: URANUS ═══
      // Base is cyan. Tilted vertical ring system!
      // Very faint cloud bands
      g.moveTo(-r, -r*0.4).lineTo(r, -r*0.6).stroke({ color: 0xCCFFFF, width: r*0.2, alpha: 0.3 });
      
      const tiltX = r*0.2;
      // Back rings
      g.ellipse(0, 0, tiltX, r*1.7).stroke({ color: 0xDDFFFF, width: r*0.05, alpha: 0.8 });
      g.ellipse(0, 0, tiltX*0.7, r*1.4).stroke({ color: 0xFFFFFF, width: r*0.03, alpha: 0.5 });
      // Front rings overlay
      g.ellipse(r*0.1, 0, tiltX, r*1.75).stroke({ color: 0xDDFFFF, width: r*0.05, alpha: 0.9 });

      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 9) {
      // ═══ L9: NEPTUNE ═══
      // Base is deep blue. Fast white cirrus clouds & Great Dark Spot.
      const nt = rot * 2.5; // Fast winds
      g.moveTo(-r, -r*0.4).lineTo(Math.sin(nt)*r, -r*0.45).stroke({ color: 0xFFFFFF, width: r*0.08, alpha: 0.9, cap: 'round' });
      g.moveTo(Math.sin(nt+2)*r, r*0.3).lineTo(r, r*0.2).stroke({ color: 0xFFFFFF, width: r*0.1, alpha: 0.9, cap: 'round' });
      g.moveTo(Math.sin(nt+4)*r*0.5, r*0.6).lineTo(r*0.8, r*0.5).stroke({ color: 0xFFFFFF, width: r*0.05, alpha: 0.9, cap: 'round' });

      // Great Dark Spot
      const dsX = Math.sin(rot)*r*0.6;
      if (Math.cos(rot) > -0.2) {
        g.ellipse(dsX, 0, r*0.25*Math.abs(Math.cos(rot)), r*0.15).fill({ color: 0x002288, alpha: 1.0 });
      }
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 10) {
      // ═══ L10: SUN ═══
      // Base is burning orange. Blinding solid core and massive flares.
      g.circle(0,0, r*0.8).fill({ color: 0xFFCC00, alpha: 1.0 });
      g.circle(0,0, r*0.5).fill({ color: 0xFFFFFF, alpha: 1.0 });
      
      // Giant flame spikes
      for(let i=0; i<8; i++) {
        const ang = rot + i * Math.PI*2/8;
        const outR = r * (1.2 + Math.sin(time*5 + i)*0.3);
        g.moveTo(Math.cos(ang-0.2)*r, Math.sin(ang-0.2)*r)
         .lineTo(Math.cos(ang)*outR, Math.sin(ang)*outR)
         .lineTo(Math.cos(ang+0.2)*r, Math.sin(ang+0.2)*r)
         .fill({ color: 0xFF6600, alpha: 1.0 });
      }
      // Rotating sun spots
      if (Math.cos(rot*2) > 0) g.circle(Math.sin(rot*2)*r*0.5, -r*0.2, r*0.12).fill({ color: 0xCC3300, alpha: 1.0 });
      if (Math.cos(rot*2+2) > 0) g.circle(Math.sin(rot*2+2)*r*0.6, r*0.3, r*0.15).fill({ color: 0x992200, alpha: 1.0 });
      
      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);

    } else if (level === 11) {
      // ═══ L11: BLACK HOLE ═══
      // Base is deep purple. Solid black event horizon core.
      g.circle(0,0, r*0.85).fill({ color: 0x000000, alpha: 1.0 });
      // Bright white/purple photon ring
      g.circle(0,0, r*0.9).stroke({ color: 0xFFFFFF, width: r*0.06, alpha: 1.0 });
      // Solid bright accretion disk
      g.ellipse(0,0, r*1.6, r*0.4).stroke({ color: 0xBB00FF, width: r*0.2, alpha: 1.0 });
      g.ellipse(0,0, r*1.4, r*0.25).stroke({ color: 0x00FFFF, width: r*0.1, alpha: 1.0 });
      g.ellipse(0,0, r*1.2, r*0.15).stroke({ color: 0xFFFFFF, width: r*0.05, alpha: 1.0 });

      // Solid Jets
      g.moveTo(-r*0.1, -r*0.9).lineTo(r*0.1, -r*0.9).lineTo(0, -r*2.2).fill({ color: 0xFF00FF, alpha: 0.9 });
      g.moveTo(-r*0.1, r*0.9).lineTo(r*0.1, r*0.9).lineTo(0, r*2.2).fill({ color: 0xFF00FF, alpha: 0.9 });

      SpriteGenerator.drawKawaiiFace(faceCtx, r, 0, exp);
    }
  }
}
