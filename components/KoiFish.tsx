"use client";
import { useEffect, useRef, useState } from "react";

/* ----------------------------------------------------------------
   KoiFish — procedural koi on a follow-the-leader spine chain,
   viewed top-down like looking over a bridge into a stream.

   The HEAD leads along a gently snaking path (drift + scroll). Each
   body joint chases the joint ahead at a fixed link distance, with
   an ANGLE CONSTRAINT so the body bends smoothly but never folds
   over itself. The undulation emerges from motion, so the tail and
   the trailing fins lag and sway like a real swimming fish.

   Detail tuned to read as a watercolor/ink koi illustration:
   flowing translucent pectoral/pelvic/caudal fins with rays, inked
   gradient patches, faint scales, gill lines, and tiny edge eyes.

   TUNING (top constants):
   - WIGGLE_AMP / WIGGLE_FREQ : how hard the head snakes.
   - SWIM_SPEED               : head responsiveness.
   - MAX_BEND                 : per-joint bend limit (lower = stiffer).
   - SCALE                    : overall size.
------------------------------------------------------------------ */

const N = 15;
const LINK = 12;
const SCALE = 1.0;
const WIGGLE_AMP = 24;
const WIGGLE_FREQ = 1.2;
const SWIM_SPEED = 0.09;
const MAX_BEND = 0.30;

const HALF_W = [10, 13, 15, 16, 16, 15.5, 14.5, 13, 11.5, 10, 8.5, 7, 5.5, 4, 2.5].map(
  (w) => w * SCALE
);

interface Pt { x: number; y: number; }

function norm(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export default function KoiFish({ immersive = false }: { immersive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(false);
  const immersiveRef = useRef(immersive);

  useEffect(() => { immersiveRef.current = immersive; }, [immersive]);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pageH = document.documentElement.scrollHeight; // full document height (the "river" length)
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pageH = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const joints: Pt[] = [];
    for (let i = 0; i < N; i++) {
      joints.push({ x: window.innerWidth - 80, y: 250 + i * LINK });
    }

    let scrollY = window.scrollY;
    let targetScrollY = scrollY;
    let time = 0;          // real seconds (spawn timers)
    let swimPhase = 0;     // swim cycle — advances faster with energy
    let energy = 0;        // 0 = gliding, 1 = vigorous (scroll-driven)
    let idleTimer = 99;    // seconds since last scroll
    let lastTargetScrollY = scrollY;
    let loopBlend = 0;     // 0 = follow scroll, 1 = lazy loop
    let loopAngle = 0;
    let lastRipple = 0;
    let raf = 0;
    const ripples: { x: number; y: number; r: number; a: number; ang: number }[] = [];
    const bubbles: { x: number; y: number; r: number; a: number; vy: number; vx: number }[] = [];
    let lastBubble = 0;

    // ===== immersive (pond) layer — top-down, both margins =====
    let immersiveAmt = 0;
    const rnd = (s: number) => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
    const SIDES = [0, 1]; // 0 = left margin, 1 = right margin

    // small-koi top-down patterns (varied so they aren't copy-paste)
    const KOI_PATTERNS = [
      { base: ["#fdf7ee", "#e9dccb"], blobs: [{ t: 0.22, s: -0.4, r: 0.55, c: "#cf3d17" }, { t: 0.5, s: 0.4, r: 0.5, c: "#c8390f" }, { t: 0.72, s: -0.2, r: 0.4, c: "#1d130a" }] }, // sanke
      { base: ["#fdf7ee", "#e9dccb"], blobs: [{ t: 0.3, s: 0.25, r: 0.62, c: "#d2401a" }, { t: 0.62, s: -0.3, r: 0.5, c: "#dd5520" }] }, // kohaku
      { base: ["#f2a23a", "#c2540f"], blobs: [{ t: 0.45, s: 0.0, r: 0.42, c: "#7c3408" }] }, // ogon
      { base: ["#fdf7ee", "#e3d8c6"], blobs: [{ t: 0.26, s: -0.25, r: 0.46, c: "#1d130a" }, { t: 0.55, s: 0.32, r: 0.4, c: "#1d130a" }, { t: 0.78, s: -0.12, r: 0.34, c: "#d2401a" }] }, // showa
      { base: ["#fbf6ed", "#e6dccb"], blobs: [{ t: 0.35, s: -0.2, r: 0.4, c: "#1d130a" }, { t: 0.6, s: 0.25, r: 0.32, c: "#1d130a" }] }, // bekko
    ];

    // elements use `wy` = position along the full document (0..1), so the
    // pond scrolls with the page like a river you travel down.
    const smallKoi = SIDES.flatMap((side) =>
      Array.from({ length: 8 }, (_, i) => {
        const seed = side * 13 + i * 3 + 1;
        return {
          side, fx: 0.28 + rnd(seed) * 0.44, wy: (i + 0.5 + (rnd(seed + 1) - 0.5) * 0.8) / 8,
          baseHeading: rnd(seed + 2) * Math.PI * 2, scale: 0.6 + rnd(seed + 4) * 0.45,
          phase: rnd(seed + 5) * Math.PI * 2, bobPhase: rnd(seed + 6) * Math.PI * 2,
          turnRange: 0.4 + rnd(seed + 7) * 0.4, turnSpd: 0.1 + rnd(seed + 8) * 0.12,
          pattern: KOI_PATTERNS[(side * 3 + i) % KOI_PATTERNS.length],
        };
      })
    );

    const lilyPads = SIDES.flatMap((side) =>
      Array.from({ length: 20 }, (_, i) => {
        const seed = side * 21 + i * 5 + 2;
        return { side, fx: 0.18 + rnd(seed) * 0.64, wy: (i + (rnd(seed + 1) - 0.5) * 0.95) / 20, r: 20 + rnd(seed + 2) * 24, phase: rnd(seed + 3) * 6.28, spd: 0.1 + rnd(seed + 4) * 0.1, notch: rnd(seed + 5) * 6.28, flower: i % 4 === 1 };
      })
    );

    // submerged cobble bed scattered across the riverbed (seen through clear water)
    const pebbles = SIDES.flatMap((side) =>
      Array.from({ length: 16 }, (_, i) => {
        const seed = side * 51 + i * 9 + 5;
        return { side, fx: 0.12 + rnd(seed) * 0.76, wy: (i + (rnd(seed + 1) - 0.5)) / 16, r: 26 + rnd(seed + 2) * 26, variant: i % 3 };
      })
    );

    // Riverbanks line BOTH edges of each water channel (screen side + content
    // side). Rocks are generated procedurally along the visible stretch of each
    // edge at tight world spacing so they overlap into a continuous, natural
    // rocky shore (rather than spaced-out individual rocks).
    const EDGES = [0, 1];


    const sparkles = SIDES.flatMap((side) =>
      Array.from({ length: 7 }, (_, i) => {
        const seed = side * 50 + i * 13 + 5;
        return { side, fx: rnd(seed), fy: rnd(seed + 1), size: 2.5 + rnd(seed + 2) * 4, phase: rnd(seed + 3) * 6.28, spd: 0.7 + rnd(seed + 4) * 1.3 };
      })
    );

    const caustics = SIDES.flatMap((side) =>
      Array.from({ length: 3 }, (_, i) => {
        const seed = side * 60 + i * 17 + 6;
        return { side, fy: 0.18 + rnd(seed) * 0.64, amp: 6 + rnd(seed + 1) * 9, phase: rnd(seed + 2) * 6.28, spd: 0.18 + rnd(seed + 3) * 0.2 };
      })
    );

    const petals: { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; a: number }[] = [];
    let lastPetal = 0;

    // ===== detailed SVG sprites for the motionless decor =====
    // (authored once as rich vector art, then drawn cheaply as images)
    const VB = 100;   // sprite viewBox
    const CR = 44;    // content radius within the viewBox
    const svgURI = (svg: string) => `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;

    const padSVG = () => {
      const c = 50, r = CR, notch = 0.32, a0 = notch, a1 = Math.PI * 2 - notch, steps = 44;
      let d = `M${c} ${c} `;
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * (i / steps);
        d += `L${(c + Math.cos(a) * r).toFixed(1)} ${(c + Math.sin(a) * r).toFixed(1)} `;
      }
      d += "Z";
      let veins = "";
      for (let v = 0; v < 8; v++) {
        const a = a0 + 0.18 + (a1 - a0 - 0.36) * (v / 7);
        const ex = c + Math.cos(a) * r * 0.9, ey = c + Math.sin(a) * r * 0.9;
        const qx = c + Math.cos(a + 0.12) * r * 0.5, qy = c + Math.sin(a + 0.12) * r * 0.5;
        veins += `<path d="M${c} ${c} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#1d3f25" stroke-width="1" opacity="0.4"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><defs><radialGradient id="pg" cx="40%" cy="36%" r="64%"><stop offset="0%" stop-color="#80c473"/><stop offset="55%" stop-color="#4e9a55"/><stop offset="100%" stop-color="#2b6036"/></radialGradient></defs><path d="${d}" fill="url(#pg)" stroke="#7c4a2b" stroke-width="2.2"/>${veins}<ellipse cx="38" cy="36" rx="15" ry="7" fill="#aed694" opacity="0.4" transform="rotate(-35 38 36)"/></svg>`;
    };

    const lotusSVG = () => {
      let petalsStr = "";
      const ring = (count: number, len: number, wid: number, rot: number, grad: string) => {
        for (let i = 0; i < count; i++) {
          const ang = rot + (i * 360) / count;
          petalsStr += `<path d="M0 0 Q${wid} ${-len * 0.55} 0 ${-len} Q${-wid} ${-len * 0.55} 0 0 Z" fill="url(#${grad})" stroke="#ce7896" stroke-width="0.5" transform="rotate(${ang.toFixed(1)})"/>`;
        }
      };
      ring(8, 42, 13, 0, "lo1");
      ring(6, 29, 10, 24, "lo2");
      let dots = "";
      for (let d = 0; d < 7; d++) { const a = (d * 2 * Math.PI) / 7; dots += `<circle cx="${(Math.cos(a) * 6).toFixed(1)}" cy="${(Math.sin(a) * 6).toFixed(1)}" r="2" fill="#d6962b"/>`; }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><defs><linearGradient id="lo1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e78eae"/><stop offset="1" stop-color="#f6c5d6"/></linearGradient><linearGradient id="lo2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ee9eba"/><stop offset="1" stop-color="#fad2e0"/></linearGradient></defs><g transform="translate(50 50)">${petalsStr}<circle r="9" fill="#f0ca60"/>${dots}</g></svg>`;
    };

    const ROCK_PALETTES = [
      { a: "#8a808e", b: "#625a68", c: "#3a3442", line: "#231d28", hi: "#b6aebc" }, // cool gray
      { a: "#7c7a82", b: "#56545e", c: "#33323a", line: "#1f1e26", hi: "#aab0b6" }, // dark slate
      { a: "#baa67e", b: "#8c794f", c: "#5c4d30", line: "#3a3018", hi: "#d8c79c" }, // warm sandstone
    ];
    const rockSVG = (seed: number, pal = 0) => {
      const c = 50, n = 10, P = ROCK_PALETTES[pal];
      const pts: Pt[] = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = CR * (0.74 + rnd(seed * 7 + k) * 0.4);
        pts.push({ x: c + Math.cos(a) * rr, y: c + Math.sin(a) * rr * 0.82 });
      }
      let d = `M${((pts[n - 1].x + pts[0].x) / 2).toFixed(1)} ${((pts[n - 1].y + pts[0].y) / 2).toFixed(1)} `;
      for (let k = 0; k < n; k++) { const p = pts[k], nx = pts[(k + 1) % n]; d += `Q${p.x.toFixed(1)} ${p.y.toFixed(1)} ${((p.x + nx.x) / 2).toFixed(1)} ${((p.y + nx.y) / 2).toFixed(1)} `; }
      d += "Z";
      let moss = "";
      for (let mo = 0; mo < 5; mo++) { const a = rnd(seed * 11 + mo) * 6.28, mr = rnd(seed * 11 + mo + 1) * CR * 0.6; moss += `<circle cx="${(c + Math.cos(a) * mr).toFixed(1)}" cy="${(c + Math.sin(a) * mr * 0.8 - 4).toFixed(1)}" r="${(1.4 + rnd(mo) * 1.8).toFixed(1)}" fill="#4c7838" opacity="0.45"/>`; }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><defs><linearGradient id="rg${seed}_${pal}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${P.a}"/><stop offset="0.5" stop-color="${P.b}"/><stop offset="1" stop-color="${P.c}"/></linearGradient></defs><path d="${d}" fill="url(#rg${seed}_${pal})" stroke="${P.line}" stroke-width="1.4"/><path d="M${(c - CR * 0.3).toFixed(1)} ${(c - CR * 0.2).toFixed(1)} L${(c + CR * 0.1).toFixed(1)} ${(c + CR * 0.3).toFixed(1)} L${(c + CR * 0.42).toFixed(1)} ${(c + CR * 0.05).toFixed(1)}" fill="none" stroke="${P.line}" stroke-width="0.9" opacity="0.5"/><ellipse cx="${(c - CR * 0.3).toFixed(1)}" cy="${(c - CR * 0.3).toFixed(1)}" rx="${(CR * 0.34).toFixed(1)}" ry="${(CR * 0.2).toFixed(1)}" fill="${P.hi}" opacity="0.3"/>${moss}</svg>`;
    };

    const grassSVG = () => {
      let blades = "";
      const n = 11;
      for (let b = 0; b < n; b++) {
        const a = (b / n) * Math.PI * 2;
        const len = CR * (0.7 + (b % 3) * 0.18);
        const px = -Math.sin(a), py = Math.cos(a), wide = 2.6;
        const tipx = Math.cos(a) * len, tipy = Math.sin(a) * len;
        const mx = Math.cos(a) * len * 0.5, my = Math.sin(a) * len * 0.5;
        blades += `<path d="M${(px * wide).toFixed(1)} ${(py * wide).toFixed(1)} Q${(mx + px * 1.2).toFixed(1)} ${(my + py * 1.2).toFixed(1)} ${tipx.toFixed(1)} ${tipy.toFixed(1)} Q${(mx - px * 1.2).toFixed(1)} ${(my - py * 1.2).toFixed(1)} ${(-px * wide).toFixed(1)} ${(-py * wide).toFixed(1)} Z" fill="url(#gg)"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><defs><linearGradient id="gg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#24501f"/><stop offset="1" stop-color="#5aab48"/></linearGradient></defs><g transform="translate(50 50)">${blades}</g></svg>`;
    };

    // a bed of submerged cobbles (seen through clear water)
    const pebbleSVG = (seed: number) => {
      let cob = "";
      for (let i = 0; i < 8; i++) {
        const a = rnd(seed * 3 + i) * 6.28, d = rnd(seed * 3 + i + 1) * 34;
        const cx2 = 50 + Math.cos(a) * d, cy2 = 50 + Math.sin(a) * d * 0.85;
        const rr = 8 + rnd(seed * 3 + i + 2) * 10;
        const tone = 78 + Math.floor(rnd(seed * 3 + i + 3) * 44);
        cob += `<ellipse cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr * 0.82).toFixed(1)}" fill="rgb(${tone - 32},${tone},${tone - 12})" stroke="rgba(28,44,38,0.45)" stroke-width="0.8"/>`;
        cob += `<ellipse cx="${(cx2 - rr * 0.25).toFixed(1)}" cy="${(cy2 - rr * 0.3).toFixed(1)}" rx="${(rr * 0.4).toFixed(1)}" ry="${(rr * 0.24).toFixed(1)}" fill="rgba(205,225,205,0.16)"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">${cob}</svg>`;
    };

    // a bamboo leaf sprig overhanging from the bank
    const bambooSVG = () => {
      let s = `<path d="M10 54 Q50 46 94 36" fill="none" stroke="#5c4a2e" stroke-width="2.2"/>`;
      const leaves: [number, number, number][] = [[28, 50, -0.5], [42, 47, 0.32], [56, 44, -0.42], [70, 41, 0.36], [84, 38, -0.22], [48, 49, 0.7], [62, 52, 0.95]];
      for (const [bx, by, a] of leaves) {
        const len = 26, wid = 5;
        const tx = bx + Math.cos(a) * len, ty = by + Math.sin(a) * len;
        const px = -Math.sin(a) * wid, py = Math.cos(a) * wid;
        s += `<path d="M${bx} ${by} Q${(bx + Math.cos(a) * len * 0.5 + px).toFixed(1)} ${(by + Math.sin(a) * len * 0.5 + py).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q${(bx + Math.cos(a) * len * 0.5 - px).toFixed(1)} ${(by + Math.sin(a) * len * 0.5 - py).toFixed(1)} ${bx} ${by} Z" fill="url(#blg)"/>`;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}"><defs><linearGradient id="blg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3e7e30"/><stop offset="1" stop-color="#86ca60"/></linearGradient></defs>${s}</svg>`;
    };

    const mkImg = (svg: string) => { const im = new Image(); im.src = svgURI(svg); return im; };
    const sprPad = mkImg(padSVG());
    const sprLotus = mkImg(lotusSVG());
    const sprRock = [
      mkImg(rockSVG(3, 0)), mkImg(rockSVG(8, 0)),
      mkImg(rockSVG(5, 1)), mkImg(rockSVG(12, 1)),
      mkImg(rockSVG(7, 2)), mkImg(rockSVG(14, 2)),
    ];
    const sprGrass = mkImg(grassSVG());
    const sprPebble = [mkImg(pebbleSVG(2)), mkImg(pebbleSVG(6)), mkImg(pebbleSVG(9))];
    const sprBamboo = mkImg(bambooSVG());

    // draw a sprite so its content radius (CR) maps to the requested radius R
    const drawSprite = (img: HTMLImageElement, x: number, y: number, R: number, rot: number, alpha: number) => {
      if (!img.complete || !img.naturalWidth) return;
      const size = R * 2 * (VB / (CR * 2));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    };

    const onScroll = () => { targetScrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll);

    const marginCenterX = () => {
      const rightEdge = window.innerWidth / 2 + 700 / 2 + 24;
      const marginW = window.innerWidth - rightEdge;
      if (marginW < 70) return -1;
      return rightEdge + marginW / 2;
    };

    // margins: [leftRect | null, rightRect | null]
    const getMargins = (): ({ x: number; w: number } | null)[] => {
      const half = 700 / 2, gap = 24, cx = window.innerWidth / 2;
      const leftW = cx - half - gap;
      const rightX = cx + half + gap;
      const rightW = window.innerWidth - rightX;
      return [leftW > 70 ? { x: 0, w: leftW } : null, rightW > 70 ? { x: rightX, w: rightW } : null];
    };

    // ---- a small, still-ish secondary koi (varied pattern) ----
    const SN = 9;
    const drawSmallKoi = (k: (typeof smallKoi)[number], cx: number, cy: number, amt: number) => {
      const heading = k.baseHeading + Math.sin(time * k.turnSpd + k.phase) * k.turnRange;
      const back = heading + Math.PI;
      const bx = Math.cos(back), by = Math.sin(back);
      const px = -by, py = bx;
      const link = 6 * k.scale;
      const maxW = 8 * k.scale;
      const sp: Pt[] = [];
      for (let i = 0; i < SN; i++) {
        const t = i / (SN - 1);
        const wave = Math.sin(time * 1.5 + k.phase - t * Math.PI * 1.4) * 2.4 * t * k.scale;
        sp.push({ x: cx + bx * link * i + px * wave, y: cy + by * link * i + py * wave });
      }
      const hw = (t: number) => {
        if (t < 0.1) return maxW * (0.45 + (t / 0.1) * 0.4);
        if (t < 0.42) return maxW * (0.85 + ((t - 0.1) / 0.32) * 0.15);
        return Math.max(maxW * (1 - ((t - 0.42) / 0.58) * 0.95), maxW * 0.06);
      };
      const perp: Pt[] = [], L: Pt[] = [], R: Pt[] = [];
      for (let i = 0; i < SN; i++) {
        let dx: number, dy: number;
        if (i === 0) { dx = sp[0].x - sp[1].x; dy = sp[0].y - sp[1].y; }
        else if (i === SN - 1) { dx = sp[SN - 2].x - sp[SN - 1].x; dy = sp[SN - 2].y - sp[SN - 1].y; }
        else { dx = sp[i - 1].x - sp[i + 1].x; dy = sp[i - 1].y - sp[i + 1].y; }
        const ln = Math.hypot(dx, dy) || 1;
        perp.push({ x: -dy / ln, y: dx / ln });
        const w = hw(i / (SN - 1));
        L.push({ x: sp[i].x + perp[i].x * w, y: sp[i].y + perp[i].y * w });
        R.push({ x: sp[i].x - perp[i].x * w, y: sp[i].y - perp[i].y * w });
      }
      const fwdX = sp[0].x - sp[1].x, fwdY = sp[0].y - sp[1].y;
      const fl = Math.hypot(fwdX, fwdY) || 1;
      const fX = fwdX / fl, fY = fwdY / fl;
      const tfX = -fX, tfY = -fY;
      const headTip = { x: sp[0].x + fX * maxW * 0.9, y: sp[0].y + fY * maxW * 0.9 };
      const tailTip = { x: sp[SN - 1].x + tfX * 2, y: sp[SN - 1].y + tfY * 2 };
      const ring: Pt[] = [headTip, ...L, tailTip];
      for (let i = SN - 1; i >= 0; i--) ring.push(R[i]);
      const body = () => {
        ctx.beginPath();
        const last = ring[ring.length - 1];
        ctx.moveTo((last.x + ring[0].x) / 2, (last.y + ring[0].y) / 2);
        for (let i = 0; i < ring.length; i++) {
          const c = ring[i], n = ring[(i + 1) % ring.length];
          ctx.quadraticCurveTo(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2);
        }
        ctx.closePath();
      };

      ctx.save();
      ctx.globalAlpha = amt;

      // tail fin
      const tjp = sp[SN - 1];
      const tailAng = Math.atan2(tfY, tfX) + Math.sin(time * 2.4 + k.phase) * 0.18;
      const tpx = -Math.sin(tailAng), tpy = Math.cos(tailAng);
      const tlen = 16 * k.scale;
      ctx.beginPath();
      ctx.moveTo(tjp.x, tjp.y);
      ctx.lineTo(tjp.x + Math.cos(tailAng) * tlen + tpx * tlen * 0.55, tjp.y + Math.sin(tailAng) * tlen + tpy * tlen * 0.55);
      ctx.lineTo(tjp.x + Math.cos(tailAng) * tlen - tpx * tlen * 0.55, tjp.y + Math.sin(tailAng) * tlen - tpy * tlen * 0.55);
      ctx.closePath();
      ctx.fillStyle = "rgba(250, 245, 238, 0.4)";
      ctx.fill();

      // pectoral fins
      for (const side of [1, -1] as const) {
        const fi = 2;
        const ox = sp[fi].x + perp[fi].x * hw(fi / (SN - 1)) * side;
        const oy = sp[fi].y + perp[fi].y * hw(fi / (SN - 1)) * side;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + perp[fi].x * 9 * k.scale * side - fX * 5 * k.scale, oy + perp[fi].y * 9 * k.scale * side - fY * 5 * k.scale);
        ctx.lineTo(ox - fX * 11 * k.scale, oy - fY * 11 * k.scale);
        ctx.closePath();
        ctx.fillStyle = "rgba(250, 245, 238, 0.3)";
        ctx.fill();
      }

      // body
      body();
      const bgg = ctx.createLinearGradient(sp[0].x, sp[0].y, sp[SN - 1].x, sp[SN - 1].y);
      bgg.addColorStop(0, k.pattern.base[0]);
      bgg.addColorStop(1, k.pattern.base[1]);
      ctx.fillStyle = bgg;
      ctx.fill();

      // pattern blobs (clipped)
      ctx.save();
      body();
      ctx.clip();
      for (const bl of k.pattern.blobs) {
        const idx = Math.min(SN - 1, Math.max(0, Math.round(bl.t * (SN - 1))));
        const w = hw(bl.t);
        const ex = sp[idx].x + perp[idx].x * bl.s * w * 2;
        const ey = sp[idx].y + perp[idx].y * bl.s * w * 2;
        const pa = Math.atan2(perp[idx].y, perp[idx].x) + Math.PI / 2;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(pa);
        ctx.beginPath();
        ctx.ellipse(0, 0, bl.r * maxW * 1.5, bl.r * maxW, 0, 0, Math.PI * 2);
        ctx.fillStyle = bl.c;
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // outline + eyes
      body();
      ctx.strokeStyle = "rgba(50, 28, 14, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      for (const side of [1, -1] as const) {
        const ex = sp[1].x + perp[1].x * hw(1 / (SN - 1)) * 0.9 * side;
        const ey = sp[1].y + perp[1].y * hw(1 / (SN - 1)) * 0.9 * side;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.3 * k.scale, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(20, 12, 6, 0.8)";
        ctx.fill();
      }
      ctx.restore();
    };

    // ---- pond layers ----
    const drawPondUnder = (amt: number) => {
      if (amt < 0.01) return;
      const margins = getMargins();
      const H = window.innerHeight;
      const sY = window.scrollY; // world->screen offset

      margins.forEach((m, side) => {
        if (!m) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(m.x, 0, m.w, H);
        ctx.clip();

        // ===== WATER — brighter, clearer turquoise =====
        const wg = ctx.createLinearGradient(0, 0, 0, H);
        wg.addColorStop(0, `rgba(34, 116, 112, ${0.9 * amt})`);
        wg.addColorStop(0.45, `rgba(22, 96, 102, ${0.92 * amt})`);
        wg.addColorStop(1, `rgba(15, 78, 86, ${0.9 * amt})`);
        ctx.fillStyle = wg;
        ctx.fillRect(m.x, 0, m.w, H);

        // drifting depth tones (lighter/darker pools)
        for (let i = 0; i < 4; i++) {
          const seed = side * 7 + i * 3 + 1;
          const bx = m.x + (rnd(seed) * 0.9 + 0.05 + Math.sin(time * 0.1 + i) * 0.03) * m.w;
          const by = (rnd(seed + 1) + Math.cos(time * 0.08 + i) * 0.04) * H;
          const br = 90 + rnd(seed + 2) * 130;
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          const light = i % 2 === 0;
          g.addColorStop(0, light ? `rgba(70, 150, 138, ${0.16 * amt})` : `rgba(6, 38, 46, ${0.2 * amt})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(m.x, 0, m.w, H);
        }

        // ===== submerged cobble bed (seen through the clear water) =====
        for (const pb of pebbles.filter((p) => p.side === side)) {
          const x = m.x + pb.fx * m.w, y = pb.wy * pageH - sY;
          if (y < -160 || y > H + 160) continue;
          drawSprite(sprPebble[pb.variant], x, y, pb.r, 0, amt * 0.4);
        }
        // a faint water film over the bed so it reads as "under" the surface
        ctx.fillStyle = `rgba(26, 104, 104, ${0.32 * amt})`;
        ctx.fillRect(m.x, 0, m.w, H);

        // flowing caustic ribbons (glowing light on the water)
        ctx.save();
        ctx.shadowColor = `rgba(175, 232, 236, ${0.5 * amt})`;
        ctx.shadowBlur = 6;
        for (const c of caustics.filter((c) => c.side === side)) {
          const y0 = c.fy * H;
          ctx.beginPath();
          for (let xx = -10; xx <= m.w + 10; xx += 10) {
            const yy = y0 + Math.sin(xx * 0.022 + time * c.spd + c.phase) * c.amp
              + Math.sin(xx * 0.06 + time * c.spd * 1.7) * c.amp * 0.4;
            if (xx <= -10) ctx.moveTo(m.x + xx, yy);
            else ctx.lineTo(m.x + xx, yy);
          }
          ctx.strokeStyle = `rgba(195, 236, 240, ${0.16 * amt})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        ctx.restore();

        // ===== RIVERBANKS — natural, scattered outcrops (not a continuous wall) =====
        // Features appear at irregular intervals: open gaps, a grass clump, a
        // rocky outcrop, or a big boulder jutting out. The two edges roll
        // independently (and the inner/content edge stays mostly open).
        // `seed` must be world-stable (NOT screen coords) so the rock keeps its
        // shape/rotation as it scrolls instead of re-randomizing every frame.
        const bankRock = (rx: number, ry: number, rr: number, into: number, seed: number) => {
          ctx.save();
          ctx.globalAlpha = amt;
          ctx.filter = "blur(3px)";
          ctx.beginPath();
          ctx.ellipse(rx + into * 2, ry + 4, rr * 0.92, rr * 0.66, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 14, 20, 0.4)";
          ctx.fill();
          ctx.restore();
          drawSprite(sprRock[Math.floor(rnd(seed) * 6) % 6], rx, ry, rr, rnd(seed + 1) * 6.28, amt);
        };
        for (const edge of EDGES) {
          const edgeX = edge === 0
            ? (side === 0 ? m.x : m.x + m.w)        // outer (screen edge)
            : (side === 0 ? m.x + m.w : m.x);       // inner (content edge)
          const into = edge === 0 ? (side === 0 ? 1 : -1) : (side === 0 ? -1 : 1);
          const base = side * 9000 + edge * 4000;
          const FSTEP = 200;
          const n0 = Math.floor((sY - 360) / FSTEP);
          const n1 = Math.ceil((sY + H + 360) / FSTEP);
          for (let n = n0; n <= n1; n++) {
            const roll = rnd(base + n * 1.3);
            const slotY = n * FSTEP + (rnd(base + n * 1.3 + 50) - 0.5) * FSTEP * 0.7 - sY;
            if (slotY < -320 || slotY > H + 320) continue;
            // outer edge = main shore (more features); inner edge mostly open water
            const t = edge === 0
              ? (roll < 0.34 ? 0 : roll < 0.48 ? 1 : roll < 0.82 ? 2 : 3)
              : (roll < 0.66 ? 0 : roll < 0.82 ? 1 : roll < 0.95 ? 2 : 3);
            if (t === 0) continue; // open gap

            if (t === 1) {
              // a grass clump
              const cnt = 1 + Math.floor(rnd(base + n + 3) * 3);
              for (let g = 0; g < cnt; g++) {
                const gy = slotY + (rnd(base + n * 3 + g) - 0.5) * 46;
                drawSprite(sprGrass, edgeX + into * (8 + rnd(base + n * 3 + g + 1) * 16), gy, 12 + rnd(base + n * 3 + g + 2) * 12, Math.sin(time * 0.5 + n + g) * 0.05, amt * 0.95);
              }
            } else if (t === 3) {
              // a big boulder jutting into the water + a couple at its base
              const rr = 40 + rnd(base + n + 5) * 18;
              bankRock(edgeX + into * (rr * 0.45 + rnd(base + n + 6) * 24), slotY, rr, into, base + n * 17 + 800);
              for (let s = 0; s < 2; s++) {
                bankRock(edgeX + into * (8 + rnd(base + n + s + 9) * 16), slotY + (s ? 30 : -32) + (rnd(base + n + s) - 0.5) * 18, 12 + rnd(base + n + s + 1) * 10, into, base + n * 17 + 820 + s * 11);
              }
              if (rnd(base + n + 12) > 0.5) drawSprite(sprGrass, edgeX + into * 14, slotY + rr * 0.4, 14, Math.sin(time * 0.5 + n) * 0.05, amt * 0.95);
            } else {
              // a rocky outcrop — a tight clump of varied rocks
              const count = 3 + Math.floor(rnd(base + n + 7) * 5);
              const extent = 24 + count * 6;
              for (let k = 0; k < count; k++) {
                const dy = (rnd(base + n * 5 + k) - 0.5) * 2 * extent;
                const dx = into * (4 + rnd(base + n * 5 + k + 1) * (16 + count * 2));
                const rr = 12 + rnd(base + n * 5 + k + 2) * 22;
                bankRock(edgeX + dx, slotY + dy, rr, into, base + n * 31 + k * 7 + 500);
              }
              if (rnd(base + n + 20) > 0.4) drawSprite(sprGrass, edgeX + into * (10 + rnd(base + n + 21) * 14), slotY + (rnd(base + n + 22) - 0.5) * 40, 13 + rnd(base + n + 23) * 12, Math.sin(time * 0.5 + n) * 0.05, amt * 0.95);
              // bamboo occasionally rises from an outcrop
              if (rnd(base + n + 30) > 0.6 && sprBamboo.complete && sprBamboo.naturalWidth) {
                const bSize = 130;
                ctx.save();
                ctx.globalAlpha = amt;
                ctx.translate(edgeX, slotY - extent * 0.3);
                if (into < 0) ctx.scale(-1, 1);
                ctx.rotate(Math.sin(time * 0.6 + n) * 0.04);
                ctx.drawImage(sprBamboo, -0.1 * bSize, -bSize / 2, bSize, bSize);
                ctx.restore();
              }
            }
          }
        }

        // ===== secondary koi (anchored in the river; you pass them by) =====
        for (const k of smallKoi.filter((k) => k.side === side)) {
          const x = m.x + (k.fx + Math.sin(time * 0.2 + k.bobPhase) * 0.02) * m.w;
          const y = k.wy * pageH - sY + Math.cos(time * 0.18 + k.bobPhase) * 6;
          if (y < -120 || y > H + 120) continue;
          drawSmallKoi(k, x, y, amt * 0.95);
        }

        // inner-edge depth shadow near the content "island"
        const innerX = side === 0 ? m.x + m.w : m.x;
        const dir = side === 0 ? -1 : 1;
        const sg = ctx.createLinearGradient(innerX, 0, innerX + dir * 55, 0);
        sg.addColorStop(0, `rgba(4, 22, 28, ${0.5 * amt})`);
        sg.addColorStop(1, "rgba(4, 22, 28, 0)");
        ctx.fillStyle = sg;
        ctx.fillRect(m.x, 0, m.w, H);

        ctx.restore();
      });
    };

    const drawPondOver = (amt: number) => {
      if (amt < 0.01) return;
      const margins = getMargins();
      const H = window.innerHeight;
      const sY = window.scrollY;

      margins.forEach((m, side) => {
        if (!m) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(m.x, 0, m.w, H);
        ctx.clip();

        // ===== LILY PADS — detailed SVG sprite, with shadow + optional lotus =====
        for (const lp of lilyPads.filter((l) => l.side === side)) {
          const x = m.x + (lp.fx + Math.sin(time * lp.spd + lp.phase) * 0.025) * m.w;
          const y = lp.wy * pageH - sY + Math.cos(time * lp.spd * 0.8 + lp.phase) * 5;
          if (y < -120 || y > H + 120) continue;
          const r = lp.r * (0.7 + 0.3 * amt);
          const rot = lp.notch + Math.sin(time * 0.3 + lp.phase) * 0.12;

          // soft shadow on water
          ctx.save();
          ctx.globalAlpha = amt;
          ctx.filter = "blur(4px)";
          ctx.beginPath();
          ctx.ellipse(x + 3, y + 4, r, r * 0.96, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 22, 26, 0.3)";
          ctx.fill();
          ctx.restore();

          drawSprite(sprPad, x, y, r, rot, amt);
          if (lp.flower) {
            drawSprite(sprLotus, x, y, r * 0.5, Math.sin(time * 0.5 + lp.phase) * 0.08, amt);
          }
        }

        // ===== SPARKLES — glowing 8-point twinkles =====
        ctx.save();
        ctx.shadowColor = `rgba(222, 250, 255, ${0.7 * amt})`;
        for (const sk of sparkles.filter((s) => s.side === side)) {
          const tw = Math.sin(time * sk.spd + sk.phase);
          if (tw <= 0) continue;
          const x = m.x + sk.fx * m.w, y = sk.fy * H;
          const s = sk.size * tw;
          const a = tw * 0.7 * amt;
          ctx.shadowBlur = 5 * tw;
          ctx.strokeStyle = `rgba(226, 248, 252, ${a})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x - s, y); ctx.lineTo(x + s, y);
          ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
          ctx.moveTo(x - s * 0.5, y - s * 0.5); ctx.lineTo(x + s * 0.5, y + s * 0.5);
          ctx.moveTo(x - s * 0.5, y + s * 0.5); ctx.lineTo(x + s * 0.5, y - s * 0.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 1.1 * tw, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.fill();
        }
        ctx.restore();

        ctx.restore();
      });

      // ===== cherry-blossom petals drifting across both margins =====
      const clip = new Path2D();
      margins.forEach((m) => { if (m) clip.rect(m.x, 0, m.w, H); });
      ctx.save();
      ctx.clip(clip);
      if (time - lastPetal > 0.9 && immersiveRef.current) {
        const m = margins[Math.random() < 0.5 ? 0 : 1] || margins[0] || margins[1];
        if (m) {
          petals.push({
            x: m.x + Math.random() * m.w, y: -10,
            vx: (Math.random() - 0.5) * 0.3, vy: 0.25 + Math.random() * 0.3,
            r: 4 + Math.random() * 3.5, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03, a: 0.9,
          });
        }
        lastPetal = time;
      }
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx + Math.sin(time + p.y * 0.02) * 0.18;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > H + 20) { petals.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // notched cherry-blossom petal
        const r = p.r;
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.bezierCurveTo(r, r * 0.3, r * 0.6, -r * 0.9, r * 0.13, -r);
        ctx.lineTo(0, -r * 0.8);
        ctx.lineTo(-r * 0.13, -r);
        ctx.bezierCurveTo(-r * 0.6, -r * 0.9, -r, r * 0.3, 0, r);
        ctx.closePath();
        const pg = ctx.createLinearGradient(0, r, 0, -r);
        pg.addColorStop(0, `rgba(244, 178, 200, ${p.a * amt})`);
        pg.addColorStop(1, `rgba(252, 216, 228, ${p.a * amt})`);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = `rgba(228, 150, 178, ${p.a * 0.5 * amt})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };


    // ---- flowing fan-shaped fin with rays ----
    const fan = (
      bx: number, by: number, axisAng: number, length: number, spread: number,
      fill: string, edge: string, ray: string, rays: number
    ) => {
      const a0 = axisAng - spread / 2;
      const tips: Pt[] = [];
      for (let s = 0; s <= rays; s++) {
        const a = a0 + spread * (s / rays);
        const lenMul = 0.82 + 0.18 * Math.sin((s / rays) * Math.PI);
        tips.push({ x: bx + Math.cos(a) * length * lenMul, y: by + Math.sin(a) * length * lenMul });
      }
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tips[0].x, tips[0].y);
      for (let s = 1; s <= rays; s++) {
        ctx.quadraticCurveTo(tips[s - 1].x, tips[s - 1].y, (tips[s - 1].x + tips[s].x) / 2, (tips[s - 1].y + tips[s].y) / 2);
      }
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = edge;
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.strokeStyle = ray;
      ctx.lineWidth = 0.55;
      for (let s = 0; s <= rays; s++) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (tips[s].x - bx) * 0.9, by + (tips[s].y - by) * 0.9);
        ctx.stroke();
      }
    };

    const FIN_FILL = "rgba(252, 246, 240, 0.34)";
    const FIN_EDGE = "rgba(170, 80, 45, 0.26)";
    const FIN_RAY = "rgba(150, 70, 40, 0.24)";

    const drawKoi = () => {
      const perp: Pt[] = [];
      for (let i = 0; i < N; i++) {
        let dx: number, dy: number;
        if (i === 0) { dx = joints[0].x - joints[1].x; dy = joints[0].y - joints[1].y; }
        else if (i === N - 1) { dx = joints[N - 2].x - joints[N - 1].x; dy = joints[N - 2].y - joints[N - 1].y; }
        else { dx = joints[i - 1].x - joints[i + 1].x; dy = joints[i - 1].y - joints[i + 1].y; }
        const len = Math.hypot(dx, dy) || 1;
        perp.push({ x: -dy / len, y: dx / len });
      }
      const left: Pt[] = joints.map((j, i) => ({ x: j.x + perp[i].x * HALF_W[i], y: j.y + perp[i].y * HALF_W[i] }));
      const right: Pt[] = joints.map((j, i) => ({ x: j.x - perp[i].x * HALF_W[i], y: j.y - perp[i].y * HALF_W[i] }));

      const hdx = joints[0].x - joints[1].x, hdy = joints[0].y - joints[1].y;
      const hlen = Math.hypot(hdx, hdy) || 1;
      const fx = hdx / hlen, fy = hdy / hlen;

      const tdx = joints[N - 1].x - joints[N - 2].x, tdy = joints[N - 1].y - joints[N - 2].y;
      const tlen = Math.hypot(tdx, tdy) || 1;
      const tfx = tdx / tlen, tfy = tdy / tlen;

      const headTip: Pt = { x: joints[0].x + fx * HALF_W[0] * 0.95, y: joints[0].y + fy * HALF_W[0] * 0.95 };
      const tailTip: Pt = { x: joints[N - 1].x + tfx * 3, y: joints[N - 1].y + tfy * 3 };

      const pts: Pt[] = [headTip];
      for (let i = 0; i < N; i++) pts.push(left[i]);
      pts.push(tailTip);
      for (let i = N - 1; i >= 0; i--) pts.push(right[i]);

      const bodyPath = () => {
        ctx.beginPath();
        const last = pts[pts.length - 1];
        ctx.moveTo((last.x + pts[0].x) / 2, (last.y + pts[0].y) / 2);
        for (let i = 0; i < pts.length; i++) {
          const cur = pts[i];
          const nxt = pts[(i + 1) % pts.length];
          ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
        }
        ctx.closePath();
      };

      // ---- shadow ----
      ctx.save();
      ctx.translate(3, 5);
      ctx.globalAlpha = 0.12;
      bodyPath();
      ctx.fillStyle = "#001523";
      ctx.filter = "blur(6px)";
      ctx.fill();
      ctx.restore();

      // ---- CAUDAL (tail) FIN — flowing fan with rays ----
      const tj = joints[N - 1];
      const tailSway = Math.sin(swimPhase * 2.6) * (0.13 + energy * 0.14);
      fan(tj.x, tj.y, Math.atan2(tfy, tfx) + tailSway, 40 * SCALE, 1.05,
        "rgba(252, 246, 240, 0.4)", "rgba(165, 70, 38, 0.3)", "rgba(150, 65, 35, 0.28)", 9);

      // ---- PELVIC FINS (rear, behind body) ----
      {
        const pi = 9;
        for (const side of [1, -1] as const) {
          const bx = joints[pi].x + perp[pi].x * HALF_W[pi] * 0.7 * side;
          const by = joints[pi].y + perp[pi].y * HALF_W[pi] * 0.7 * side;
          const outX = perp[pi].x * side, outY = perp[pi].y * side;
          const axis = Math.atan2(outY * 0.7 - fy * 0.85, outX * 0.7 - fx * 0.85) + Math.sin(swimPhase * 2.0 + side) * 0.06;
          fan(bx, by, axis, 17 * SCALE, 0.7, FIN_FILL, FIN_EDGE, FIN_RAY, 4);
        }
      }

      // ---- PECTORAL FINS (flowing sleeves, behind body) ----
      {
        const fi = 3;
        for (const side of [1, -1] as const) {
          const bx = joints[fi].x + perp[fi].x * HALF_W[fi] * 0.8 * side;
          const by = joints[fi].y + perp[fi].y * HALF_W[fi] * 0.8 * side;
          const outX = perp[fi].x * side, outY = perp[fi].y * side;
          const flap = Math.sin(swimPhase * 2.2 + side * 0.6) * (0.07 + energy * 0.06);
          const axis = Math.atan2(outY * 0.62 - fy * 0.78, outX * 0.62 - fx * 0.78) + flap * side;
          fan(bx, by, axis, 30 * SCALE, 0.95, FIN_FILL, FIN_EDGE, FIN_RAY, 7);
        }
      }

      // ---- BODY ----
      bodyPath();
      const bg = ctx.createLinearGradient(joints[0].x, joints[0].y, joints[N - 1].x, joints[N - 1].y);
      bg.addColorStop(0, "#fdf9f2");
      bg.addColorStop(0.5, "#fbf5ec");
      bg.addColorStop(1, "#efe7da");
      ctx.fillStyle = bg;
      ctx.fill();

      // ---- interior (clipped) ----
      ctx.save();
      bodyPath();
      ctx.clip();

      // inked organic blotches (irregular, kohaku-style) — radii arrays
      // are fixed so the shapes stay stable frame-to-frame
      const RA = [1.0, 0.72, 1.18, 0.6, 0.95, 1.28, 0.66, 1.06];
      const RB = [0.9, 1.22, 0.68, 1.12, 0.82, 1.18, 0.74, 1.02];
      const RC = [1.12, 0.78, 1.02, 0.68, 1.24, 0.84, 1.08, 0.72];
      const blob = (ji: number, off: number, baseR: number, radii: number[], c1: string, c2: string) => {
        const j = joints[ji];
        const pa = Math.atan2(
          joints[Math.min(ji + 1, N - 1)].y - joints[Math.max(ji - 1, 0)].y,
          joints[Math.min(ji + 1, N - 1)].x - joints[Math.max(ji - 1, 0)].x
        );
        ctx.save();
        ctx.translate(j.x + perp[ji].x * off, j.y + perp[ji].y * off);
        ctx.rotate(pa);
        const n = radii.length;
        const bp: Pt[] = [];
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2;
          bp.push({ x: Math.cos(a) * radii[k] * baseR * SCALE, y: Math.sin(a) * radii[k] * baseR * 0.82 * SCALE });
        }
        ctx.beginPath();
        const last = bp[n - 1];
        ctx.moveTo((last.x + bp[0].x) / 2, (last.y + bp[0].y) / 2);
        for (let k = 0; k < n; k++) {
          const cur = bp[k];
          const nxt = bp[(k + 1) % n];
          ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
        }
        ctx.closePath();
        const pg = ctx.createRadialGradient(0, 0, 1, 0, 0, baseR * SCALE);
        pg.addColorStop(0, c1);
        pg.addColorStop(1, c2);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.strokeStyle = "rgba(120, 45, 20, 0.4)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
        ctx.restore();
      };

      const ORANGE: [string, string] = ["rgba(234, 126, 46, 0.96)", "rgba(200, 60, 24, 0.96)"];
      const RED: [string, string] = ["rgba(224, 92, 34, 0.95)", "rgba(184, 44, 18, 0.96)"];

      // larger blotches concentrated along the back/shoulders
      blob(2, -4, 11, RA, ...ORANGE);
      blob(3, 6, 8, RB, ...ORANGE);
      blob(5, -3, 9, RC, ...RED);
      blob(6, 5, 7.5, RA, ...ORANGE);
      blob(8, -3, 7, RB, ...RED);
      blob(10, 4, 5.5, RC, ...ORANGE);
      // scattered small spots
      blob(4, 8, 3, RB, ...ORANGE);
      blob(7, -7, 2.8, RA, ...RED);
      blob(9, 6, 2.6, RC, ...ORANGE);
      blob(11, -4, 2.4, RA, ...ORANGE);

      // faint scales across the body
      for (let i = 2; i < N - 2; i++) {
        const w = HALF_W[i];
        const count = Math.floor(w / 6.5);
        const sa = Math.atan2(perp[i].y, perp[i].x) + Math.PI / 2;
        for (let s = -count; s <= count; s++) {
          const sx = joints[i].x + perp[i].x * s * 6.5;
          const sy = joints[i].y + perp[i].y * s * 6.5;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(sa);
          ctx.beginPath();
          ctx.arc(0, 0, 5, Math.PI, 0);
          ctx.strokeStyle = "rgba(40, 22, 10, 0.07)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // top sheen
      const sh = ctx.createLinearGradient(joints[0].x, joints[0].y - 10, joints[3].x, joints[3].y + 10);
      sh.addColorStop(0, "rgba(255,255,255,0)");
      sh.addColorStop(0.4, "rgba(255,255,255,0.2)");
      sh.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sh;
      bodyPath();
      ctx.fill();
      ctx.restore(); // end clip

      // ---- DORSAL FIN — subtle sliver along the spine ----
      {
        const d0 = 4, d1 = 10;
        ctx.beginPath();
        ctx.moveTo(joints[d0].x, joints[d0].y);
        for (let i = d0 + 1; i <= d1; i++) {
          const lift = Math.sin(((i - d0) / (d1 - d0)) * Math.PI) * 3;
          ctx.lineTo(joints[i].x + perp[i].x * lift, joints[i].y + perp[i].y * lift);
        }
        for (let i = d1; i >= d0; i--) {
          const lift = Math.sin(((i - d0) / (d1 - d0)) * Math.PI) * 3;
          ctx.lineTo(joints[i].x - perp[i].x * lift, joints[i].y - perp[i].y * lift);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(210, 80, 40, 0.14)";
        ctx.fill();
      }

      // body outline
      bodyPath();
      ctx.strokeStyle = "rgba(60, 35, 20, 0.3)";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // ---- GILL lines (subtle) ----
      for (const side of [1, -1] as const) {
        const gj = joints[2];
        const gx = gj.x + perp[2].x * HALF_W[2] * 0.5 * side;
        const gy = gj.y + perp[2].y * HALF_W[2] * 0.5 * side;
        ctx.beginPath();
        ctx.moveTo(gx + fx * 4, gy + fy * 4);
        ctx.quadraticCurveTo(
          gx + perp[2].x * 3 * side, gy + perp[2].y * 3 * side,
          gx - fx * 5, gy - fy * 5
        );
        ctx.strokeStyle = "rgba(70, 40, 22, 0.18)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ---- EYES — tiny, at the very edge of the head ----
      for (const side of [1, -1] as const) {
        const ex = joints[1].x + perp[1].x * HALF_W[1] * 0.92 * side;
        const ey = joints[1].y + perp[1].y * HALF_W[1] * 0.92 * side;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8 * SCALE, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(22, 13, 6, 0.78)";
        ctx.fill();
      }

      // ---- BARBELS ----
      for (const side of [1, -1] as const) {
        ctx.beginPath();
        ctx.moveTo(joints[0].x + perp[0].x * 3 * side, joints[0].y + perp[0].y * 3 * side);
        ctx.bezierCurveTo(
          joints[0].x + fx * 8 + perp[0].x * 6 * side, joints[0].y + fy * 8 + perp[0].y * 6 * side,
          joints[0].x + fx * 14 + perp[0].x * 4 * side, joints[0].y + fy * 14 + perp[0].y * 4 * side,
          joints[0].x + fx * 17 + perp[0].x * 2 * side, joints[0].y + fy * 17 + perp[0].y * 2 * side
        );
        ctx.strokeStyle = "rgba(70, 40, 20, 0.38)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    };

    const frame = () => {
      time += 0.016;
      scrollY += (targetScrollY - scrollY) * 0.06;
      pageH = document.documentElement.scrollHeight;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const mx = marginCenterX();
      if (mx < 0) { raf = requestAnimationFrame(frame); return; }

      // ease the immersive pond layer in/out; under-layer behind the koi
      immersiveAmt += ((immersiveRef.current ? 1 : 0) - immersiveAmt) * 0.04;
      drawPondUnder(immersiveAmt);

      // --- scroll activity -> energy ---
      const scrollDelta = Math.abs(targetScrollY - lastTargetScrollY);
      lastTargetScrollY = targetScrollY;
      const targetEnergy = Math.min(scrollDelta / 25, 1);
      energy += (targetEnergy - energy) * (targetEnergy > energy ? 0.25 : 0.015); // quick rise, slow decay
      idleTimer = scrollDelta > 0.5 ? 0 : idleTimer + 0.016;

      // swim cycle speeds up with energy
      swimPhase += 0.016 * (1.0 + energy * 1.7);

      // ease into a lazy loop after a few idle seconds
      loopBlend += ((idleTimer > 4 ? 1 : 0) - loopBlend) * 0.02;
      loopAngle += 0.016 * 0.6;

      const sf = scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const baseY = 170 + sf * (window.innerHeight * 0.58);

      // normal swim target (snaking, energy-scaled amplitude)
      const wiggleAmp = WIGGLE_AMP * (0.8 + energy * 0.7);
      const swimX = mx + Math.sin(swimPhase * WIGGLE_FREQ) * wiggleAmp + Math.sin(swimPhase * 2.3) * 7;
      const swimY = baseY + Math.sin(swimPhase * 0.7) * 40;

      // lazy loop target
      const rightEdge = window.innerWidth / 2 + 700 / 2 + 24;
      const marginW = window.innerWidth - rightEdge;
      const loopR = Math.min(marginW * 0.28, 60);
      const loopX = mx + Math.cos(loopAngle) * loopR;
      const loopY = baseY + Math.sin(loopAngle) * loopR * 0.6;

      const targetX = swimX + (loopX - swimX) * loopBlend;
      const targetY = swimY + (loopY - swimY) * loopBlend;

      const lerp = SWIM_SPEED * (0.8 + energy * 0.8);
      joints[0].x += (targetX - joints[0].x) * lerp;
      joints[0].y += (targetY - joints[0].y) * (lerp * 0.7);

      for (let i = 1; i < N; i++) {
        let ang = Math.atan2(joints[i].y - joints[i - 1].y, joints[i].x - joints[i - 1].x);
        if (i >= 2) {
          const prevAng = Math.atan2(joints[i - 1].y - joints[i - 2].y, joints[i - 1].x - joints[i - 2].x);
          let diff = norm(ang - prevAng);
          if (diff > MAX_BEND) diff = MAX_BEND;
          else if (diff < -MAX_BEND) diff = -MAX_BEND;
          ang = prevAng + diff;
        }
        joints[i].x = joints[i - 1].x + Math.cos(ang) * LINK;
        joints[i].y = joints[i - 1].y + Math.sin(ang) * LINK;
      }

      const ang0 = Math.atan2(joints[0].y - joints[1].y, joints[0].x - joints[1].x);
      if (time - lastRipple > 1.6) {
        ripples.push({ x: joints[2].x, y: joints[2].y, r: 6, a: 0.24, ang: ang0 });
        lastRipple = time;
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.6;
        rp.a -= 0.0038;
        if (rp.a <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.5, rp.ang, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(90, 150, 200, ${rp.a})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // rising bubbles from near the head/gills
      if (time - lastBubble > 0.45) {
        const src = joints[2];
        bubbles.push({
          x: src.x + (Math.random() - 0.5) * 14,
          y: src.y + (Math.random() - 0.5) * 10,
          r: 1.2 + Math.random() * 2.0,
          a: 0.5,
          vy: 0.25 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 0.15,
        });
        lastBubble = time;
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += b.vx;
        b.a -= 0.0045;
        if (b.a <= 0) { bubbles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(150, 200, 220, ${b.a})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 230, 245, ${b.a * 0.7})`;
        ctx.fill();
      }

      drawKoi();

      // immersive over-layer: lily pads, sparkles, petals (on the surface)
      drawPondOver(immersiveAmt);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 10, opacity: shown ? 1 : 0, transition: "opacity 0.9s ease" }}
    />
  );
}
