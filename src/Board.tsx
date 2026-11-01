import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./hooks";

/* The page as a live circuit board, drawn on one canvas behind the content.

   Mains power enters at the top left and runs down a three-phase bus in the left margin (the red, yellow and
   blue phases). It feeds the meter in the hero; the model there splits the reading, and its four outputs leave
   on the right as data lanes, one per kind of work, carrying bit trains that spell a message in ASCII. In the
   gaps between sections, links cross from power to data, some through parts from my own projects. Content
   blocks are keep-out zones, as on a real board, so nothing is ever drawn behind text.

   Scrolling powers the page up: current flows down from the mains as you read and lights the indicator beside
   each section. Load-shedding (dark mode) cuts the mains: an IPS keeps one phase and the critical links alive
   with slow amber current. Ending it sends a surge back through the board. */

type Pt = [number, number];
type Color = "red" | "yellow" | "blue" | "earth" | "ink";
type Kind = "power" | "cross" | "under" | "data" | "feed";
type Trace = {
  kind: Kind; color: Color; pts: Pt[]; cum: number[]; len: number; ymin: number; ymax: number;
  speed: number; spacing: number; phase: number; critical: boolean; yAt: number; litAt: number;
};
type Chip = { x: number; y: number; w: number; h: number; label: string; ref: string; tint: boolean; pins: number[] };
type Note = { x: number; y: number; text: string };
type Layout = { traces: Trace[]; vias: Pt[]; leds: { x: number; y: number; litAt: number }[]; chips: Chip[]; notes: Note[]; top: number; mobile: boolean };

const STEP = 12;
const PH: Color[] = ["red", "yellow", "blue"];
const LINE_COLOR: Record<string, Color> = { backend: "blue", commerce: "red", automation: "yellow", iot: "earth" };
/** Parts from my own work, placed where a gap has room. */
const PARTS = ["ESP32-S3", "PZEM-004T", "NPU", "SX1276 LoRa", "ADC 12-bit", "SRAM"];
/** What the data lanes carry, eight bits per character. */
const MESSAGE = "HIRE RAKIBUL ";
const BITS = [...MESSAGE].flatMap((c) => c.charCodeAt(0).toString(2).padStart(8, "0").split("").map(Number));
const BIT = 8;
const GAP_BITS = 6;

const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function trace(kind: Kind, color: Color, pts: Pt[], extra: Partial<Trace> = {}): Trace {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const ys = pts.map((p) => p[1]);
  return { kind, color, pts, cum, len: cum[cum.length - 1], ymin: Math.min(...ys), ymax: Math.max(...ys), speed: 150, spacing: 300, phase: 0, critical: false, yAt: ys[0], litAt: -1, ...extra };
}

function at(t: Trace, s: number): Pt {
  const { pts, cum } = t;
  if (s <= 0) return pts[0];
  if (s >= t.len) return pts[pts.length - 1];
  let i = 1;
  while (cum[i] < s) i++;
  const k = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
}

/** Arc length up to which a trace whose y never decreases lies at or above `y`. */
function sAtY(t: Trace, y: number) {
  const { pts, cum } = t;
  if (y < pts[0][1]) return -1;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][1] > y) {
      const dy = pts[i][1] - pts[i - 1][1];
      return cum[i - 1] + (dy ? ((y - pts[i - 1][1]) / dy) * (cum[i] - cum[i - 1]) : 0);
    }
  }
  return t.len;
}

function seg(ctx: CanvasRenderingContext2D, t: Trace, s0: number, s1: number, oy: number) {
  s0 = Math.max(0, s0);
  s1 = Math.min(t.len, s1);
  if (s1 <= s0) return;
  const a = at(t, s0);
  ctx.beginPath();
  ctx.moveTo(a[0], a[1] - oy);
  for (let i = 1; i < t.pts.length; i++) if (t.cum[i] > s0 && t.cum[i] < s1) ctx.lineTo(t.pts[i][0], t.pts[i][1] - oy);
  const b = at(t, s1);
  ctx.lineTo(b[0], b[1] - oy);
  ctx.stroke();
}

function measure(): Layout | null {
  const sy = window.scrollY;
  const W = document.documentElement.clientWidth;
  const wrap = document.querySelector<HTMLElement>("main .wrap");
  const ft = document.querySelector<HTMLElement>(".ft");
  if (!wrap || !ft) return null;
  const cs = getComputedStyle(wrap);
  const wr = wrap.getBoundingClientRect();
  const L = wr.left + parseFloat(cs.paddingLeft);
  const R = wr.right - parseFloat(cs.paddingRight);
  const top = document.querySelector<HTMLElement>(".hd")?.offsetHeight ?? 64;
  const bottom = ft.getBoundingClientRect().top + sy;
  const box = (el: Element) => { const r = el.getBoundingClientRect(); return { t: r.top + sy, b: r.bottom + sy, l: r.left, r: r.right }; };
  const blocks = [...document.querySelectorAll("main .wrap > *")].map(box).filter((b) => b.b - b.t > 1);
  const tints = [...document.querySelectorAll(".sec-tint")].map(box);
  const rand = rng(33);
  const mobile = W < 700;

  const traces: Trace[] = [];
  const vias: Pt[] = [];
  const leds: Layout["leds"] = [];
  const chips: Chip[] = [];
  const notes: Note[] = [];

  const nL = mobile ? 0 : Math.max(0, Math.min(3, Math.floor((L - 24) / STEP)));
  const nR = mobile ? 0 : Math.max(0, Math.min(4, Math.floor((W - R - 24) / STEP)));
  const xL = (i: number) => L - 18 - i * STEP;
  const xR = (i: number) => R + 18 + i * STEP;
  const yE = top + 34;
  const yEnd = bottom - 26;

  // 1. Mains: in from the left edge, down the left margin as a nested three-phase bus, out again at the bottom.
  for (let i = 0; i < nL; i++) {
    const x = xL(i), y = yE + i * STEP, yb = yEnd - i * STEP;
    traces.push(trace("power", PH[i], [[-8, y], [x - 12, y], [x, y + 12], [x, yb - 12], [x - 12, yb], [-8, yb]],
      { critical: i === 0, speed: 150 - i * 14, spacing: 310, phase: i * 97 }));
  }
  if (nL && L >= 128) notes.push({ x: 10, y: yE - 10, text: "Mains 220 V 50 Hz" });

  // 2. The hero model: the meter is fed from the mains, and its four outputs leave on the right as data lanes.
  let dataTop = Infinity;
  const plot = document.querySelector<HTMLElement>(".sig-plot");
  if (plot) {
    const p = box(plot), h = p.b - p.t;
    const yin = p.t + (parseFloat(plot.dataset.feedIn ?? "50") / 100) * h;
    if (nL) { traces.push(trace("feed", "ink", [[xL(0), yin], [p.l - 3, yin]], { critical: true, speed: 60, spacing: 70 })); vias.push([xL(0), yin]); }
    const outs = (plot.dataset.feedsOut ?? "").split(",").filter(Boolean).map((s) => { const [key, y] = s.split(":"); return { key, y: p.t + (parseFloat(y) / 100) * h }; })
      .sort((a, b) => a.y - b.y);
    outs.forEach((o, k) => {
      const lane = nR - 1 - k; // the topmost output takes the outermost lane, so no two lines cross
      if (lane < 0) { if (!mobile) traces.push(trace("data", LINE_COLOR[o.key], [[p.r + 3, o.y], [p.r + 14, o.y]], { speed: 0 })); return; }
      const x = xR(lane), yx = yEnd - lane * STEP;
      dataTop = Math.min(dataTop, o.y + 12);
      traces.push(trace("data", LINE_COLOR[o.key], [[p.r + 3, o.y], [x - 12, o.y], [x, o.y + 12], [x, yx - 12], [x + 12, yx], [W + 8, yx]],
        { speed: 64, phase: k * 53 }));
    });
  }

  // 3. An indicator on the first phase beside every section heading. It lights when the current reaches it.
  if (nL) for (const h of document.querySelectorAll("main h2")) { const r = box(h); leds.push({ x: xL(0), y: (r.t + r.b) / 2, litAt: -1 }); }

  // 4. Links across the gaps between sections, from the power bus to the data side.
  const iv = blocks.map((b) => [b.t - 16, b.b + 16]).sort((a, b) => a[0] - b[0]);
  const busy: number[][] = [];
  for (const v of iv) { const last = busy[busy.length - 1]; if (last && v[0] <= last[1]) last[1] = Math.max(last[1], v[1]); else busy.push([...v]); }
  const gaps: { t: number; b: number }[] = [];
  let cursor = top + 40;
  for (const [t, b] of busy) { if (t - cursor >= 46) gaps.push({ t: cursor, b: t }); cursor = Math.max(cursor, b); }
  if (bottom - 24 - cursor >= 46) gaps.push({ t: cursor, b: bottom - 24 });

  let part = 0;
  gaps.forEach((g, gi) => {
    const h = g.b - g.t;
    const k = Math.max(1, Math.min(3, Math.floor((h - 34) / 16) + 1));
    const busH = (k - 1) * 16 + 12;
    const y0 = g.t + (h - busH) / 2;
    const span = R - L;
    const label = h >= 92 && span >= 560 && part < PARTS.length ? PARTS[part++] : null;
    const jogX = L + span * (0.32 + rand() * 0.36);
    let chip: Chip | null = null;
    if (label) {
      const w = Math.max(84, 26 + label.length * 6.8), cx = L + span * (0.3 + rand() * 0.4);
      chip = { x: cx - w / 2, y: y0 - 12, w, h: (k - 1) * 16 + 24, label, ref: `U${part}`, tint: tints.some((t) => y0 > t.t && y0 < t.b), pins: [] };
      chips.push(chip);
    }
    for (let j = 0; j < k; j++) {
      const y = y0 + j * 16;
      const lane = nL ? j % nL : 0;
      const color = PH[(gi + j) % 3];
      const sx = nL ? xL(0) + (lane ? 8 : 0) : -8;
      const toData = nR && y > dataTop;
      const ex = toData ? xR(0) : W + 8;
      if (nL && lane) { // an outer phase dives under the inner ones through two vias, like a real two-layer board
        traces.push(trace("under", color, [[xL(lane), y], [sx, y]], { speed: 0 }));
        vias.push([xL(lane), y], [sx, y]);
      } else if (nL) vias.push([sx, y]);
      const pts: Pt[] = chip ? [[sx, y], [ex, y]] : [[sx, y], [jogX, y], [jogX + 12, y + 12], [ex, y + 12]];
      if (chip) chip.pins.push(y);
      traces.push(trace("cross", color, pts, { speed: 170 + j * 12, spacing: 260, phase: gi * 131 + j * 61, critical: j === 0 && gi % 2 === 0, yAt: y }));
      if (toData) vias.push([ex, chip ? y : y + 12]);
    }
  });

  return { traces, vias, leds, chips, notes, top, mobile };
}

const hexA = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export default function Board() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();
    const root = document.documentElement;
    let layout: Layout | null = null;
    let dpr = 1;
    let colors: Record<string, string> = {};
    let dark = root.dataset.theme === "dark";
    const state = { front: 0, target: 0, mode: dark ? "ips" : "mains", modeAt: -1e6, surge: false, last: performance.now(), raf: 0, frame: 0 };

    const readColors = () => {
      const cs = getComputedStyle(root);
      const v = (n: string) => cs.getPropertyValue(n).trim() || "#888888";
      dark = root.dataset.theme === "dark";
      colors = { red: v("--red"), yellow: v("--yellow"), blue: v("--blue"), earth: v("--earth"), ink: v("--ink"), paper: v("--paper"), paper2: v("--paper-2"), amber: "#ffc53d" };
    };
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    const relayout = () => {
      layout = measure();
      if (layout && !state.front) state.front = layout.top;
      if (reduce) draw(performance.now());
    };

    /** How a trace behaves right now: mains, a brown-out, or running on the IPS. */
    const energy = (t: Trace, now: number) => {
      const s = (now - state.modeAt) / 1000;
      if (state.mode === "mains") {
        const surge = state.surge && s < 0.9 ? 1 + 1.6 * (1 - s / 0.9) : 1;
        return { glow: surge, alpha: 1, speed: 1, color: colors[t.color] };
      }
      const live = t.kind === "data" || t.kind === "feed" || t.critical;
      const fade = Math.max(0, 1 - s / 0.45);
      if (s < 0.75) return { glow: 1, alpha: fade, speed: fade, color: colors[t.color] };
      const back = Math.min(1, (s - 0.75) / 0.6);
      if (!live) return { glow: 1, alpha: 0, speed: 0, color: colors[t.color] };
      return { glow: 1, alpha: back, speed: t.kind === "data" ? 0.6 : 0.42, color: t.kind === "data" ? colors[t.color] : colors.amber };
    };

    function draw(now: number) {
      if (!layout || !ctx) return;
      const dt = Math.min(0.1, (now - state.last) / 1000);
      state.last = now;
      const vw = canvas!.clientWidth, vh = canvas!.clientHeight, oy = window.scrollY;
      state.target = Math.max(state.target, oy + vh * 0.92);
      state.front = reduce ? 1e9 : state.front + (state.target - state.front) * Math.min(1, dt * 2.4);
      const front = state.front;
      const moving = !reduce && state.target - front > 6;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const ink = colors.ink;
      const offA = dark ? 0.07 : 0.075, onA = dark ? 0.17 : 0.17;
      const ipsDim = state.mode === "ips" && now - state.modeAt > 750;

      for (const tr of layout.traces) {
        if (tr.ymax < oy - 60 || tr.ymin > oy + vh + 60) continue;
        // how much of this trace has power
        let sOn: number;
        if (tr.kind === "cross" || tr.kind === "under") {
          if (tr.yAt <= front && tr.litAt < 0) tr.litAt = now;
          sOn = tr.litAt < 0 ? -1 : reduce ? tr.len : Math.min(tr.len, (now - tr.litAt) * 0.9);
        } else sOn = sAtY(tr, front);
        const e = energy(tr, now);
        const dead = ipsDim && e.alpha === 0;

        // the copper
        ctx.lineWidth = tr.kind === "under" ? 1 : 1.25;
        ctx.setLineDash(tr.kind === "under" ? [3, 4] : []);
        ctx.strokeStyle = hexA(ink, offA);
        seg(ctx, tr, 0, tr.len, oy);
        if (sOn > 0 && !dead) {
          ctx.strokeStyle = hexA(ink, onA * Math.max(0.35, e.alpha) * e.glow);
          seg(ctx, tr, 0, sOn, oy);
        }
        ctx.setLineDash([]);
        if (reduce || tr.speed <= 0) continue;
        tr.phase += dt * tr.speed * e.speed; // integrate, so a brown-out slows the current instead of making it jump
        if (sOn <= 0 || e.alpha <= 0.01) continue;

        // the current
        if (tr.kind === "data") {
          const period = (BITS.length + GAP_BITS) * BIT;
          const off = tr.phase % period;
          const s0 = Math.max(0, sAtY(tr, oy - 20)), s1 = Math.min(sOn, tr.len, sAtY(tr, oy + vh + 20) < 0 ? 0 : sAtY(tr, oy + vh + 20));
          ctx.lineWidth = 2;
          ctx.strokeStyle = hexA(e.color, 0.7 * e.alpha);
          for (let i = Math.floor((s0 - off) / BIT); off + i * BIT <= s1; i++) {
            const b = ((i % (BITS.length + GAP_BITS)) + (BITS.length + GAP_BITS)) % (BITS.length + GAP_BITS);
            if (b < BITS.length && BITS[b]) { const s = off + i * BIT; seg(ctx, tr, s, s + 4.5, oy); }
          }
          continue;
        }
        const tail = tr.kind === "feed" ? 18 : tr.kind === "cross" ? 30 : 38;
        const n = Math.ceil(tr.len / tr.spacing) + 1;
        const head = tr.phase % tr.spacing;
        for (let k = 0; k < n; k++) {
          const s = head + k * tr.spacing;
          if (s - tail > sOn || s - tail > tr.len) break;
          const p = at(tr, Math.min(s, tr.len));
          if (p[1] < oy - 40 || p[1] > oy + vh + 40) continue;
          if (dark) { ctx.lineWidth = 7; ctx.strokeStyle = hexA(e.color, 0.16 * e.alpha); seg(ctx, tr, s - tail * 0.4, Math.min(s, sOn), oy); }
          ctx.lineWidth = 2.2;
          ctx.strokeStyle = hexA(e.color, 0.22 * e.alpha); seg(ctx, tr, s - tail, s - tail * 0.5, oy);
          ctx.strokeStyle = hexA(e.color, 0.55 * e.alpha); seg(ctx, tr, s - tail * 0.5, s - tail * 0.18, oy);
          ctx.strokeStyle = hexA(e.color, 0.95 * e.alpha); seg(ctx, tr, s - tail * 0.18, Math.min(s, sOn), oy);
        }
      }

      // the power front, racing down the bus while the page powers up
      if (moving && state.mode === "mains") {
        for (const tr of layout.traces) {
          if (tr.kind !== "power") continue;
          const s = sAtY(tr, front);
          if (s <= 0 || s >= tr.len) continue;
          const p = at(tr, s);
          ctx.fillStyle = hexA(colors[tr.color], 0.25);
          ctx.beginPath(); ctx.arc(p[0], p[1] - oy, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = colors[tr.color];
          ctx.beginPath(); ctx.arc(p[0], p[1] - oy, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // vias
      ctx.lineWidth = 1.1;
      for (const [x, y] of layout.vias) {
        if (y < oy - 10 || y > oy + vh + 10) continue;
        ctx.fillStyle = colors.paper;
        ctx.strokeStyle = hexA(ink, y <= front ? 0.38 : 0.18);
        ctx.beginPath(); ctx.arc(x, y - oy, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // parts
      for (const c of layout.chips) {
        if (c.y + c.h < oy - 20 || c.y > oy + vh + 20) continue;
        const y = c.y - oy, on = c.y <= front;
        ctx.fillStyle = c.tint ? colors.paper2 : colors.paper;
        ctx.strokeStyle = hexA(ink, on ? 0.42 : 0.22);
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.roundRect(c.x, y, c.w, c.h, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = hexA(ink, on ? 0.45 : 0.25);
        for (const py of c.pins) { ctx.fillRect(c.x - 4, py - oy - 1.5, 4, 3); ctx.fillRect(c.x + c.w, py - oy - 1.5, 4, 3); }
        ctx.beginPath(); ctx.arc(c.x + 6, y + 6, 1.5, 0, Math.PI * 2); ctx.fill(); // pin-1 mark
        ctx.font = `600 10px "Geologica Variable", system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = hexA(ink, on ? 0.62 : 0.32);
        ctx.fillText(c.label, c.x + c.w / 2, y + c.h / 2 + 0.5);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.font = `600 9px "Geologica Variable", system-ui, sans-serif`;
        ctx.fillStyle = hexA(ink, 0.36);
        ctx.fillText(c.ref, c.x, y - 5);
      }

      // section indicators
      for (const led of layout.leds) {
        if (led.y < oy - 10 || led.y > oy + vh + 10) continue;
        const lit = led.y <= front;
        if (lit && led.litAt < 0) led.litAt = now;
        const y = led.y - oy;
        const on = lit && !(state.mode === "ips" && now - state.modeAt < 750);
        const c = state.mode === "ips" ? colors.amber : colors.earth;
        if (on) {
          const pop = reduce ? 0 : Math.max(0, 1 - (now - led.litAt) / 500);
          ctx.fillStyle = hexA(c, (dark ? 0.3 : 0.22) + pop * 0.3);
          ctx.beginPath(); ctx.arc(led.x, y, 7 + pop * 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(led.x, y, 3.4, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = colors.paper; ctx.strokeStyle = hexA(ink, 0.32); ctx.lineWidth = 1.1;
          ctx.beginPath(); ctx.arc(led.x, y, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }

      // silkscreen
      ctx.font = `600 10px "Geologica Variable", system-ui, sans-serif`;
      ctx.fillStyle = hexA(ink, 0.42);
      for (const nt of layout.notes) if (nt.y > oy - 20 && nt.y < oy + vh + 20) ctx.fillText(nt.text, nt.x, nt.y - oy);
    }

    const loop = (now: number) => {
      state.raf = requestAnimationFrame(loop);
      // phones draw every other frame
      if (layout?.mobile && (state.frame++ & 1)) return;
      draw(now);
    };

    readColors();
    size();
    relayout();
    if (reduce) {
      const redraw = () => requestAnimationFrame(() => draw(performance.now()));
      window.addEventListener("scroll", redraw, { passive: true });
      redraw();
    } else state.raf = requestAnimationFrame(loop);

    // React to the load-shedding switch.
    const mo = new MutationObserver(() => {
      readColors();
      const mode = root.dataset.theme === "dark" ? "ips" : "mains";
      if (mode !== state.mode) { state.surge = mode === "mains"; state.mode = mode; state.modeAt = performance.now(); }
      if (reduce) draw(performance.now());
    });
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    // Re-route when the layout changes: resizes, fonts and images arriving.
    let timer = 0;
    const later = () => { window.clearTimeout(timer); timer = window.setTimeout(() => { size(); relayout(); }, 150); };
    window.addEventListener("resize", later);
    const ro = new ResizeObserver(later);
    ro.observe(document.body);
    document.fonts?.ready.then(later).catch(() => {});

    const onVis = () => {
      if (reduce) return;
      cancelAnimationFrame(state.raf);
      if (document.visibilityState === "visible") { state.last = performance.now(); state.raf = requestAnimationFrame(loop); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(state.raf);
      mo.disconnect();
      ro.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("resize", later);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="board" aria-hidden />;
}
