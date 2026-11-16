import { useEffect, useRef } from 'react';

/*
  NeonReveal
  A neon tube along one edge flickers on, then its light travels across the
  component and reveals what's inside. Click (anywhere but a link or button)
  to cut the light and run it again.

  Written for glenncahill.com. Draws to a 2D canvas, no dependencies.

  <NeonReveal client:visible direction="down">
    <h2>Anything goes in here</h2>
  </NeonReveal>
*/

const BRAND = ['#372cff', '#b02fff', '#ff4fff'];

const MASK_DIR = { down: 'to bottom', up: 'to top', right: 'to right', left: 'to left' };

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// A neon tube doesn't fade up, it stutters: a few hard on/off steps, then holds.
function makeFlicker() {
  const keys = [[0, 0]];
  let t = 0;
  const steps = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < steps; i++) {
    t += 40 + Math.random() * 90;
    keys.push([t, 0.45 + Math.random() * 0.55]);
    t += 30 + Math.random() * 90;
    keys.push([t, Math.random() * 0.2]);
  }
  t += 70;
  keys.push([t, 1]);
  return keys;
}

function sampleSteps(keys, e) {
  let v = 0;
  for (const [t, b] of keys) {
    if (t > e) break;
    v = b;
  }
  return v;
}

export default function NeonReveal({
  children,
  colors = BRAND,
  direction = 'down', // which way the light travels
  trigger = 'inView', // 'inView' | 'mount'
  threshold = 0.35, // share of the component on screen before it plays
  delay = 150, // ms before the first flicker
  duration = 2200, // ms for the light to cross the component
  thickness = 3, // tube thickness in px
  length = 1, // tube length as a share of the edge
  inset = 6, // gap between the edge and the tube, px
  glow = 1, // bloom strength
  reach = 0.85, // how far the light spill travels, share of the depth
  feather = 0.22, // softness of the reveal edge, share of the depth
  hum = true, // faint flutter and the odd dip once lit
  interactive = true, // click to re-ignite
  maxDpr = 2,
  className = '',
  style,
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const colorKey = colors.join(',');

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const content = contentRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      content.style.setProperty('--nr-a', '100%');
      content.style.setProperty('--nr-b', '200%');
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = {
      phase: 'off', // off | ignite | reveal | lit | cut
      start: 0,
      flicker: [],
      igniteDur: 0,
      progress: 0,
      cutFrom: 0,
      nextDip: 0,
      dipUntil: 0,
    };
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let onScreen = false;
    let played = false;

    const setReveal = (p) => {
      const front = p * (1 + feather);
      content.style.setProperty('--nr-a', `${(front - feather) * 100}%`);
      content.style.setProperty('--nr-b', `${front * 100}%`);
    };

    const draw = (bright, len, p, now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!W || !H) return;

      // Work in a frame where the tube runs along the top and light goes down.
      let L = W;
      let D = H;
      if (direction === 'up') {
        ctx.translate(W, H);
        ctx.rotate(Math.PI);
      } else if (direction === 'left') {
        ctx.translate(W, 0);
        ctx.rotate(Math.PI / 2);
        L = H;
        D = W;
      } else if (direction === 'right') {
        ctx.translate(0, H);
        ctx.rotate(-Math.PI / 2);
        L = H;
        D = W;
      }

      const ty = inset + thickness * 1.5;
      const pad = thickness * 3;
      const fullHalf = (L / 2 - pad) * length;
      const half = fullHalf * len;
      const x0 = L / 2 - half;
      const x1 = L / 2 + half;

      const along = ctx.createLinearGradient(L / 2 - fullHalf, 0, L / 2 + fullHalf, 0);
      colors.forEach((c, i) => along.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));

      ctx.lineCap = 'round';

      // the unlit glass, always there
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = along;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(L / 2 - fullHalf, ty);
      ctx.lineTo(L / 2 + fullHalf, ty);
      ctx.stroke();

      if (bright <= 0.002 || len <= 0) {
        ctx.globalAlpha = 1;
        return;
      }

      // Light spilling onto the content. Painted first, then shaped with two
      // alpha masks (fade with depth, fade past the tube ends). The glass above
      // is redrawn afterwards because the masks wipe it.
      const depth = D * reach * Math.min(1, 0.06 + p);
      const spread = Math.min(L * 0.12, D * 0.25);
      ctx.globalAlpha = Math.min(1, 0.5 * bright * glow);
      ctx.fillStyle = along;
      ctx.fillRect(x0 - spread, ty, x1 - x0 + spread * 2, depth);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-in';
      const fall = ctx.createLinearGradient(0, ty, 0, ty + depth);
      fall.addColorStop(0, 'rgba(0,0,0,1)');
      fall.addColorStop(0.25, 'rgba(0,0,0,0.35)');
      fall.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fall;
      ctx.fillRect(0, 0, L, D);
      const ends = ctx.createLinearGradient(x0 - spread, 0, x1 + spread, 0);
      const e = Math.min(0.45, spread / Math.max(1, x1 - x0 + spread * 2));
      ends.addColorStop(0, 'rgba(0,0,0,0)');
      ends.addColorStop(e, 'rgba(0,0,0,1)');
      ends.addColorStop(1 - e, 'rgba(0,0,0,1)');
      ends.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ends;
      ctx.fillRect(0, 0, L, D);
      ctx.globalCompositeOperation = 'source-over';

      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = along;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(L / 2 - fullHalf, ty);
      ctx.lineTo(L / 2 + fullHalf, ty);
      ctx.stroke();

      // a faint line riding the reveal edge while the light travels
      if (s.phase === 'reveal' && p < 1) {
        const fy = (p * (1 + feather) - feather / 2) * D;
        if (fy > ty) {
          ctx.globalAlpha = 0.45 * Math.sin(Math.PI * p) * bright;
          ctx.strokeStyle = along;
          ctx.lineWidth = 1;
          ctx.shadowColor = colors[Math.floor(colors.length / 2)];
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.moveTo(x0, fy);
          ctx.lineTo(x1, fy);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // the tube itself: wide bloom, tighter glow, coloured body, hot core
      ctx.beginPath();
      ctx.moveTo(x0, ty);
      ctx.lineTo(x1, ty);
      ctx.strokeStyle = along;
      ctx.globalAlpha = Math.min(1, 0.1 * bright * glow);
      ctx.lineWidth = thickness * 12;
      ctx.stroke();
      ctx.globalAlpha = Math.min(1, 0.24 * bright * glow);
      ctx.lineWidth = thickness * 5;
      ctx.stroke();
      ctx.globalAlpha = Math.min(1, 0.95 * bright);
      ctx.lineWidth = thickness * 1.5;
      ctx.shadowColor = colors[Math.floor(colors.length / 2)];
      ctx.shadowBlur = 16 * glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.min(1, 0.8 * bright);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(1, thickness * 0.45);
      ctx.stroke();

      ctx.globalAlpha = 1;
    };

    const humAt = (now) => {
      if (!hum) return 1;
      if (now > s.nextDip) {
        s.dipUntil = now + 50 + Math.random() * 110;
        s.nextDip = now + 5000 + Math.random() * 9000;
      }
      if (now < s.dipUntil) return Math.random() < 0.5 ? 0.3 : 0.75;
      return 0.94 + 0.035 * Math.sin(now / 70) + 0.02 * Math.sin(now / 23);
    };

    const frame = (now) => {
      raf = 0;
      let bright = 0;
      let len = 0;
      let p = s.progress;

      if (s.phase === 'ignite') {
        const e = now - s.start;
        if (e >= 0) {
          bright = sampleSteps(s.flicker, e);
          len = easeOutCubic(Math.min(1, e / 380));
          if (e >= s.igniteDur) {
            s.phase = 'reveal';
            s.start = now;
          }
        }
        p = 0;
      } else if (s.phase === 'reveal') {
        const x = Math.min(1, (now - s.start) / duration);
        p = easeInOutCubic(x);
        bright = humAt(now);
        len = 1;
        if (x >= 1) {
          s.phase = 'lit';
          s.nextDip = now + 3000 + Math.random() * 5000;
        }
      } else if (s.phase === 'lit') {
        p = 1;
        bright = humAt(now);
        len = 1;
      } else if (s.phase === 'cut') {
        const e = now - s.start;
        p = s.cutFrom * (1 - easeOutCubic(Math.min(1, e / 240)));
        bright = e < 40 ? 0.5 : 0;
        len = 1;
        if (e >= 300) ignite(now, 0);
      }

      s.progress = p;
      setReveal(p);
      draw(bright, len, p, now);

      const settled = s.phase === 'lit' && !hum;
      if (onScreen && !settled && s.phase !== 'off') raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    function ignite(now, wait) {
      s.phase = 'ignite';
      s.start = now + wait;
      s.flicker = makeFlicker();
      s.igniteDur = s.flicker[s.flicker.length - 1][0];
      s.progress = 0;
    }

    const play = () => {
      played = true;
      if (reduce) {
        s.phase = 'lit';
        s.progress = 1;
        setReveal(1);
        draw(1, 1, 1, 0);
        return;
      }
      ignite(performance.now(), delay);
      kick();
    };

    const resize = () => {
      const r = root.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      if (reduce || s.phase === 'off' || !onScreen) {
        const lit = s.phase === 'lit';
        draw(lit ? 1 : 0, lit ? 1 : 0, s.progress, 0);
      } else kick();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(root);

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !played && (trigger === 'mount' || entry.intersectionRatio >= threshold)) play();
        else if (onScreen && played && !reduce) kick();
      },
      { threshold: [0, threshold] },
    );
    io.observe(root);

    const onClick = (ev) => {
      if (!interactive || !played) return;
      if (ev.target.closest('a, button, input, textarea, select, label, summary, [role="button"]')) return;
      if (reduce) return;
      const now = performance.now();
      if (s.phase === 'ignite' || s.phase === 'cut') {
        // mid-ignition: just make it stutter again
        s.flicker = makeFlicker();
        s.start = now;
        s.igniteDur = s.flicker[s.flicker.length - 1][0];
        s.phase = 'ignite';
      } else {
        s.phase = 'cut';
        s.start = now;
        s.cutFrom = s.progress;
      }
      kick();
    };
    root.addEventListener('click', onClick);

    if (trigger === 'mount') {
      onScreen = true;
      play();
    }

    return () => {
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('click', onClick);
      if (raf) cancelAnimationFrame(raf);
    };
    // colors is compared by value through colorKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, direction, trigger, threshold, delay, duration, thickness, length, inset, glow, reach, feather, hum, interactive, maxDpr]);

  const maskDir = MASK_DIR[direction] || MASK_DIR.down;
  const mask = `linear-gradient(${maskDir}, #000 var(--nr-a), transparent var(--nr-b))`;

  return (
    <div
      ref={rootRef}
      className={`neon-reveal ${className}`.trim()}
      style={{ position: 'relative', isolation: 'isolate', cursor: interactive ? 'pointer' : undefined, ...style }}
    >
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 0,
          '--nr-a': `${-feather * 100}%`,
          '--nr-b': '0%',
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
