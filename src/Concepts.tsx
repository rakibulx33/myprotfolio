import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Line } from "./data";
import { prefersReducedMotion, useOnScreen } from "./hooks";

/* Small, animated diagrams of real computer-science ideas, one per section. Each one is drawn from the work
   it sits beside (a request path for the backend work, a state machine for the store, and so on) and only
   animates while it is on screen. Without motion they are plain, complete diagrams. */

/** Wraps a figure and marks it active while it is on screen, so its CSS animations can pause when it is not. */
export function Live({ className = "", children, as: Tag = "div", style }: { className?: string; children: ReactNode; as?: "div" | "figure" | "span"; style?: CSSProperties }) {
  const [ref, on] = useOnScreen<HTMLElement>();
  return (
    <Tag ref={ref as never} className={`cx ${className}`} data-active={on ? "" : undefined} style={style}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------ the four kinds of work */

const SINE = Array.from({ length: 59 }, (_, i) => {
  const x = 4 + i * 4;
  return `${i ? "L" : "M"}${x} ${(36 - 20 * Math.sin(((x - 4) / 232) * Math.PI * 4)).toFixed(1)}`;
}).join(" ");

const STAIR = (() => {
  const w = 232 / 14;
  let d = "";
  for (let k = 0; k < 14; k++) {
    const x = 4 + k * w;
    const v = Math.round(Math.sin(((x + w / 2 - 4) / 232) * Math.PI * 4) * 3) / 3;
    const y = (36 - 20 * v).toFixed(1);
    d += `${k ? "L" : "M"}${x.toFixed(1)} ${y} L${(x + w).toFixed(1)} ${y} `;
  }
  return d;
})();

export const CONCEPT: Record<Line, { name: string; text: string }> = {
  backend: { name: "Request and response", text: "A request goes down through the layers and the answer comes back." },
  commerce: { name: "Finite state machine", text: "An order is always in exactly one state, and only certain moves are allowed." },
  automation: { name: "Agent loop", text: "An event wakes a model, the model picks a tool, the result goes out." },
  iot: { name: "Sampling and quantizing", text: "A smooth signal is read at fixed moments and rounded to whole levels." },
};

export function ServiceGlyph({ line }: { line: Line }) {
  return (
    <Live className={`glyph ph-${line}`}>
      <svg viewBox="0 0 240 72" role="presentation" aria-hidden focusable="false">
        {line === "backend" && (
          <>
            {[["client", 4], ["API", 90], ["DB", 176]].map(([t, x]) => (
              <g key={t as string} className={`g-box${t === "DB" ? " g-db" : ""}`}>
                <rect x={x as number} y="16" width="60" height="40" rx="6" />
                <text x={(x as number) + 30} y="40" textAnchor="middle">{t}</text>
              </g>
            ))}
            <path className="g-lane" d="M64 28H90M150 28H176M64 44H90M150 44H176" />
            <circle className="g-req" cx="64" cy="28" r="3.2" />
            <circle className="g-res" cx="236" cy="44" r="3.2" />
          </>
        )}
        {line === "commerce" && (
          <>
            <path className="g-lane" d="M39 30H77M99 30H137M159 30H197" />
            {[["cart", 28], ["paid", 88], ["packed", 148], ["sent", 208]].map(([t, x], i) => (
              <g key={t as string}>
                <circle className="g-state" cx={x as number} cy="30" r="11" style={{ animationDelay: `${i * 1.5}s` }} />
                <text className="g-label" x={x as number} y="62" textAnchor="middle">{t}</text>
              </g>
            ))}
            <circle className="g-token" cx="28" cy="30" r="5" />
          </>
        )}
        {line === "automation" && (
          <>
            <path className="g-lane" d="M44 36H82M128 30L172 16M128 42L172 56" />
            <g className="g-box"><rect x="4" y="22" width="40" height="28" rx="6" /><text x="24" y="40" textAnchor="middle">event</text></g>
            <g className="g-box g-llm"><rect x="82" y="16" width="46" height="40" rx="6" /><text x="105" y="34" textAnchor="middle">LLM</text>
              <circle cx="95" cy="45" r="1.8" /><circle cx="105" cy="45" r="1.8" /><circle cx="115" cy="45" r="1.8" />
            </g>
            <g className="g-box"><rect x="172" y="4" width="64" height="24" rx="6" /><text x="204" y="20" textAnchor="middle">tool</text></g>
            <g className="g-box"><rect x="172" y="44" width="64" height="24" rx="6" /><text x="204" y="60" textAnchor="middle">reply</text></g>
            <circle className="g-p1" cx="44" cy="36" r="3.2" />
            <circle className="g-p2" cx="128" cy="30" r="3.2" />
            <circle className="g-p3" cx="128" cy="42" r="3.2" />
          </>
        )}
        {line === "iot" && (
          <>
            <path className="g-axis" d="M4 36H236" />
            <clipPath id="iot-reveal"><rect className="g-reveal" x="4" y="0" width="236" height="72" /></clipPath>
            <path className="g-stair" d={STAIR} clipPath="url(#iot-reveal)" />
            <path className="g-sine" d={SINE} />
            <path className="g-clock" d="M4 8V64" />
          </>
        )}
      </svg>
    </Live>
  );
}

/* ------------------------------------------------------------ sister companies as a bus */

const COMPANIES: { name: string; line: Line }[] = [
  { name: "Gikpik", line: "backend" },
  { name: "BuildIoT BD", line: "commerce" },
  { name: "BuildIoT Lab", line: "iot" },
];

/** Three companies on one bus, the way devices share a bus: a message goes out from engineering and one node picks it up. */
export function CompanyBus() {
  return (
    <Live className="net" as="figure">
      {[false, true].map((vertical) => {
        const W = vertical ? 300 : 720, H = vertical ? 240 : 132;
        return (
          <svg key={String(vertical)} className={vertical ? "net-v" : "net-h"} viewBox={`0 0 ${W} ${H}`} role="presentation" aria-hidden focusable="false">
            <g className="g-box g-hub">
              {vertical ? (
                <>
                  <rect x="6" y="4" width="150" height="48" rx="7" />
                  <text x="81" y="25" textAnchor="middle">Rakibul Hasan</text>
                  <text className="g-sub" x="81" y="42" textAnchor="middle">engineering</text>
                </>
              ) : (
                <>
                  <rect x="6" y="72" width="138" height="48" rx="7" />
                  <text x="75" y="93" textAnchor="middle">Rakibul Hasan</text>
                  <text className="g-sub" x="75" y="110" textAnchor="middle">engineering</text>
                </>
              )}
            </g>
            <path className="g-bus" d={vertical ? "M36 52V228" : "M144 96H664"} />
            {COMPANIES.map((c, i) => {
              const d = { "--d": `${i * 2}s` } as CSSProperties;
              if (vertical) {
                const cy = 86 + i * 68;
                const pk = { ...d, "--p1x": "0px", "--p1y": `${cy - 52}px`, "--p2x": "36px", "--p2y": `${cy - 52}px`, "--p3x": "36px", "--p3y": `${cy - 52}px` } as CSSProperties;
                return (
                  <g key={c.name} className={`net-node ph-${c.line}`} style={d}>
                    <path className="g-lane" d={`M36 ${cy}H72`} />
                    <rect x="72" y={cy - 22} width="214" height="44" rx="7" />
                    <text x="88" y={cy + 5} textAnchor="start">{c.name}</text>
                    <circle className="g-junction" cx="36" cy={cy} r="4" />
                    <circle className="g-pkt" cx="36" cy="52" r="3.6" style={pk} />
                  </g>
                );
              }
              const cx = 250 + i * 190;
              const pk = { ...d, "--p1x": "0px", "--p1y": "0px", "--p2x": `${cx - 144}px`, "--p2y": "0px", "--p3x": `${cx - 144}px`, "--p3y": "-38px" } as CSSProperties;
              return (
                <g key={c.name} className={`net-node ph-${c.line}`} style={d}>
                  <path className="g-lane" d={`M${cx} 96V54`} />
                  <rect x={cx - 82} y="8" width="164" height="46" rx="7" />
                  <text x={cx} y="37" textAnchor="middle">{c.name}</text>
                  <circle className="g-junction" cx={cx} cy="96" r="4" />
                  <circle className="g-pkt" cx="144" cy="96" r="3.6" style={pk} />
                </g>
              );
            })}
          </svg>
        );
      })}
      <figcaption><b>Bus topology.</b> Three companies share one engineering line. A message leaves it and exactly one company picks it up.</figcaption>
    </Live>
  );
}

/* ------------------------------------------------------------ contact: the handshake */

export function Handshake() {
  return (
    <Live className="hs" as="figure">
      <svg viewBox="0 0 360 206" role="img" aria-label="A three-step handshake: you send a brief, I reply with questions and a plan, you agree the scope, and then we build.">
        <path className="hs-life" d="M52 34V176M308 34V176" />
        <text className="hs-who" x="52" y="18" textAnchor="middle">You</text>
        <text className="hs-who" x="308" y="18" textAnchor="middle">Me</text>

        <g className="hs-a">
          <path className="hs-arrow" d="M52 62H300" /><path className="hs-head" d="M300 62l-8-5v10z" />
          <text className="hs-cap" x="180" y="54" textAnchor="middle">Send a brief</text>
          <text className="hs-code" x="180" y="78" textAnchor="middle">SYN</text>
        </g>
        <g className="hs-b">
          <path className="hs-arrow" d="M308 112H60" /><path className="hs-head" d="M60 112l8-5v10z" />
          <text className="hs-cap" x="180" y="104" textAnchor="middle">I reply with questions and a plan</text>
          <text className="hs-code" x="180" y="128" textAnchor="middle">SYN-ACK</text>
        </g>
        <g className="hs-c">
          <path className="hs-arrow" d="M52 162H300" /><path className="hs-head" d="M300 162l-8-5v10z" />
          <text className="hs-cap" x="180" y="154" textAnchor="middle">You agree the scope</text>
          <text className="hs-code" x="180" y="178" textAnchor="middle">ACK</text>
        </g>
        <g className="hs-open">
          <circle cx="132" cy="196" r="4" />
          <text className="hs-cap" x="144" y="200">Connection open, we build</text>
        </g>
      </svg>
      <figcaption><b>The handshake.</b> TCP opens a connection in three steps, and each side confirms it before data flows. Working together starts the same way.</figcaption>
    </Live>
  );
}

/* ------------------------------------------------------------ research: presence sensing */

const N = 140;
const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += Math.random(); return (s - 2) * 1.7; };

/** A modelled radio signal: a person moving through a room makes the signal strength jump around. */
export function PresenceDemo() {
  const [boxRef, on] = useOnScreen<HTMLDivElement>();
  const cv = useRef<HTMLCanvasElement>(null);
  const [present, setPresent] = useState(false);
  const [walkLeft, setWalkLeft] = useState(0);
  const redraw = useRef<() => void>(() => {});
  const sim = useRef({ rssi: [] as number[], level: [] as number[], walking: 0, hold: 0, present: false, nextAuto: 3.5 });
  const walk = (s = 3.6) => { sim.current.walking = s; };

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = sim.current;
    const reduce = prefersReducedMotion();
    let dpr = 1, w = 0, h = 0, raf = 0, last = 0, acc = 0;
    const css = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

    const push = (dt: number) => {
      s.walking = Math.max(0, s.walking - dt);
      const moving = s.walking > 0;
      const prev = s.rssi[s.rssi.length - 1] ?? -52;
      const target = moving ? -52 + Math.sin(performance.now() / 170) * 3.4 + gauss() * 2.2 : -52 + gauss() * 0.45;
      s.rssi.push(prev + (target - prev) * (moving ? 0.55 : 0.4));
      if (s.rssi.length > N) s.rssi.shift();
      const win = s.rssi.slice(-18);
      const mean = win.reduce((a, b) => a + b, 0) / win.length;
      const sd = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / win.length);
      s.level.push(sd);
      if (s.level.length > N) s.level.shift();
      if (sd > 1.6) s.hold = 1.1; else s.hold = Math.max(0, s.hold - dt);
      const now = s.hold > 0;
      if (now !== s.present) { s.present = now; setPresent(now); }
    };

    const draw = () => {
      if (!w) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const ink = css("--ink"), ink3 = css("--ink-3"), rule = css("--rule-2"), earth = css("--earth"), blue = css("--blue");
      const topH = h * 0.58, gap = 18;
      // signal strength
      ctx.lineWidth = 1; ctx.strokeStyle = rule; ctx.setLineDash([2, 4]);
      for (const v of [-58, -52, -46]) { const y = topH - ((v + 60) / 16) * topH; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.strokeStyle = blue; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.beginPath();
      s.rssi.forEach((v, i) => { const x = (i / (N - 1)) * w, y = topH - ((Math.max(-60, Math.min(-44, v)) + 60) / 16) * topH; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      // motion level with its threshold
      const y0 = topH + gap, bh = h - y0 - 2;
      const ty = y0 + bh - (1.6 / 4) * bh;
      ctx.fillStyle = s.present ? earth : ink3; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(0, y0 + bh);
      s.level.forEach((v, i) => { ctx.lineTo((i / (N - 1)) * w, y0 + bh - Math.min(1, v / 4) * bh); });
      ctx.lineTo(((s.level.length - 1) / (N - 1)) * w, y0 + bh); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = ink3; ctx.font = "12px Geologica Variable, system-ui, sans-serif"; ctx.textBaseline = "alphabetic";
      ctx.fillText("signal strength", 6, 14);
      ctx.fillText("motion level", 6, y0 + 14);
      ctx.fillStyle = ink; ctx.textAlign = "right"; ctx.fillText("threshold", w - 6, ty - 5); ctx.textAlign = "left";
    };

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(240, Math.round(r.width)); h = Math.round(r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      draw();
    };
    redraw.current = draw;
    // Start from a quiet room.
    for (let i = 0; i < N; i++) push(0.03);
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
      acc += dt;
      if (acc < 1 / 30) return;
      const step = acc; acc = 0;
      s.nextAuto -= step;
      if (s.nextAuto <= 0 && s.walking <= 0) { walk(); s.nextAuto = 9; }
      push(step);
      setWalkLeft(s.walking > 0 ? 1 : 0);
      draw();
    };
    if (!reduce && on) { last = performance.now(); raf = requestAnimationFrame(frame); }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [on]);

  const onWalk = () => {
    const s = sim.current;
    if (prefersReducedMotion()) { // no animation: fill the chart with a finished walk, once
      s.rssi.length = 0; s.level.length = 0;
      for (let i = 0; i < N; i++) {
        const moving = i > 70;
        const prev = s.rssi[i - 1] ?? -52;
        const target = moving ? -52 + Math.sin(i / 2.2) * 3.4 + gauss() * 2 : -52 + gauss() * 0.45;
        s.rssi.push(prev + (target - prev) * (moving ? 0.55 : 0.4));
        const win = s.rssi.slice(-18), m = win.reduce((x, y) => x + y, 0) / win.length;
        s.level.push(Math.sqrt(win.reduce((x, y) => x + (y - m) ** 2, 0) / win.length));
      }
      s.present = s.level[s.level.length - 1] > 1.6;
      setPresent(s.present);
      redraw.current();
      return;
    }
    walk(); sim.current.nextAuto = 12;
  };

  return (
    <figure className="pres" ref={boxRef as never}>
      <div className="pres-head">
        <p className={`pres-state${present ? " on" : ""}`} role="status" aria-live="polite">
          <span className="pres-dot" aria-hidden /> {present ? "Someone is moving in the room" : "The room is still"}
        </p>
        <button type="button" className="btn-text" onClick={onWalk} aria-describedby="pres-note">
          {walkLeft ? "Walking…" : "Walk through the room"}
        </button>
      </div>
      <canvas ref={cv} className="pres-cv" role="img" aria-label="Chart of a modelled Wi-Fi signal. When someone walks through, the signal strength jumps and the motion level crosses the threshold." />
      <figcaption id="pres-note">
        <b>Device-free presence sensing.</b> People disturb a radio signal as they move, so the spread of the signal tells you someone is there, with no camera and nothing worn. This is a simulated signal, not recorded data.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ the page as an address space */

const REGIONS: [string, string][] = [
  ["top", "boot"], ["services", "services"], ["work", "work"], ["lab", "lab"], ["process", "process"],
  ["companies", "companies"], ["research", "research"], ["github", "github"], ["skills", "stack"], ["contact", "contact"],
];

/** A program counter for the page: the scroll position as a 16-bit address, with the region you are reading. */
export function ProgramCounter() {
  const [state, setState] = useState({ pc: 0, region: "boot" });
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pc = Math.round(Math.min(1, window.scrollY / max) * 0xffff);
      let region = "boot";
      const probe = window.innerHeight * 0.4;
      for (const [id, name] of REGIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) region = name;
      }
      setState((p) => (p.pc === pc && p.region === region ? p : { pc, region }));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="pc" aria-hidden>
      <span className="pc-k">PC</span>
      <span className="pc-v">0x{state.pc.toString(16).toUpperCase().padStart(4, "0")}</span>
      <span className="pc-r">{state.region}</span>
      <span className="pc-bar"><i style={{ transform: `scaleX(${state.pc / 0xffff})` }} /></span>
    </div>
  );
}
