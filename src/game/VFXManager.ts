import { Container, Graphics } from 'pixi.js';

export class VFXManager {
  public static spawnMergeFX(level: number, radius: number, theme: string, color: number): Container {
    const container = new Container();
    
    // Base splash for all merges
    const particleCount = 10 + Math.min(level, 10);
    for (let i = 0; i < particleCount; i++) {
        const p = new Graphics();
        p.circle(0, 0, radius * (0.05 + Math.random() * 0.08)).fill({ color });
        const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
        const speed = radius * 0.1 * (1 + Math.random() * 1.5);
        container.addChild(p);
        (p as any).vx = Math.cos(angle) * speed;
        (p as any).vy = Math.sin(angle) * speed;
    }

    if (theme === 'food') {
      // Sweets & Crumbs
      for (let i = 0; i < 15; i++) {
        const crumb = new Graphics();
        crumb.rect(-radius*0.04, -radius*0.04, radius*0.08, radius*0.08).fill({ color: 0xFFD700 }); 
        const a = Math.random() * Math.PI*2;
        const s = radius*0.2 * Math.random();
        container.addChild(crumb);
        (crumb as any).vx = Math.cos(a)*s;
        (crumb as any).vy = Math.sin(a)*s - radius*0.1;
        (crumb as any).isCrumb = true; // Gravity
      }
    } else if (theme === 'animal' || theme === 'golden') {
       // Stars & Fluffs
       for (let i = 0; i < 8; i++) {
         const star = new Graphics();
         this.drawStar(star, 0,0, 4, radius*0.15, radius*0.05, 0xFFFFFF);
         const a = Math.random() * Math.PI*2;
         const s = radius*0.18 * Math.random();
         container.addChild(star);
         (star as any).vx = Math.cos(a)*s;
         (star as any).vy = Math.sin(a)*s - radius*0.15;
       }
    } else if (theme === 'planet' || theme === 'crystal' || theme === 'neon') {
       // High-energy sparks
       for(let i=0; i<15; i++) {
         const spark = new Graphics();
         spark.moveTo(0,-radius*0.15).lineTo(radius*0.05,0).lineTo(0,radius*0.15).lineTo(-radius*0.05,0).fill({ color: 0x66FFFF });
         spark.blendMode = 'add';
         const a = Math.random() * Math.PI*2;
         const s = radius*0.25 * Math.random();
         container.addChild(spark);
         (spark as any).vx = Math.cos(a)*s;
         (spark as any).vy = Math.sin(a)*s;
       }
    } else if (theme === 'spooky') {
       // Ghost wisps — float upward and fade
       for (let i = 0; i < 10; i++) {
         const wisp = new Graphics();
         wisp.circle(0, 0, radius * (0.06 + Math.random() * 0.06)).fill({ color: 0xFFFFFF, alpha: 0.8 });
         wisp.circle(radius*0.03, -radius*0.02, radius*0.02).fill({ color: 0x000000 }); // tiny eye
         const a = Math.random() * Math.PI * 2;
         const s = radius * 0.12 * Math.random();
         container.addChild(wisp);
         (wisp as any).vx = Math.cos(a) * s;
         (wisp as any).vy = Math.sin(a) * s - radius * 0.2; // float up
       }
    } else if (theme === 'winter') {
       // Ice crystal shards with gravity
       for (let i = 0; i < 12; i++) {
         const shard = new Graphics();
         const sz = radius * (0.08 + Math.random() * 0.08);
         // Snowflake-like cross shape
         shard.moveTo(0, -sz).lineTo(0, sz).stroke({ color: 0xCCEEFF, width: 2 });
         shard.moveTo(-sz, 0).lineTo(sz, 0).stroke({ color: 0xCCEEFF, width: 2 });
         shard.moveTo(-sz*0.7, -sz*0.7).lineTo(sz*0.7, sz*0.7).stroke({ color: 0xAADDFF, width: 1 });
         const a = Math.random() * Math.PI * 2;
         const s = radius * 0.15 * Math.random();
         container.addChild(shard);
         (shard as any).vx = Math.cos(a) * s;
         (shard as any).vy = Math.sin(a) * s - radius * 0.08;
         (shard as any).isCrumb = true; // gravity
       }
    } else if (theme === 'sport') {
       // Bouncing mini-balls
       for (let i = 0; i < 8; i++) {
         const ball = new Graphics();
         const ballColors = [0xFF4400, 0xFFFFFF, 0xFFBA33, 0x33CC33, 0x000000];
         ball.circle(0, 0, radius * 0.08).fill({ color: ballColors[i % ballColors.length] });
         ball.circle(0, 0, radius * 0.08).stroke({ color: 0x000000, width: 1, alpha: 0.3 });
         const a = Math.random() * Math.PI * 2;
         const s = radius * 0.2 * Math.random();
         container.addChild(ball);
         (ball as any).vx = Math.cos(a) * s;
         (ball as any).vy = Math.sin(a) * s - radius * 0.15;
         (ball as any).isCrumb = true; // bouncing with gravity
       }
    } else if (theme === 'meme') {
       // Rainbow emoji squares
       const emojiColors = [0xFF3366, 0xFF9900, 0xFFFF00, 0x33FF33, 0x3399FF, 0x9933FF];
       for (let i = 0; i < 10; i++) {
         const emoji = new Graphics();
         const sz = radius * 0.1;
         emoji.roundRect(-sz/2, -sz/2, sz, sz, sz*0.2).fill({ color: emojiColors[i % emojiColors.length] });
         const a = Math.random() * Math.PI * 2;
         const s = radius * 0.2 * Math.random();
         container.addChild(emoji);
         (emoji as any).vx = Math.cos(a) * s;
         (emoji as any).vy = Math.sin(a) * s - radius * 0.12;
       }
    }

    // Self-animating loop
    const startTime = performance.now();
    const duration = 400 + Math.random() * 200; // 400-600ms
    
    const animate = () => {
      if (container.destroyed) return;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      for(let i=0; i<container.children.length; i++) {
         const child = container.children[i] as Graphics;
         if ((child as any).vx !== undefined) {
           child.x += (child as any).vx;
           child.y += (child as any).vy;
           if ((child as any).isCrumb) {
             (child as any).vy += 0.4; // gravity
             child.rotation += 0.15;
           } else {
             // Friction
             (child as any).vx *= 0.95;
             (child as any).vy *= 0.95;
           }
           const easeOutProgress = progress * (2 - progress);
           child.alpha = Math.max(0, 1 - easeOutProgress);
           child.scale.set(Math.max(0, 1 - easeOutProgress * 1.2));
         }
      }
      
      if (progress < 1) {
         requestAnimationFrame(animate);
      } else {
         container.destroy({ children: true });
      }
    };
    requestAnimationFrame(animate);
    
    return container;
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
