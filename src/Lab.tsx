import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { featuredProjects, moreProjects } from "./data";
import { prefersReducedMotion, useOnScreen } from "./hooks";

/* Five ideas from computer science, each one running on the kind of problem it solves in my own projects.
   The screens are dark on purpose, like an instrument panel, in both themes. Nothing here is live data:
   every number on a screen is computed by the small program next to it, and times are modelled. */

const S = { bg: "#0b0f14", panel: "#121923", line: "#243040", ink: "#e4e8ec", dim: "#8c97a3", blue: "#7d97ff", red: "#ff6b5b", yellow: "#ffc53d", earth: "#46c98a" };
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const ALL = [...featuredProjects, ...moreProjects];
const proj = (name: string) => ALL.find((p) => p.name === name);

/** Runs `cb` every animation frame while `on` is true, unless the visitor asked for reduced motion. */
function useRaf(on: boolean, cb: (dt: number) => void) {
  const ref = useRef(cb);
  useEffect(() => { ref.current = cb; });
  useEffect(() => {
    if (!on || prefersReducedMotion()) return;
    let raf = 0, last = performance.now();
    const f = (t: number) => { raf = requestAnimationFrame(f); const dt = Math.min(0.05, (t - last) / 1000); last = t; ref.current(dt); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}

/** Keeps a canvas sharp at its CSS size and calls `draw` after each resize. */
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const fn = useRef(draw);
  useEffect(() => { fn.current = draw; });
  const paint = useCallback(() => {
    const c = cv.current, ctx = c?.getContext("2d");
    if (!c || !ctx || !size.current.w) return;
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fn.current(ctx, w, h);
  }, []);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: Math.round(r.width), h: Math.round(r.height), dpr };
      c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
      paint();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [paint]);
  return { cv, paint };
}

/* ================================================================ 1. shortest path */

const COLS = 26, ROWS = 11, CELLS = COLS * ROWS;
const START = 5 * COLS + 2;
const EXITS = [1 * COLS + 24, 9 * COLS + 24];

const baseWalls = () => {
  const w = new Uint8Array(CELLS);
  for (let y = 0; y <= 7; y++) w[y * COLS + 9] = 1;
  for (let y = 3; y <= 10; y++) w[y * COLS + 16] = 1;
  return w;
};

type Route = { order: number[]; dist: Float64Array; path: number[]; exit: number };

/** Dijkstra's algorithm on a grid: always expand the cheapest unexplored cell, stop at the first open exit. */
function solve(walls: Uint8Array, closed: boolean[]): Route {
  const dist = new Float64Array(CELLS).fill(Infinity);
  const prev = new Int16Array(CELLS).fill(-1);
  const done = new Uint8Array(CELLS);
  const open = [START], order: number[] = [];
  dist[START] = 0;
  let hit = -1;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[bi]]) bi = i;
    const u = open.splice(bi, 1)[0];
    if (done[u]) continue;
    done[u] = 1; order.push(u);
    const ei = EXITS.indexOf(u);
    if (ei >= 0 && !closed[ei]) { hit = u; break; }
    const x = u % COLS, y = (u - x) / COLS;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const v = ny * COLS + nx;
      const blocked = walls[v] || (EXITS.indexOf(v) >= 0 && closed[EXITS.indexOf(v)]);
      if (blocked || done[v]) continue;
      if (dist[u] + 1 < dist[v]) { dist[v] = dist[u] + 1; prev[v] = u; open.push(v); }
    }
  }
  const path: number[] = [];
  if (hit >= 0) for (let c = hit; c >= 0; c = prev[c]) path.unshift(c);
  return { order, dist, path, exit: hit };
}

function PathDemo({ on }: { on: boolean }) {
  const reduce = useRef(false);
  const m = useRef({
    walls: baseWalls(), closed: [false, false], route: null as Route | null,
    visited: 0, pathN: 0, walker: 0, pause: 0, drag: false, mode: 1,
  });
  const [info, setInfo] = useState({ explored: 0, steps: 0, exit: "", ok: true });

  const { cv, paint } = useCanvas((ctx, w, h) => {
    const s = m.current, r = s.route;
    const cs = w / COLS;
    ctx.fillStyle = S.bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = S.line;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) ctx.fillRect(x * cs + cs / 2 - 0.6, y * cs + cs / 2 - 0.6, 1.2, 1.2);
    if (r) {
      const maxD = r.dist[r.order[r.order.length - 1]] || 1;
      const shown = Math.min(Math.floor(s.visited), r.order.length);
      for (let i = 0; i < shown; i++) {
        const c = r.order[i], x = (c % COLS) * cs, y = Math.floor(c / COLS) * cs;
        const age = shown - i, front = s.visited < r.order.length && age < 16;
        ctx.fillStyle = front ? rgba(S.yellow, 0.8 - (age / 16) * 0.55) : rgba(S.blue, 0.1 + 0.3 * (1 - r.dist[c] / maxD));
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      }
    }
    for (let c = 0; c < CELLS; c++) if (s.walls[c]) {
      const x = (c % COLS) * cs, y = Math.floor(c / COLS) * cs;
      ctx.fillStyle = "#63788f"; ctx.fillRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      ctx.fillStyle = "#8aa0b8"; ctx.fillRect(x + 0.5, y + 0.5, cs - 1, 2);
    }
    EXITS.forEach((c, i) => {
      const x = (c % COLS) * cs, y = Math.floor(c / COLS) * cs, col = s.closed[i] ? S.red : S.earth;
      ctx.fillStyle = rgba(col, 0.22); ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, cs - 4, cs - 4);
      ctx.beginPath();
      if (s.closed[i]) { ctx.moveTo(x + cs * 0.3, y + cs * 0.3); ctx.lineTo(x + cs * 0.7, y + cs * 0.7); ctx.moveTo(x + cs * 0.7, y + cs * 0.3); ctx.lineTo(x + cs * 0.3, y + cs * 0.7); }
      else { ctx.moveTo(x + cs * 0.28, y + cs * 0.52); ctx.lineTo(x + cs * 0.44, y + cs * 0.68); ctx.lineTo(x + cs * 0.74, y + cs * 0.32); }
      ctx.stroke();
    });
    if (r && r.path.length) {
      const n = Math.min(r.path.length, Math.floor(s.pathN) + 1);
      ctx.strokeStyle = S.earth; ctx.lineWidth = Math.max(3, cs * 0.28); ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < n; i++) { const c = r.path[i]; const px = (c % COLS + 0.5) * cs, py = (Math.floor(c / COLS) + 0.5) * cs; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      if (s.pathN >= r.path.length - 1) { // a person walks the route
        const f = Math.min(r.path.length - 1, s.walker), i = Math.floor(f), t = f - i;
        const a = r.path[i], b = r.path[Math.min(i + 1, r.path.length - 1)];
        const px = ((a % COLS) + 0.5 + ((b % COLS) - (a % COLS)) * t) * cs, py = (Math.floor(a / COLS) + 0.5 + (Math.floor(b / COLS) - Math.floor(a / COLS)) * t) * cs;
        ctx.fillStyle = S.ink; ctx.beginPath(); ctx.arc(px, py, cs * 0.26, 0, Math.PI * 2); ctx.fill();
      }
    }
    const sx = (START % COLS + 0.5) * cs, sy = (Math.floor(START / COLS) + 0.5) * cs;
    ctx.strokeStyle = S.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, cs * 0.34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = S.ink; ctx.beginPath(); ctx.arc(sx, sy, cs * 0.12, 0, Math.PI * 2); ctx.fill();
  });

  const recompute = useCallback((replay: boolean) => {
    const s = m.current;
    const route = solve(s.walls, s.closed);
    s.route = route;
    const instant = !replay || reduce.current;
    s.visited = instant ? route.order.length : 0;
    s.pathN = instant ? route.path.length : 0;
    s.walker = 0; s.pause = 0;
    const ei = EXITS.indexOf(route.exit);
    setInfo({ explored: route.order.length, steps: Math.max(0, route.path.length - 1), exit: ei >= 0 ? (ei ? "south-east" : "north-east") : "", ok: route.exit >= 0 });
    paint();
  }, [paint]);

  useEffect(() => { reduce.current = prefersReducedMotion(); recompute(true); }, [recompute]);

  useRaf(on, (dt) => {
    const s = m.current, r = s.route;
    if (!r) return;
    if (s.visited < r.order.length) s.visited += dt * 230;
    else if (s.pathN < r.path.length - 1) s.pathN += dt * 42;
    else if (r.path.length > 1) {
      if (s.pause > 0) { s.pause -= dt; if (s.pause <= 0) s.walker = 0; }
      else { s.walker += dt * 8; if (s.walker >= r.path.length - 1) { s.walker = r.path.length - 1; s.pause = 1.1; } }
    }
    paint();
  });

  const cellAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS), y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    return x < 0 || y < 0 || x >= COLS || y >= ROWS ? -1 : y * COLS + x;
  };
  const paintCell = (c: number) => {
    const s = m.current;
    if (c < 0 || c === START || EXITS.indexOf(c) >= 0) return;
    if (s.walls[c] === s.mode) return;
    s.walls[c] = s.mode;
    recompute(false);
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = cellAt(e), s = m.current;
    if (c < 0 || c === START) return;
    const ei = EXITS.indexOf(c);
    if (ei >= 0) { s.closed[ei] = !s.closed[ei]; recompute(true); return; }
    s.drag = true; s.mode = s.walls[c] ? 0 : 1;
    e.currentTarget.setPointerCapture(e.pointerId);
    paintCell(c);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { if (m.current.drag) paintCell(cellAt(e)); };
  const up = () => { if (m.current.drag) { m.current.drag = false; recompute(true); } };

  const blockRoute = () => {
    const r = m.current.route;
    if (!r || r.path.length < 5) return;
    const mid = r.path.slice(2, -2);
    m.current.walls[mid[Math.floor(Math.random() * mid.length)]] = 1;
    recompute(true);
  };
  const reset = () => { m.current.walls = baseWalls(); m.current.closed = [false, false]; recompute(true); };

  return (
    <div className="demo">
      <canvas ref={cv} className="demo-cv path-cv" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="img" aria-label={info.ok ? `A grid of corridors. The shortest route to the ${info.exit} exit takes ${info.steps} steps after exploring ${info.explored} cells.` : "A grid of corridors with no open exit reachable."} />
      <div className="demo-bar">
        <p className="demo-read" role="status" aria-live="polite">
          {info.ok ? <>Explored <b className="tnum">{info.explored}</b> cells, then found the <b>{info.exit}</b> exit in <b className="tnum">{info.steps}</b> steps.</> : <>No open exit can be reached. Open an exit or take a wall away.</>}
        </p>
        <div className="demo-btns">
          <button type="button" className="chip-btn" onClick={blockRoute}>Block the route</button>
          <button type="button" className="chip-btn" onClick={() => recompute(true)}>Replay</button>
          <button type="button" className="chip-btn" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ 2. genetic algorithm */

const PEAKS: [number, number, number, number][] = [[0.22, 0.68, 0.62, 0.13], [0.78, 0.3, 1, 0.1], [0.58, 0.82, 0.5, 0.09], [0.4, 0.2, 0.38, 0.11]];
const fitness = (x: number, y: number) => {
  let f = 0;
  for (const [px, py, h, s] of PEAKS) f += h * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (2 * s * s));
  return Math.min(1, f + 0.025 * Math.sin(17 * x) * Math.sin(14 * y));
};
const ramp = (t: number): [number, number, number] => {
  const stops: [number, [number, number, number]][] = [[0, [11, 15, 20]], [0.35, [28, 40, 92]], [0.7, [98, 124, 235]], [1, [255, 197, 61]]];
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [t0, a] = stops[i - 1], [t1, b] = stops[i], k = (t - t0) / (t1 - t0);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  return stops[stops.length - 1][1];
};
type Ind = { x: number; y: number; px: number; py: number; f: number };
const POP = 36;
const gaussian = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) * 1.7; };
const newPop = (): Ind[] => Array.from({ length: POP }, () => { const x = Math.random(), y = Math.random(); return { x, y, px: x, py: y, f: fitness(x, y) }; });

function EvolveDemo({ on }: { on: boolean }) {
  const reduce = useRef(false);
  const g = useRef({ pop: newPop(), gen: 0, tween: 1, timer: 0, running: true, mut: 35, stall: 0, wait: 0, map: null as HTMLCanvasElement | null });
  const [run, setRun] = useState(true);
  const [mut, setMut] = useState(35);
  const [stats, setStats] = useState({ gen: 0, best: 0, mean: 0, note: "" });

  const summarize = (note = "") => {
    const p = g.current.pop;
    const best = Math.max(...p.map((i) => i.f)), mean = p.reduce((a, i) => a + i.f, 0) / p.length;
    setStats({ gen: g.current.gen, best, mean, note });
    return { best, mean };
  };

  const { cv, paint } = useCanvas((ctx, w, h) => {
    const s = g.current;
    if (!s.map || s.map.width !== 96) {
      const m = document.createElement("canvas"); m.width = 96; m.height = 60;
      const mc = m.getContext("2d")!, img = mc.createImageData(96, 60);
      for (let j = 0; j < 60; j++) for (let i = 0; i < 96; i++) {
        const [r, gg, b] = ramp(fitness(i / 95, 1 - j / 59)), k = (j * 96 + i) * 4;
        img.data[k] = r; img.data[k + 1] = gg; img.data[k + 2] = b; img.data[k + 3] = 255;
      }
      mc.putImageData(img, 0, 0); s.map = m;
    }
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(s.map, 0, 0, w, h);
    const e = 1 - (1 - Math.min(1, s.tween)) ** 3;
    let bi = 0;
    s.pop.forEach((p, i) => { if (p.f > s.pop[bi].f) bi = i; });
    s.pop.forEach((p, i) => {
      const x = (p.px + (p.x - p.px) * e) * w, y = (1 - (p.py + (p.y - p.py) * e)) * h;
      if (e < 1) { ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.px * w, (1 - p.py) * h); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.fillStyle = i === bi ? S.yellow : "#f3f5f7"; ctx.strokeStyle = "rgba(11,15,20,.9)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, i === bi ? 5.5 : 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
  });

  const step = useCallback(() => {
    const s = g.current;
    const sorted = [...s.pop].sort((a, b) => b.f - a.f);
    const pick = () => { let b = s.pop[Math.floor(Math.random() * POP)]; for (let k = 0; k < 2; k++) { const c = s.pop[Math.floor(Math.random() * POP)]; if (c.f > b.f) b = c; } return b; };
    const next: Ind[] = sorted.slice(0, 2).map((p) => ({ ...p, px: p.x, py: p.y }));
    while (next.length < POP) {
      const a = pick(), b = pick(), k = Math.random();
      let x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
      if (Math.random() * 100 < s.mut) x += gaussian() * 0.07;
      if (Math.random() * 100 < s.mut) y += gaussian() * 0.07;
      x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));
      next.push({ x, y, px: a.x, py: a.y, f: fitness(x, y) });
    }
    s.pop = next; s.gen++; s.tween = reduce.current ? 1 : 0;
    const { best, mean } = summarize();
    s.stall = mean > best * 0.96 ? s.stall + 1 : 0;
    paint();
  }, [paint]);

  const restart = useCallback(() => {
    const s = g.current;
    s.pop = newPop(); s.gen = 0; s.tween = 1; s.stall = 0; s.wait = 0; s.timer = 0;
    summarize(); paint();
  }, [paint]);

  useEffect(() => { reduce.current = prefersReducedMotion(); if (reduce.current) { g.current.running = false; setRun(false); } summarize(); }, []);

  useRaf(on && run, (dt) => {
    const s = g.current;
    s.tween = Math.min(1, s.tween + dt / 0.55);
    if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) restart(); paint(); return; }
    s.timer += dt;
    if (s.timer > 0.85) {
      s.timer = 0; step();
      if (s.stall >= 3 || s.gen >= 40) { s.wait = 2.2; setStats((p) => ({ ...p, note: "Settled on a peak. Starting a new population." })); }
    }
    paint();
  });

  return (
    <div className="demo">
      <canvas ref={cv} className="demo-cv evo-cv" role="img" aria-label={`A map of scores with ${POP} dots. Generation ${stats.gen}: the best score is ${stats.best.toFixed(2)} out of 1.`} />
      <div className="demo-bar">
        <p className="demo-read" role="status" aria-live="polite">
          Generation <b className="tnum">{stats.gen}</b>. Best score <b className="tnum">{stats.best.toFixed(2)}</b>, average <b className="tnum">{stats.mean.toFixed(2)}</b>. {stats.note}
        </p>
        <div className="demo-btns">
          <button type="button" className="chip-btn" onClick={() => { g.current.running = !run; setRun(!run); }}>{run ? "Pause" : "Run"}</button>
          <button type="button" className="chip-btn" onClick={step}>One generation</button>
          <button type="button" className="chip-btn" onClick={restart}>New population</button>
          <label className="slider">Mutation
            <input type="range" min={0} max={100} step={5} value={mut} onChange={(e) => { const v = +e.target.value; g.current.mut = v; setMut(v); }} />
            <output className="tnum">{mut}%</output>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ 3. compiler */

type Tok = { type: "num" | "id" | "op" | "paren" | "eq"; text: string; at: number };
type Node =
  | { t: "num"; v: number } | { t: "id"; v: string }
  | { t: "bin"; op: string; l: Node; r: Node } | { t: "neg"; e: Node }
  | { t: "set"; name: string; e: Node };

class SyntaxErr extends Error { constructor(msg: string, public at: number) { super(msg); } }

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const num = /^\d+(\.\d+)?/.exec(src.slice(i)), id = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (num) { out.push({ type: "num", text: num[0], at: i }); i += num[0].length; }
    else if (id) { out.push({ type: "id", text: id[0], at: i }); i += id[0].length; }
    else if ("+-*/".includes(c)) { out.push({ type: "op", text: c, at: i }); i++; }
    else if ("()".includes(c)) { out.push({ type: "paren", text: c, at: i }); i++; }
    else if (c === "=") { out.push({ type: "eq", text: c, at: i }); i++; }
    else throw new SyntaxErr(`The lexer does not know the character “${c}”.`, i);
  }
  return out;
}

function parse(toks: Tok[]): Node {
  let p = 0;
  const peek = () => toks[p];
  const end = (src = toks[toks.length - 1]) => (src ? src.at + src.text.length : 0);
  const expr = (): Node => {
    let l = term();
    while (peek() && (peek().text === "+" || peek().text === "-")) { const op = toks[p++].text; l = { t: "bin", op, l, r: term() }; }
    return l;
  };
  const term = (): Node => {
    let l = factor();
    while (peek() && (peek().text === "*" || peek().text === "/")) { const op = toks[p++].text; l = { t: "bin", op, l, r: factor() }; }
    return l;
  };
  const factor = (): Node => {
    const t = toks[p];
    if (!t) throw new SyntaxErr("The expression ends too early. An operand is missing.", end());
    if (t.type === "num") { p++; return { t: "num", v: parseFloat(t.text) }; }
    if (t.type === "id") { p++; return { t: "id", v: t.text }; }
    if (t.text === "-") { p++; return { t: "neg", e: factor() }; }
    if (t.text === "(") {
      p++; const e = expr();
      if (!peek() || peek().text !== ")") throw new SyntaxErr("A closing bracket is missing.", end());
      p++; return e;
    }
    throw new SyntaxErr(`The parser did not expect “${t.text}” here.`, t.at);
  };
  let node: Node;
  if (toks.length >= 2 && toks[0].type === "id" && toks[1].type === "eq") { p = 2; node = { t: "set", name: toks[0].text, e: expr() }; }
  else node = expr();
  if (p < toks.length) throw new SyntaxErr(`The parser did not expect “${toks[p].text}” here.`, toks[p].at);
  return node;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
function emit(n: Node, parentPrec = 0, right = false, parentOp = ""): string {
  switch (n.t) {
    case "num": return Number.isInteger(n.v) ? `${n.v}.0` : String(n.v);
    case "id": return n.v;
    case "neg": return `-${emit(n.e, 3)}`;
    case "set": return `double ${n.name} = ${emit(n.e)};`;
    case "bin": {
      const pr = PREC[n.op];
      const s = `${emit(n.l, pr)} ${n.op} ${emit(n.r, pr, true, n.op)}`;
      const need = pr < parentPrec || (right && pr === parentPrec && (parentOp === "-" || parentOp === "/"));
      return need ? `(${s})` : s;
    }
  }
}
const unknowns = (n: Node, out = new Set<string>()): Set<string> => {
  if (n.t === "id") out.add(n.v);
  else if (n.t === "bin") { unknowns(n.l, out); unknowns(n.r, out); }
  else if (n.t === "neg" || n.t === "set") unknowns(n.e, out);
  return out;
};
const evaluate = (n: Node): number => {
  switch (n.t) {
    case "num": return n.v;
    case "id": return NaN;
    case "neg": return -evaluate(n.e);
    case "set": return evaluate(n.e);
    case "bin": { const a = evaluate(n.l), b = evaluate(n.r); return n.op === "+" ? a + b : n.op === "-" ? a - b : n.op === "*" ? a * b : a / b; }
  }
};

type Laid = { id: number; x: number; y: number; label: string; kind: "num" | "id" | "op" };
function layout(root: Node) {
  const nodes: Laid[] = [], edges: [number, number][] = [];
  let leaf = 0, maxD = 0;
  const go = (n: Node, d: number): { id: number; x: number } => {
    maxD = Math.max(maxD, d);
    const id = nodes.length;
    nodes.push({ id, x: 0, y: d, label: "", kind: "op" });
    const kids: { id: number; x: number }[] = [];
    if (n.t === "num") { nodes[id].label = String(n.v); nodes[id].kind = "num"; nodes[id].x = leaf++; return { id, x: nodes[id].x }; }
    if (n.t === "id") { nodes[id].label = n.v; nodes[id].kind = "id"; nodes[id].x = leaf++; return { id, x: nodes[id].x }; }
    if (n.t === "bin") { nodes[id].label = n.op; kids.push(go(n.l, d + 1), go(n.r, d + 1)); }
    if (n.t === "neg") { nodes[id].label = "−"; kids.push(go(n.e, d + 1)); }
    if (n.t === "set") { nodes[id].label = "="; const v = nodes.length; nodes.push({ id: v, x: leaf++, y: d + 1, label: n.name, kind: "id" }); maxD = Math.max(maxD, d + 1); kids.push({ id: v, x: nodes[v].x }, go(n.e, d + 1)); }
    nodes[id].x = kids.reduce((a, k) => a + k.x, 0) / kids.length;
    kids.forEach((k) => edges.push([id, k.id]));
    return { id, x: nodes[id].x };
  };
  go(root, 0);
  return { nodes, edges, cols: Math.max(1, leaf), rows: maxD + 1 };
}

const EXAMPLES = ["total = 2 + 3 * (4 - 1)", "area = 3.14 * r * r", "(1 + 2) * (3 + 4)", "10 / (5 - 5)"];

type Out =
  | { ok: false; err: string; at: number }
  | { ok: true; toks: Tok[]; ast: Node; tree: ReturnType<typeof layout>; c: string; free: string[]; val: number };

function CompilerDemo() {
  const [src, setSrc] = useState(EXAMPLES[0]);
  const out: Out = (() => {
    try {
      const toks = lex(src);
      if (!toks.length) return { ok: false, err: "Type an expression to compile.", at: 0 };
      const ast = parse(toks);
      return { ok: true, toks, ast, tree: layout(ast), c: emit(ast), free: [...unknowns(ast)], val: evaluate(ast) };
    } catch (e) {
      if (e instanceof SyntaxErr) return { ok: false, err: e.message, at: e.at };
      throw e;
    }
  })();
  const W = 76, Hh = 50;
  return (
    <div className="demo comp">
      <label className="comp-in">
        <span className="sr-only">Expression to compile</span>
        <input value={src} maxLength={34} spellCheck={false} autoComplete="off" onChange={(e) => setSrc(e.target.value)} aria-describedby="comp-msg" aria-invalid={!out.ok} />
      </label>
      <div className="demo-btns comp-ex">
        {EXAMPLES.map((e) => <button key={e} type="button" className="chip-btn" onClick={() => setSrc(e)}>{e}</button>)}
      </div>
      <p id="comp-msg" className={`comp-msg${out.ok ? "" : " bad"}`} role="status" aria-live="polite">
        {out.ok ? "The source compiles. Each stage below is the real output." : <>{out.err} <span className="dim">Position {out.at + 1}.</span></>}
      </p>
      <div className={`comp-flow${out.ok ? "" : " dead"}`}>
        <section className="stage">
          <h4>1. Lexer <span>text to tokens</span></h4>
          <p className="toks">{out.ok ? out.toks.map((t, i) => <span key={`${i}${t.text}`} className={`tk tk-${t.type}`} style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>{t.text}</span>) : <span className="dim">–</span>}</p>
        </section>
        <span className="comp-arrow" aria-hidden />
        <section className="stage">
          <h4>2. Parser <span>tokens to tree</span></h4>
          {out.ok ? (
            <svg className="ast" viewBox={`0 0 ${out.tree.cols * W} ${out.tree.rows * Hh}`} style={{ aspectRatio: `${out.tree.cols * W} / ${out.tree.rows * Hh}`, maxHeight: out.tree.rows * 56 }} role="img" aria-label={`Syntax tree with ${out.tree.nodes.length} nodes. The expression compiles to ${out.c}`}>
              {out.tree.edges.map(([a, b]) => {
                const A = out.tree.nodes[a], B = out.tree.nodes[b];
                return <path key={`${a}-${b}`} className="ast-e" d={`M${(A.x + 0.5) * W} ${A.y * Hh + Hh / 2}C${(A.x + 0.5) * W} ${A.y * Hh + Hh * 0.9} ${(B.x + 0.5) * W} ${B.y * Hh + Hh * 0.1} ${(B.x + 0.5) * W} ${B.y * Hh + Hh / 2}`} />;
              })}
              {out.tree.nodes.map((n) => (
                <g key={n.id} className={`ast-n ast-${n.kind}`} style={{ animationDelay: `${n.y * 90}ms` }}>
                  <rect x={(n.x + 0.5) * W - Math.max(17, n.label.length * 5 + 10)} y={n.y * Hh + Hh / 2 - 17} width={Math.max(34, n.label.length * 10 + 20)} height="34" rx="17" />
                  <text x={(n.x + 0.5) * W} y={n.y * Hh + Hh / 2 + 4.5} textAnchor="middle">{n.label.length > 7 ? n.label.slice(0, 6) + "…" : n.label}</text>
                </g>
              ))}
            </svg>
          ) : <span className="dim">–</span>}
        </section>
        <span className="comp-arrow" aria-hidden />
        <section className="stage">
          <h4>3. Generator <span>tree to C</span></h4>
          <pre className="code">{out.ok ? (out.ast.t === "set" ? out.c : `double result = ${out.c};`) : "–"}</pre>
          <p className="comp-val">
            {out.ok ? (out.free.length ? <>Needs a value for <b>{out.free.join(", ")}</b> before it can run.</> : !Number.isFinite(out.val) ? <>Cannot divide by zero.</> : <>Running it gives <b className="tnum">{+out.val.toFixed(6)}</b>.</>) : ""}
          </p>
        </section>
      </div>
    </div>
  );
}

/* ================================================================ 4. LRU cache */

const CLANS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const WEIGHTS = [30, 25, 16, 10, 7, 6, 4, 2];
const CAP = 4;

function CacheDemo({ on }: { on: boolean }) {
  const [slots, setSlots] = useState<string[]>(["A", "B"]);
  const [leaving, setLeaving] = useState<string[]>([]);
  const [stat, setStat] = useState({ hit: 0, miss: 0 });
  const [note, setNote] = useState("Ask for a clan. Recent answers stay in the cache.");
  const [busy, setBusy] = useState<string | null>(null);
  const slotsRef = useRef(slots);
  const userAt = useRef(0);
  const reduce = useRef(false);
  useEffect(() => { slotsRef.current = slots; }, [slots]);
  useEffect(() => { reduce.current = prefersReducedMotion(); }, []);

  const ask = useCallback((k: string, fromUser = false) => {
    if (fromUser) userAt.current = performance.now();
    const cur = slotsRef.current;
    if (cur.includes(k)) {
      setSlots([k, ...cur.filter((x) => x !== k)]);
      setStat((s) => ({ ...s, hit: s.hit + 1 }));
      setNote(`Clan ${k}: hit. The answer was already here, about 2 ms (modelled).`);
      return;
    }
    setBusy(k);
    setNote(`Clan ${k}: miss. Asking the official API, about 400 ms (modelled)…`);
    window.setTimeout(() => {
      setBusy(null);
      const now = slotsRef.current;
      const next = [k, ...now];
      const dropped = next.length > CAP ? next[next.length - 1] : null;
      setSlots(next.slice(0, CAP));
      setStat((s) => ({ ...s, miss: s.miss + 1 }));
      setNote(dropped ? `Clan ${k}: stored. Clan ${dropped} had gone longest without a request, so it was evicted.` : `Clan ${k}: stored in the cache.`);
      if (dropped) { setLeaving((l) => [...l, dropped]); window.setTimeout(() => setLeaving((l) => l.filter((x) => x !== dropped)), 500); }
    }, reduce.current ? 0 : 520);
  }, []);

  useEffect(() => {
    if (!on || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (performance.now() - userAt.current < 12000) return;
      let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0), i = 0;
      while (r > WEIGHTS[i]) r -= WEIGHTS[i++];
      ask(CLANS[i]);
    }, 1300);
    return () => window.clearInterval(id);
  }, [on, ask]);

  const total = stat.hit + stat.miss;
  return (
    <div className="demo cache">
      <div className="cache-asks" role="group" aria-label="Ask for a clan">
        {CLANS.map((c) => <button key={c} type="button" className="chip-btn" disabled={busy !== null} onClick={() => ask(c, true)}>Clan {c}</button>)}
      </div>
      <div className="cache-row">
        <span className="cache-end">You</span>
        <div className={`cache-wire${busy ? " go" : ""}`} aria-hidden />
        <div className="cache-box">
          <p className="cache-cap">Cache, holds {CAP}. Newest on the left.</p>
          <div className="cache-slots">
            {Array.from({ length: CAP }, (_, i) => <span key={i} className="cache-ph" />)}
            {slots.map((k, i) => <span key={k} className={`cache-it${slots[0] === k ? " fresh" : ""}`} style={{ "--i": i } as CSSProperties}>Clan {k}</span>)}
            {leaving.filter((k) => !slots.includes(k)).map((k) => <span key={`x${k}`} className="cache-it out" style={{ "--i": CAP } as CSSProperties}>Clan {k}</span>)}
          </div>
        </div>
        <div className={`cache-wire${busy ? " go slow" : ""}`} aria-hidden />
        <span className={`cache-end api${busy ? " busy" : ""}`}>Official API</span>
      </div>
      <div className="demo-bar">
        <p className="demo-read" role="status" aria-live="polite">{note}</p>
        <p className="demo-read tnum"><b>{stat.hit}</b> hits, <b>{stat.miss}</b> misses{total ? <>, hit rate <b>{Math.round((stat.hit / total) * 100)}%</b></> : null}</p>
      </div>
    </div>
  );
}

/* ================================================================ 5. token bucket */

const BUCKET = 10, REFILL = 2, HIST = 90;
type Ev = "ok" | "deny" | null;

function BucketDemo({ on }: { on: boolean }) {
  const b = useRef({ tokens: BUCKET, t: 0, hist: Array.from({ length: HIST }, () => BUCKET) as number[], ev: Array.from({ length: HIST }, () => null) as Ev[], pending: null as Ev });
  const [view, setView] = useState({ tokens: BUCKET, hist: b.current.hist, ev: b.current.ev, ok: 0, deny: 0, last: "" });
  const counts = useRef({ ok: 0, deny: 0, last: "" });

  const refill = () => {
    const s = b.current, now = performance.now();
    if (s.t) s.tokens = Math.min(BUCKET, s.tokens + ((now - s.t) / 1000) * REFILL);
    s.t = now;
  };
  const send = useCallback((n = 1) => {
    refill();
    const s = b.current;
    for (let i = 0; i < n; i++) {
      if (s.tokens >= 1) { s.tokens -= 1; counts.current.ok++; counts.current.last = "200 OK"; s.pending = s.pending === "deny" ? "deny" : "ok"; }
      else { counts.current.deny++; counts.current.last = "429 Too Many Requests"; s.pending = "deny"; }
    }
    if (prefersReducedMotion()) publish(true);
  }, []);

  const publish = (force = false) => {
    const s = b.current;
    refill();
    if (force || !prefersReducedMotion()) {
      s.hist = [...s.hist.slice(1), s.tokens]; s.ev = [...s.ev.slice(1), s.pending]; s.pending = null;
    }
    setView({ tokens: s.tokens, hist: s.hist, ev: s.ev, ok: counts.current.ok, deny: counts.current.deny, last: counts.current.last });
  };

  useEffect(() => {
    if (!on || prefersReducedMotion()) return;
    b.current.t = performance.now();
    let tick = 0;
    const id = window.setInterval(() => {
      tick++;
      if (tick % 7 === 0) send(1);                 // steady traffic: about 1.4 requests a second, under the refill rate
      if (tick % 75 === 40) { send(12); }           // now and then, a burst
      publish();
    }, 100);
    return () => window.clearInterval(id);
  }, [on, send]);

  const H = 100, Wd = 360;
  const pts = view.hist.map((v, i) => `${(i / (HIST - 1)) * Wd},${H - 10 - (v / BUCKET) * (H - 22)}`).join(" ");
  return (
    <div className="demo bucket">
      <svg className="bk-chart" viewBox={`0 0 ${Wd} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Tokens in the bucket over the last nine seconds. Now ${view.tokens.toFixed(1)} of ${BUCKET}.`}>
        <line className="bk-cap" x1="0" x2={Wd} y1={H - 10 - (H - 22)} y2={H - 10 - (H - 22)} />
        <line className="bk-zero" x1="0" x2={Wd} y1={H - 10} y2={H - 10} />
        <polyline className="bk-area" points={`0,${H - 10} ${pts} ${Wd},${H - 10}`} />
        <polyline className="bk-line" points={pts} />
        {view.ev.map((e, i) => e && <line key={i} className={`bk-tick ${e}`} x1={(i / (HIST - 1)) * Wd} x2={(i / (HIST - 1)) * Wd} y1={H - 8} y2={H} />)}
      </svg>
      <div className="bk-cells" aria-hidden>
        {Array.from({ length: BUCKET }, (_, i) => <span key={i} className="bk-cell"><i style={{ transform: `scaleY(${Math.max(0, Math.min(1, view.tokens - i))})` }} /></span>)}
      </div>
      <div className="demo-bar">
        <p className="demo-read" role="status" aria-live="polite">
          <b className="tnum">{view.tokens.toFixed(1)}</b> of {BUCKET} tokens, refilling {REFILL} a second (modelled). {view.last ? <>Last answer: <b className={view.last.startsWith("429") ? "deny" : "ok"}>{view.last}</b>.</> : "Send a request to spend a token."}
        </p>
        <div className="demo-btns">
          <button type="button" className="chip-btn" onClick={() => send(1)}>Send a request</button>
          <button type="button" className="chip-btn" onClick={() => send(12)}>Send a burst of 12</button>
          <span className="demo-read tnum"><b>{view.ok}</b> allowed, <b>{view.deny}</b> refused</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ the section */

const DEMOS = [
  {
    id: "path", tab: "Shortest path", project: "Smart Escape", concept: "Dijkstra’s algorithm",
    what: "Dijkstra’s algorithm explores outward from where you stand, always taking the cheapest unexplored cell next. The first open exit it reaches is therefore the nearest one. Block a corridor and it plans again.",
    mine: "Smart Escape finds the lowest-cost route to an open exit and recalculates as corridors or exits are blocked.",
    tryIt: "Drag across the grid to draw walls. Click an exit to close it, or use Block the route.",
  },
  {
    id: "evolve", tab: "Evolution", project: "TradingSpark", concept: "Genetic algorithm",
    what: "A genetic algorithm keeps a population of candidate settings. Each generation the better ones are chosen, mixed and nudged by random mutation, so the population climbs the score map without anyone pointing at the peak.",
    mine: "TradingSpark breeds thousands of trading-strategy variants this way, then forward-tests the survivors on data they have never seen. The map here is a made-up landscape, not market data.",
    tryIt: "Set mutation to 0 and the population gets stuck on the nearest hill. Raise it and it explores more.",
  },
  {
    id: "compiler", tab: "Compiler", project: "BongoScript", concept: "Lexing, parsing and code generation",
    what: "A compiler is a pipeline. The lexer cuts text into tokens, the parser arranges them into a tree that respects precedence, and the generator walks the tree to write C. This one is about eighty lines of TypeScript.",
    mine: "BongoScript is a programming language with Bangla keywords, transpiled to C with Flex and Bison. I built it with a team for the compiler design course.",
    tryIt: "Edit the line. Try brackets, a missing operand or a stray character, and see which stage complains.",
  },
  {
    id: "cache", tab: "Cache", project: "ClanWar Coach", concept: "LRU cache",
    what: "A cache keeps recent answers close so repeat questions are instant. When it is full, least-recently-used eviction drops the entry that nobody has asked for the longest.",
    mine: "ClanWar Coach serves Clash of Clans stats through a caching proxy for the official API. Times on this screen are modelled, not measured.",
    tryIt: "Ask for the same clan twice, then for five different ones in a row and watch the oldest go.",
  },
  {
    id: "bucket", tab: "Rate limit", project: "Mosque Admin Panel", concept: "Token bucket",
    what: "A token bucket allows short bursts but caps the average rate. Every request spends a token, tokens refill at a fixed speed, and an empty bucket answers 429 Too Many Requests.",
    mine: "Mosque Admin Panel protects its login and forms with role-based access, CSRF protection and rate limiting. The numbers here are a model, not that app’s settings.",
    tryIt: "Send a burst of 12 and watch the bucket empty, then refill.",
  },
] as const;
type DemoId = (typeof DEMOS)[number]["id"];

export default function Lab() {
  const [id, setId] = useState<DemoId>("path");
  const [boxRef, on] = useOnScreen<HTMLDivElement>("0px");
  const d = DEMOS.find((x) => x.id === id)!;
  const p = proj(d.project);
  const link = p?.live ?? p?.code;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = DEMOS.findIndex((x) => x.id === id);
    const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % DEMOS.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + DEMOS.length - 1) % DEMOS.length : e.key === "Home" ? 0 : e.key === "End" ? DEMOS.length - 1 : -1;
    if (n < 0) return;
    e.preventDefault();
    setId(DEMOS[n].id);
    document.getElementById(`lab-tab-${DEMOS[n].id}`)?.focus();
  };

  return (
    <section id="lab" className="sec lab" aria-labelledby="lab-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="lab-title">Computer science, running</h2>
          <p className="sec-lede">
            Five ideas from the projects above, small enough to poke at. Each one solves a problem I met while building the real thing.
          </p>
        </header>

        <div className="lab-box" ref={boxRef}>
          <div className="lab-tabs" role="tablist" aria-label="Computer science demos" onKeyDown={onKey}>
            {DEMOS.map((x) => (
              <button key={x.id} id={`lab-tab-${x.id}`} type="button" role="tab" aria-selected={x.id === id} aria-controls="lab-panel" tabIndex={x.id === id ? 0 : -1} onClick={() => setId(x.id)}>
                <span>{x.tab}</span><small>{x.project}</small>
              </button>
            ))}
          </div>

          <div id="lab-panel" role="tabpanel" aria-labelledby={`lab-tab-${id}`} className="lab-panel">
            <div className="lab-screen">
              {id === "path" && <PathDemo on={on} />}
              {id === "evolve" && <EvolveDemo on={on} />}
              {id === "compiler" && <CompilerDemo />}
              {id === "cache" && <CacheDemo on={on} />}
              {id === "bucket" && <BucketDemo on={on} />}
            </div>
            <div className="lab-text">
              <h3>{d.concept}</h3>
              <p>{d.what}</p>
              <p className="lab-mine"><b>In my work.</b> {d.mine}{link && <> <a href={link} target="_blank" rel="noreferrer">{p?.live ? "Open the live project" : "See the code"}<span className="sr-only"> for {d.project}</span></a>.</>}</p>
              <p className="lab-try"><b>Try this.</b> {d.tryIt}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
