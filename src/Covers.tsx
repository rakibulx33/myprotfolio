import type { CSSProperties, ReactNode } from "react";
import { useOnScreen } from "./hooks";

/* The picture at the top of each featured project card. Each one is a small line drawing of what the project
   does, drawn in SVG and animated with CSS (styles under ".cv" in styles.css): data flows along traces, candles
   grow, a waveform plays. They only move while they are on screen. Everything is deterministic, so the server
   and the browser draw the same picture. */

const i = (n: number) => ({ ["--i" as string]: n }) as CSSProperties;

/** BuildIoT BD: a chip in the middle of a board, wired to the parts the store sells and to a cart. */
function Store() {
  return (
    <>
      <path className="flow s1" d="M170 86H110V52H78" /><path className="flow s1" d="M170 114H110V148H78" />
      <path className="flow s2" d="M230 86H290V52H322" /><path className="flow s3" d="M230 114H290V148H318" />
      <g className="s1"><rect x="170" y="70" width="60" height="60" rx="9" /><rect className="beat f1" x="188" y="88" width="24" height="24" rx="4" />
        {[82, 100, 118].map((y) => <path key={y} d={`M162 ${y}h8M230 ${y}h8`} />)}{[184, 200, 216].map((x) => <path key={x} d={`M${x} 62v8M${x} 130v8`} />)}</g>
      <path className="sd" d="M40 52h8l4-8 6 16 6-16 6 16 4-8h4" />
      <g className="sd"><path d="M44 148h14M58 138v20l14-10zM72 138v20M72 148h6" /></g>
      <g className="s2"><path d="M322 52h10M336 42v20M342 42v20M346 52h10" /></g>
      <g className="s3"><path d="M318 136h8l6 20h22l5-14h-30" /><circle className="blink f3" style={i(0)} cx="336" cy="163" r="2.5" /><circle className="blink f3" style={i(1)} cx="351" cy="163" r="2.5" /></g>
    </>
  );
}

/** TradingSpark: candles growing across a chart, with the average drawn through them. */
const CANDLES = [[118, 30, 1], [126, 22, 0], [112, 34, 1], [96, 28, 1], [104, 20, 0], [88, 36, 1], [70, 30, 1], [82, 24, 0], [64, 38, 1], [74, 22, 0], [56, 34, 1], [44, 30, 1], [52, 20, 0], [36, 32, 1]];
function Trade() {
  return (
    <>
      {[60, 100, 140].map((y) => <path key={y} className="sd faint" d={`M30 ${y}H370`} />)}
      {CANDLES.map(([top, h, up], k) => {
        const x = 44 + k * 24;
        return (
          <g key={k} className={`candle ${up ? "s1" : "s2"}`} style={i(k)}>
            <path d={`M${x} ${top - 10}V${top + h + 10}`} />
            <rect className={up ? "f1" : "f2"} x={x - 6} y={top} width="12" height={h} rx="2" />
          </g>
        );
      })}
      <path className="draw s3" pathLength={1} d="M44 140C90 150 110 118 140 122S190 104 212 96 262 92 284 76 330 66 356 50" />
    </>
  );
}

/** ShopTalk: a customer's message, the assistant typing a reply, and the voice between them. */
function Talk() {
  return (
    <>
      <g className="s2 bob" style={i(0)}><path d="M40 44h92a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H70l-16 14v-14H40a10 10 0 0 1-10-10V54a10 10 0 0 1 10-10z" /><path className="sd" d="M48 62h70M48 76h44" /></g>
      <g className="s1 bob" style={i(1)}><path d="M268 96h92a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10h-14v14l-16-14h-62a10 10 0 0 1-10-10v-30a10 10 0 0 1 10-10z" />
        {[0, 1, 2].map((k) => <circle key={k} className="blink f1" style={i(k)} cx={296 + k * 18} cy="121" r="4" />)}</g>
      {Array.from({ length: 13 }, (_, k) => <rect key={k} className="bar f3" style={i(k)} x={160 + k * 7} y={70 + (k % 4) * 6} width="3.5" height={60 - (k % 4) * 12} rx="1.75" />)}
    </>
  );
}

/** Replixon: three channels flowing into one inbox, with the assistant's spark above it. */
function Inbox() {
  return (
    <>
      {[[50, "s2"], [100, "s1"], [150, "s3"]].map(([y, c]) => (
        <g key={y} className={c as string}>
          <circle cx="52" cy={y} r="15" /><circle className={`beat ${(c as string).replace("s", "f")}`} cx="52" cy={y} r="4" />
          <path className="flow" d={`M68 ${y}C150 ${y} 170 100 262 100`} />
        </g>
      ))}
      <g className="sd"><rect x="262" y="58" width="96" height="84" rx="10" /></g>
      {[0, 1, 2].map((k) => <path key={k} className="msg s1" style={i(k)} d={`M276 ${78 + k * 22}h${[64, 48, 56][k]}`} />)}
      <path className="beat s3 f3" d="M344 26l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
    </>
  );
}

/** InstaMiner: an admin panel, a phone app and a backend, talking to each other. */
function Mobile() {
  return (
    <>
      <g className="sd"><rect x="34" y="56" width="92" height="88" rx="8" /><path d="M34 74h92" /></g>
      {[0, 1, 2, 3].map((k) => <rect key={k} className="bar f2" style={i(k * 2)} x={50 + k * 18} y={96 + (k % 2) * 8} width="9" height={36 - (k % 2) * 16} rx="2" />)}
      <path className="flow s2" d="M126 100h44" /><path className="flow s1" d="M230 100h44" />
      <g className="s1"><rect x="170" y="30" width="60" height="140" rx="12" /><path d="M192 42h16" /><circle className="beat f1" cx="200" cy="100" r="13" /><path className="sd" d="M184 134h32M184 146h20" /></g>
      {[0, 1, 2].map((k) => (
        <g key={k} className="s3"><rect x="274" y={52 + k * 34} width="92" height="26" rx="6" /><circle className="blink f3" style={i(k)} cx="288" cy={65 + k * 34} r="3" /><path className="sd" d={`M300 ${65 + k * 34}h52`} /></g>
      ))}
    </>
  );
}

/** Tender Package Builder: loose pages on the left become one checked, ordered package on the right. */
function Docs() {
  return (
    <>
      {[[-12, 0], [-2, 1], [9, 2]].map(([rot, k]) => (
        <g key={k} className="bob" style={i(k)}>
          <g className={k === 1 ? "s2" : "sd"} transform={`rotate(${rot} 92 100)`}><rect x="58" y="52" width="68" height="96" rx="6" /><path d="M70 72h44M70 88h44M70 104h30" /></g>
        </g>
      ))}
      <path className="flow s3" d="M150 100h84" /><path className="s3" d="M226 92l10 8-10 8" />
      <g className="s1"><rect x="262" y="44" width="80" height="112" rx="8" /><path d="M254 52v112h80" /><path className="sd" d="M276 66h52M276 82h52" /></g>
      <circle className="beat s1" cx="302" cy="118" r="17" /><path className="draw s1" pathLength={1} d="M293 118l7 7 12-14" />
    </>
  );
}

const ART: Record<string, () => ReactNode> = {
  "BuildIoT BD": Store, TradingSpark: Trade, ShopTalk: Talk, Replixon: Inbox, InstaMiner: Mobile, "Tender Package Builder": Docs,
};

/** The cover for a project, or nothing if it has no drawing yet. */
export function Cover({ name }: { name: string }) {
  const [ref, on] = useOnScreen<HTMLDivElement>("0px");
  const Art = ART[name];
  if (!Art) return null;
  return (
    <div className={`cv${on ? " live" : ""}`} ref={ref} aria-hidden>
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet" focusable="false"><Art /></svg>
    </div>
  );
}
