import { useEffect, useRef, type ReactNode } from "react";
import type { Line, Project } from "./data";
import { prefersReducedMotion, useInView } from "./hooks";

/* The gallery: every featured project hangs as a two-colour screen print (a risograph poster), drawn
   by code from the project itself. The ink says the kind of work; the picture says what it does
   (candles for the trading system, speech bubbles for the shop assistant, a stack of pages for the
   tender builder). Inks overprint with `multiply`, as they do on paper, and the second ink sits a
   hair out of register. Everything is deterministic, so the server and the browser draw the same thing. */

/** Two inks per kind of work. `text` is the darker one, used for the small print. */
export const INKS: Record<Line, { a: string; b: string; text: "a" | "b"; name: string }> = {
  backend: { a: "#0078bf", b: "#ff48b0", text: "a", name: "Blue" },
  commerce: { a: "#ff48b0", b: "#ffb511", text: "a", name: "Fluorescent pink" },
  automation: { a: "#ff6c2f", b: "#0078bf", text: "b", name: "Orange" },
  iot: { a: "#00838a", b: "#ffb511", text: "a", name: "Teal" },
};

const W = 400;
const M = 28;
const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
/** Font size that fits the longest line into `width` (Libre Franklin Black runs about 0.6 em per letter). */
const fit = (lines: string[], width: number, max: number) => Math.min(max, width / (Math.max(...lines.map((l) => l.length)) * 0.6));

function Title({ lines, x, y, size, anchor = "start" }: { lines: string[]; x: number; y: number; size: number; anchor?: "start" | "end" }) {
  return (
    <text className="p-title" x={x} y={y} fontSize={size.toFixed(1)} textAnchor={anchor}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i ? (size * 0.9).toFixed(1) : 0}>{l}</tspan>)}
    </text>
  );
}
function Micro({ lines, x, y, anchor = "start" }: { lines: string[]; x: number; y: number; anchor?: "start" | "end" }) {
  return (
    <text className="p-micro" x={x} y={y} textAnchor={anchor}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i ? 14 : 0}>{l}</tspan>)}
    </text>
  );
}

type Drawing = { a: ReactNode; b: ReactNode; small: ReactNode };
type Ctx = { p: Project; H: number; A: string; B: string; r: () => number; words: string[] };

/* ---------------------------------------------------------------- one picture per project */

const DRAW: Record<string, (c: Ctx) => Drawing> = {
  // Shelves of parts, some of them in stock.
  "BuildIoT BD": ({ p, H, r, words }) => {
    const s = 56, g = 12, y0 = 96, cells = Array.from({ length: 20 }, (_, i) => i);
    const stocked = cells.filter(() => r() < 0.38);
    const size = fit(words, W - 2 * M, 96);
    const title = <Title lines={words} x={M} y={H - M - size * 0.9 * (words.length - 1)} size={size} />;
    return {
      b: <>{cells.map((i) => <rect key={i} x={M + (i % 5) * (s + g)} y={y0 + Math.floor(i / 5) * (s + g)} width={s} height={s} rx="7" />)}{title}</>,
      a: <>{stocked.map((i) => <circle key={i} cx={M + (i % 5) * (s + g) + s / 2} cy={y0 + Math.floor(i / 5) * (s + g) + s / 2} r={s * 0.4} />)}{title}</>,
      small: <><Micro lines={[p.kind]} x={M} y={52} /><Micro lines={p.stack} x={W - M} y={52} anchor="end" /></>,
    };
  },

  // A market in candles, with a moving average running through it.
  TradingSpark: ({ p, H, A, B, r, words }) => {
    const n = 14, step = (W - 2 * M) / n, closes: number[] = [];
    let price = 0.5;
    const candles = Array.from({ length: n }, (_, i) => {
      const open = price, close = Math.min(0.95, Math.max(0.05, price + (r() - 0.42) * 0.26));
      price = close; closes.push(close);
      return { i, open, close, hi: Math.max(open, close) + r() * 0.07, lo: Math.min(open, close) - r() * 0.07 };
    });
    const size = fit(words, W - 2 * M, 64);
    const lo = Math.min(...candles.map((c) => c.lo)), hi = Math.max(...candles.map((c) => c.hi));
    const top = M + size + 64, bottom = H - M;
    const y = (v: number) => bottom - ((v - lo) / (hi - lo || 1)) * (bottom - top);
    const cx = (i: number) => M + step * i + step / 2;
    const ma = closes.map((_, i) => { const w = closes.slice(Math.max(0, i - 2), i + 1); return w.reduce((s, v) => s + v, 0) / w.length; });
    const maPath = ma.map((v, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const candle = (c: (typeof candles)[number], ink: string) => (
      <g key={c.i}>
        <line x1={cx(c.i)} x2={cx(c.i)} y1={y(c.hi)} y2={y(c.lo)} stroke={ink} strokeWidth="2.5" />
        <rect x={cx(c.i) - 7} y={y(Math.max(c.open, c.close))} width="14" height={Math.max(4, Math.abs(y(c.open) - y(c.close)))} rx="1.5" />
      </g>
    );
    const title = <Title lines={words} x={M} y={M + size * 0.78} size={size} />;
    return {
      a: <>{candles.filter((c) => c.close >= c.open).map((c) => candle(c, A))}{title}</>,
      b: <>{candles.filter((c) => c.close < c.open).map((c) => candle(c, B))}<path d={maPath} fill="none" stroke={B} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />{title}</>,
      small: <Micro lines={[p.kind, p.stack.join(", ")]} x={M} y={M + size + 14} />,
    };
  },

  // Two speech bubbles and a voice.
  ShopTalk: ({ p, H, A, words }) => {
    const size = fit(words, W - 2 * M, 92);
    const title = <Title lines={words} x={M} y={H - M} size={size} />;
    return {
      a: <>
        <circle cx="232" cy="206" r="122" /><path d="M150 296 L104 382 L206 318 Z" />
        {[152, 178, 204].map((rad) => <path key={rad} d={`M${232 + rad * Math.cos(-0.5)} ${206 + rad * Math.sin(-0.5)} A${rad} ${rad} 0 0 1 ${232 + rad * Math.cos(0.5)} ${206 + rad * Math.sin(0.5)}`} fill="none" stroke={A} strokeWidth="7" strokeLinecap="round" />)}
        {title}
      </>,
      b: <><circle cx="146" cy="292" r="86" /><path d="M196 352 L238 414 L176 368 Z" />{title}</>,
      small: <><Micro lines={[p.kind]} x={M} y={46} /><Micro lines={p.stack} x={W - M} y={46} anchor="end" /></>,
    };
  },

  // Messages from every channel, flowing into one inbox.
  Replixon: ({ p, H, B, r, words }) => {
    const inbox = { x: 200, y: H - 138, r: 96 };
    const sources = [[62, 112], [150, 78], [252, 96], [342, 126]];
    const size = fit(words, W - 2 * M, 84);
    const title = <Title lines={words} x={M} y={H * 0.47} size={size} />;
    return {
      a: <><circle cx={inbox.x} cy={inbox.y} r={inbox.r} />{title}</>,
      b: <>
        {sources.map(([sx, sy], k) => (
          <g key={k}>
            {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={sx + (r() - 0.5) * 46} cy={sy + (r() - 0.5) * 40} r={5 + r() * 6} />)}
            <path d={`M${sx} ${sy} C${sx} ${sy + 160} ${inbox.x} ${inbox.y - 180} ${inbox.x + (k - 1.5) * 18} ${inbox.y}`} fill="none" stroke={B} strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ))}
        {title}
      </>,
      small: <><Micro lines={[p.kind]} x={M} y={H - M} /><Micro lines={p.stack} x={W - M} y={H - M - 28} anchor="end" /></>,
    };
  },

  // A phone full of posts, in front of a big round "like".
  InstaMiner: ({ p, H, words }) => {
    const size = fit(words, W - 2 * M, 90);
    const title = <Title lines={words} x={M} y={H - M} size={size} />;
    const posts = Array.from({ length: 12 }, (_, i) => <rect key={i} x={188 + (i % 3) * 40} y={112 + Math.floor(i / 3) * 40} width="34" height="34" rx="4" />);
    return {
      a: <><rect x="172" y="74" width="152" height="292" rx="28" />{title}</>,
      b: <><circle cx="128" cy="206" r="104" />{posts}{title}</>,
      small: <Micro lines={[p.kind, p.stack.join(", ")]} x={M} y={46} />,
    };
  },

  // The tender package: pages checked, ordered and stacked behind a cover.
  "Tender Package Builder": ({ p, H, B, words }) => {
    const pages = Array.from({ length: 5 }, (_, i) => ({ i, x: 196 + i * 18, y: H - 30 - 140 - i * 16 }));
    const size = fit(words, 150, 60);
    const title = <Title lines={words} x={M} y={M + size * 0.78} size={size} />;
    const cover = pages[pages.length - 1];
    return {
      a: <>{pages.filter((g) => g.i % 2 === 0).map((g) => <rect key={g.i} x={g.x} y={g.y} width="104" height="140" rx="3" />)}{title}</>,
      b: <>
        {pages.filter((g) => g.i % 2 === 1).map((g) => <rect key={g.i} x={g.x} y={g.y} width="104" height="140" rx="3" />)}
        {[22, 40, 52, 64, 76, 88].map((dy, k) => <line key={dy} x1={cover.x + 14} x2={cover.x + (k ? 82 : 66)} y1={cover.y + dy} y2={cover.y + dy} stroke={B} strokeWidth={k ? 3 : 7} strokeLinecap="round" />)}
        {title}
      </>,
      small: <Micro lines={[p.kind, ...p.stack]} x={M} y={M + size * 0.9 * (words.length - 1) + size + 18} />,
    };
  },
};

/** For any project without its own picture: a sun and its reflection. */
const fallback = ({ p, H, words }: Ctx): Drawing => {
  const size = fit(words, W - 2 * M, 88);
  const title = <Title lines={words} x={M} y={H - M - size * 0.9 * (words.length - 1)} size={size} />;
  return {
    a: <><circle cx={W * 0.6} cy={H * 0.36} r={W * 0.33} />{title}</>,
    b: <><circle cx={W * 0.36} cy={H * 0.48} r={W * 0.25} />{title}</>,
    small: <Micro lines={[p.kind]} x={M} y={46} />,
  };
};

/** One poster. `ratio` is height over width. It prints itself (first ink, then the second, settling into register) the first time it is seen. */
export function Poster({ project, ratio }: { project: Project; ratio: number }) {
  const [ref, seen] = useInView<SVGSVGElement>("0px 0px -12% 0px");
  const ink = INKS[project.line ?? "backend"];
  const H = Math.round(W * ratio);
  const words = project.name.split(" ");
  const ctx: Ctx = { p: project, H, A: ink.a, B: ink.b, r: rng(hash(project.name)), words };
  const d = (DRAW[project.name] ?? fallback)(ctx);
  return (
    <svg ref={ref} className={`poster${seen ? " printed" : ""}`} viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
      <rect className="p-paper" width={W} height={H} />
      <g className="ink ink-a" fill={ink.a} filter="url(#riso)">{d.a}</g>
      <g className="ink ink-b" fill={ink.b} filter="url(#riso)">{d.b}</g>
      <g className="ink ink-small" fill={ink.text === "a" ? ink.a : ink.b}>{d.small}</g>
    </svg>
  );
}

/** A small printed swatch of a kind of work's two inks. */
export function InkChip({ line }: { line: Line }) {
  const ink = INKS[line];
  return (
    <svg className="chip" viewBox="0 0 64 64" aria-hidden focusable="false">
      <g className="ink" fill={ink.a} filter="url(#riso)"><circle cx="26" cy="32" r="22" /></g>
      <g className="ink" fill={ink.b} filter="url(#riso)"><circle cx="40" cy="32" r="18" /></g>
    </svg>
  );
}

/** The ink texture shared by every print: the ink is mostly solid, with the speckled gaps of a stencil print. */
export function RisoDefs() {
  return (
    <svg className="defs" width="0" height="0" aria-hidden focusable="false">
      <filter id="riso" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  10 0 0 0 -2.8" result="speck" />
        <feComposite in="SourceGraphic" in2="speck" operator="in" />
      </filter>
    </svg>
  );
}

/** In load-shedding mode the gallery lights are out, and on a desktop the pointer becomes a torch. */
export function Torch() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0, x = 0, y = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty("--tx", `${x}px`);
        el.style.setProperty("--ty", `${y}px`);
        el.classList.add("on");
      });
    };
    const leave = () => el.classList.remove("on");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="torch" aria-hidden />;
}
