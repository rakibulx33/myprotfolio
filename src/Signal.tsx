import { useEffect, useMemo, useState } from "react";
import { services, type Line } from "./data";

/* The hero figure. My thesis (non-intrusive load monitoring) takes one electricity meter's reading and
   splits it into the appliances behind it. This draws one illustrative day of "load" the same way: the
   ink line is the single reading, the coloured bands under it are the four kinds of work it is made of.

   Everything here is deterministic, so the server and the browser draw the same SVG, and the intro is
   pure CSS: it plays on first paint, before (and without) JavaScript. */

const W = 1200;
const H = 400;
const N = 288; // one sample every five minutes
const TOP = 34; // headroom above the highest peak
const BOTTOM = 2;

const bump = (x: number, mu: number, s: number) => Math.exp(-0.5 * ((x - mu) / s) ** 2);
const step = (x: number, a: number, b: number, k = 0.004) => 1 / (1 + Math.exp(-(x - a) / k)) - 1 / (1 + Math.exp(-(x - b) / k));

/** One day of load per kind of work, x from 00:00 (0) to 24:00 (1). Shapes borrowed from real appliances. */
const LOAD: Record<Line, (x: number) => number> = {
  // A steady base load that cycles, like a fridge compressor: always on, quietly doing the heavy lifting.
  backend: (x) => 0.92 + 0.07 * Math.sin(2 * Math.PI * x * 2) + 0.16 * [0, 1, 2, 3, 4, 5, 6, 7].reduce((s, i) => s + step(x, i / 8 + 0.02, i / 8 + 0.07), 0),
  // A small constant trickle with a blip every hour, like sensors reporting in.
  iot: (x) => 0.42 + 0.03 * Math.sin(2 * Math.PI * x * 24) + 0.1 * Array.from({ length: 24 }, (_, i) => bump(x, i / 24 + 0.01, 0.0018)).reduce((a, b) => a + b, 0),
  // Scheduled jobs: a nightly batch at 02:00, short runs every three hours, more during office hours.
  automation: (x) => 0.18 + 0.38 * step(x, 0.375, 0.75, 0.02) + 0.95 * step(x, 0.078, 0.11) + 0.42 * [1, 2, 3, 4, 5, 6, 7].reduce((s, i) => s + step(x, i / 8, i / 8 + 0.012), 0),
  // Shoppers: quiet at night, a lunchtime rise, and the big evening peak around 9 pm.
  commerce: (x) => 0.1 + 0.5 * bump(x, 0.45, 0.06) + 0.62 * bump(x, 0.6, 0.05) + 1.3 * bump(x, 0.875, 0.045),
};

/** Bottom to top: steady loads first, spiky ones on top, as a disaggregation plot would stack them. */
const STACK: Line[] = ["backend", "iot", "automation", "commerce"];

/** Where each band's label sits (fraction of the day), chosen where that band is thick. */
const LABEL_AT: Record<Line, number> = { backend: 0.2, iot: 0.665, automation: 0.53, commerce: 0.875 };

const SHORT = Object.fromEntries(services.map((s) => [s.key, s.short])) as Record<Line, string>;

function build() {
  const xs = Array.from({ length: N + 1 }, (_, i) => i / N);
  const layers: number[][] = [];
  let acc = xs.map(() => 0);
  for (const key of STACK) {
    const top = xs.map((x, i) => acc[i] + LOAD[key](x));
    layers.push(top);
    acc = top;
  }
  const max = Math.max(...acc);
  const sx = (x: number) => +(x * W).toFixed(1);
  const sy = (v: number) => Math.round(H - BOTTOM - (v / max) * (H - TOP - BOTTOM));

  const bands = STACK.map((key, k) => {
    const upper = layers[k];
    const lower = k ? layers[k - 1] : xs.map(() => 0);
    const up = xs.map((x, i) => `${sx(x)},${sy(upper[i])}`).join(" L");
    const down = xs.map((x, i) => `${sx(x)},${sy(lower[i])}`).reverse().join(" L");
    const at = Math.round(LABEL_AT[key] * N);
    return {
      key,
      d: `M${up} L${down} Z`,
      label: { left: (at / N) * 100, top: ((sy(upper[at]) + sy(lower[at])) / 2 / H) * 100 },
    };
  });
  const trace = "M" + xs.map((x, i) => `${sx(x)},${sy(acc[i])}`).join(" L");
  // The label for the single reading floats just above the early-morning dip, where there is clear space.
  const a = Math.round(0.235 * N), b = Math.round(0.34 * N);
  // Where the background circuit wires in: mains into the reading on the left, four outputs out on the right.
  const feedIn = (sy(acc[0]) / H) * 100;
  const feedsOut = STACK.map((key, k) => ({ key, y: ((sy(layers[k][N]) + sy(k ? layers[k - 1][N] : 0)) / 2 / H) * 100 }));
  const traceY = acc.map((v) => (sy(v) / H) * 100);
  return { bands, trace, reading: { left: (a / N) * 100, top: (Math.min(...acc.slice(a, b).map(sy)) / H) * 100 }, feedIn, feedsOut, traceY };
}

const HOURS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

/** A tiny neural network (3 inputs, 4 hidden, 4 outputs), the outputs in the four band colours. */
const NN_IN = [8, 17, 26];
const NN_MID = [5, 13, 21, 29];
const NN_OUT: [number, Line][] = [[5, "commerce"], [13, "automation"], [21, "iot"], [29, "backend"]];
function NeuralNet() {
  return (
    <svg className="nn" viewBox="0 0 52 34" aria-hidden focusable="false">
      <g className="nn-edges">
        {NN_IN.map((a) => NN_MID.map((b) => <line key={`a${a}${b}`} x1="7" y1={a} x2="26" y2={b} />))}
        {NN_MID.map((a) => NN_OUT.map(([b]) => <line key={`b${a}${b}`} x1="26" y1={a} x2="45" y2={b} />))}
      </g>
      {NN_IN.map((y) => <circle key={`i${y}`} className="nn-n nn-l0" cx="7" cy={y} r="2.6" />)}
      {NN_MID.map((y) => <circle key={`h${y}`} className="nn-n nn-l1" cx="26" cy={y} r="2.6" />)}
      {NN_OUT.map(([y, key]) => <circle key={`o${y}`} className={`nn-n nn-l2 ph-${key}`} cx="45" cy={y} r="2.9" />)}
    </svg>
  );
}

/** Time of day in Dhaka as a fraction of 24 hours, or null on the server and before mount. */
function useDhakaDay() {
  const [f, setF] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
      const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0), m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
      setF((h * 60 + m) / 1440);
    };
    read();
    const id = window.setInterval(read, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return f;
}

export default function Signal({ active, onActive }: { active: Line | null; onActive: (l: Line | null) => void }) {
  const { bands, trace, reading, feedIn, feedsOut, traceY } = useMemo(build, []);
  const now = useDhakaDay();
  const nowY = now == null ? 0 : traceY[Math.round(now * N)];
  return (
    <figure className={`sig${active ? " has-active" : ""}`} aria-labelledby="sig-cap">
      <div
        className="sig-plot"
        onMouseLeave={() => onActive(null)}
        data-feed-in={feedIn.toFixed(2)}
        data-feeds-out={feedsOut.map((f) => `${f.key}:${f.y.toFixed(2)}`).join(",")}
      >
        <svg className="sig-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden focusable="false">
          <defs>
            <clipPath id="sig-wipe">
              <rect className="sig-wipe" x="0" y="0" width={W} height={H} />
            </clipPath>
            <clipPath id="sig-reveal">
              <rect className="sig-reveal" x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>
          {HOURS.map((_, i) => (
            <line key={i} className="sig-grid" x1={(i / 4) * W} x2={(i / 4) * W} y1="0" y2={H} />
          ))}
          <g className="sig-bands" clipPath="url(#sig-reveal)">
            {bands.map((b, i) => (
              <path
                key={b.key}
                d={b.d}
                className={`sig-band ph-${b.key}${active === b.key ? " on" : ""}`}
                style={{ ["--i" as string]: i }}
                onMouseEnter={() => onActive(b.key)}
              />
            ))}
          </g>
          <path className="sig-trace" d={trace} clipPath="url(#sig-wipe)" />
        </svg>
        <div className="sig-labels" aria-hidden>
          {bands.map((b, i) => (
            <span
              key={b.key}
              className={`sig-label ph-${b.key}${active === b.key ? " on" : ""}`}
              style={{ left: `${b.label.left}%`, top: `${b.label.top}%`, ["--x" as string]: (b.label.left / 100).toFixed(3), ["--i" as string]: i }}
            >
              {SHORT[b.key]}
            </span>
          ))}
          <span className="sig-reading" style={{ left: `${reading.left}%`, top: `${reading.top}%` }}>One reading</span>
        </div>
        {/* The model sweeps the day once (CSS only), splitting the reading as it goes. */}
        <div className="sig-win sig-scan" aria-hidden><span className="sig-chip"><NeuralNet /></span></div>
        {/* Then it reads live, at the current time in Dhaka. */}
        {now != null && (
          <div className="sig-win sig-now" aria-hidden style={{ left: `${now * 100}%`, ["--y" as string]: `${nowY}%` }}>
            <span className="sig-chip"><NeuralNet /></span>
            <span className="sig-dot" />
          </div>
        )}
      </div>
      <div className="sig-axis" aria-hidden>
        {HOURS.map((h) => <span key={h}>{h}</span>)}
      </div>
      {/* On narrow screens the bands are too thin to label inside, so a key takes their place. */}
      <ul className="sig-key" aria-hidden>
        <li className="sig-key-trace"><i />One reading</li>
        {[...STACK].reverse().map((k) => <li key={k} className={`ph-${k}`}><i />{SHORT[k]}</li>)}
      </ul>
      <figcaption id="sig-cap" className="sig-cap">
        My thesis uses machine learning to split one electricity meter’s reading into the appliances behind it. Here a small
        model does the same with my work: one day, four kinds of load, read live at the current time in Dhaka.
      </figcaption>
    </figure>
  );
}
