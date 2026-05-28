"use client";
import { useEffect, useRef } from "react";

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

export default function KoiFish() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    const onScroll = () => { targetScrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll);

    const marginCenterX = () => {
      const rightEdge = window.innerWidth / 2 + 700 / 2 + 24;
      const marginW = window.innerWidth - rightEdge;
      if (marginW < 70) return -1;
      return rightEdge + marginW / 2;
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
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const mx = marginCenterX();
      if (mx < 0) { raf = requestAnimationFrame(frame); return; }

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
      style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 10 }}
    />
  );
}
