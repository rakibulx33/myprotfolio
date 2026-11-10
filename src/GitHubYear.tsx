import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import gh from "./github.json";
import { LINKS } from "./data";
import { prefersReducedMotion, useInView } from "./hooks";
import { Words } from "./motion";

/* A year of GitHub contributions: the weekly total drawn on top, one cell per day
   below. src/github.json is fetched from GitHub before every build and refreshed every hour by the
   deploy workflow (scripts/fetch-github.mjs), so the page never waits on a third-party API.

   When it scrolls into view, a sweep line crosses the year once: the profile draws behind it, each
   day lights up as it passes and the totals count up. Without JavaScript, everything is simply shown. */

type Day = { date: string; count: number; level: number };
type Data = {
  fetchedAt: string;
  total: number;
  days: Day[];
  breakdown: { private: number } | null;
  publicRepos: number | null;
};
const DATA = gh as unknown as Data;

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 30; // room for weekday labels
const AREA_H = 86;
const GRID_Y = AREA_H + 16;
const SWEEP_S = 2.2;

/** Fixed buckets rather than GitHub's quartiles, so one huge day doesn't flatten the rest of the year. */
const bucket = (c: number) => (c <= 0 ? 0 : c <= 2 ? 1 : c <= 6 ? 2 : c <= 19 ? 3 : 4);
const BUCKET_LABEL = ["No contributions", "1–2", "3–6", "7–19", "20 or more"];

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const fmtShort = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const n = (v: number) => v.toLocaleString("en-US");

/** Smooth line through the weekly totals that never overshoots below zero (monotone cubic). */
function monotone(pts: [number, number][]) {
  const k = pts.length;
  if (k < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < k - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  const t: number[] = [m[0]];
  for (let i = 1; i < k - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[k - 1] = m[k - 2];
  for (let i = 0; i < k - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); t[i] = s * a * m[i]; t[i + 1] = s * b * m[i]; }
  }
  const f = (v: number) => +v.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < k - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], h = dx[i];
    d += ` C${f(x0 + h / 3)},${f(y0 + (t[i] * h) / 3)} ${f(x1 - h / 3)},${f(y1 - (t[i + 1] * h) / 3)} ${f(x1)},${f(y1)}`;
  }
  return d;
}

function model(days: Day[]) {
  const pad = new Date(`${days[0].date}T00:00:00Z`).getUTCDay(); // columns start on Sunday, like GitHub's
  const cells = days.map((d, i) => ({ ...d, col: Math.floor((i + pad) / 7), row: (i + pad) % 7, b: bucket(d.count) }));
  const cols = cells[cells.length - 1].col + 1;
  const weekly = Array.from({ length: cols }, () => 0);
  cells.forEach((c) => { weekly[c.col] += c.count; });

  const months: { col: number; label: string }[] = [];
  cells.forEach((c) => {
    if (c.date.endsWith("-01") && (!months.length || c.col - months[months.length - 1].col >= 3) && c.col <= cols - 2) {
      months.push({ col: c.col, label: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`${c.date}T00:00:00Z`)) });
    }
  });

  let best = 0, run = 0;
  for (const c of cells) { run = c.count > 0 ? run + 1 : 0; best = Math.max(best, run); }
  const busiest = cells.reduce((a, c) => (c.count > a.count ? c : a), cells[0]);
  const active = cells.filter((c) => c.count > 0).length;

  const monthly = new Map<string, number>();
  for (const c of cells) monthly.set(c.date.slice(0, 7), (monthly.get(c.date.slice(0, 7)) ?? 0) + c.count);

  const width = LEFT + cols * STEP - GAP;
  const height = GRID_Y + 7 * STEP - GAP + 22;
  const maxWeek = Math.max(1, ...weekly);
  const cx = (col: number) => LEFT + col * STEP + CELL / 2;
  const pts = weekly.map((v, col) => [cx(col), AREA_H - (v / maxWeek) * (AREA_H - 8)] as [number, number]);
  const line = monotone(pts);
  const area = `${line} L${cx(cols - 1)},${AREA_H} L${cx(0)},${AREA_H} Z`;
  const peak = { x: cx(busiest.col), y: pts[busiest.col][1] };

  return { cells, cols, pad, months, best, busiest, active, monthly: [...monthly], width, height, line, area, peak };
}

/** "Updated 12 minutes ago", starting from a fixed date so the server and browser render the same text. */
function Synced({ iso }: { iso: string }) {
  const absolute = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(new Date(iso));
  const [text, setText] = useState(`on ${absolute} (Dhaka)`);
  useEffect(() => {
    const tick = () => {
      const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
      setText(mins < 2 ? "just now" : mins < 60 ? `${mins} minutes ago` : mins < 48 * 60 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"} ago` : `on ${absolute} (Dhaka)`);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [iso, absolute]);
  return <time dateTime={iso}>{text}</time>;
}

/** Counts from 0 to `to` over the sweep once `run` turns true. Renders the final value until then. */
function useCount(to: number, run: boolean) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!run || prefersReducedMotion()) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (SWEEP_S * 1000));
      setV(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return v;
}

export default function GitHubYear() {
  const m = useMemo(() => model(DATA.days), []);
  const [ref, run] = useInView<HTMLDivElement>("0px 0px -20% 0px");
  const scroller = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const total = useCount(DATA.total, run);
  const active = useCount(m.active, run);
  const priv = DATA.breakdown?.private ?? 0;

  // On narrow screens the year scrolls sideways; start at the most recent weeks.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  // Which day is under the pointer, worked out from its position (no element per day needed).
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const k = r.width / m.width; // the figure scales with the page
    const x = (e.clientX - r.left) / k - LEFT, y = (e.clientY - r.top) / k - GRID_Y;
    const col = Math.floor(x / STEP), row = Math.floor(y / STEP);
    const i = col * 7 + row - m.pad;
    if (x < 0 || y < 0 || row > 6 || x % STEP > CELL || y % STEP > CELL || i < 0 || i >= m.cells.length) { setTip(null); return; }
    const c = m.cells[i];
    setTip({
      x: (LEFT + col * STEP + CELL / 2) * k,
      y: (GRID_Y + row * STEP) * k,
      text: `${c.count === 0 ? "No" : n(c.count)} contribution${c.count === 1 ? "" : "s"} on ${fmtDay(c.date)}`,
    });
  };

  const peakRight = m.busiest.col > m.cols - 10;

  return (
    <section id="github" className="sec gy-sec" aria-labelledby="github-title">
      <span className="sec-ghost" data-drift="-0.22" aria-hidden>commits</span>
      <div className="wrap">
        <header className="sec-head reveal">
          <p className="sec-cmd"><span aria-hidden>~$ </span><span className="sec-typed">git log --graph</span></p>
          <h2 id="github-title"><Words text="A year on GitHub" /></h2>
          <p className="sec-lede">
            <strong className="gy-total">{n(total)}</strong> contributions in the last twelve months
            {priv > 0 ? <>. {n(priv)} of them are in private client repositories, which GitHub counts without showing the code.</> : "."}
          </p>
        </header>

        <figure className="gy-card">
        <div ref={ref} className={`gy${run ? " run" : ""}`} style={{ ["--sweep" as string]: `${SWEEP_S}s` }}>
          <div className="gy-scroll" ref={scroller}>
            <div className="gy-canvas" style={{ ["--left" as string]: `${(LEFT / m.width) * 100}%` }}>
              <svg
                className="gy-svg"
                viewBox={`0 0 ${m.width} ${m.height}`}
                role="img"
                aria-label={`GitHub contributions over the last year: ${n(DATA.total)} in total, ${m.active} active days, the busiest day ${fmtDay(m.busiest.date)} with ${m.busiest.count}.`}
                onPointerMove={onMove}
                onPointerLeave={() => setTip(null)}
              >
                <defs>
                  <clipPath id="gy-wipe">
                    <rect className="gy-wipe" x="0" y="0" width={m.width} height={GRID_Y} />
                  </clipPath>
                  <pattern id="gy-day" x={LEFT} y={GRID_Y} width={STEP} height={STEP} patternUnits="userSpaceOnUse">
                    <rect className="gy-c0" width={CELL} height={CELL} rx="2" />
                  </pattern>
                </defs>

                <g clipPath="url(#gy-wipe)">
                  <path className="gy-area" d={m.area} />
                  <path className="gy-line" d={m.line} />
                </g>
                <line className="gy-base" x1={LEFT} x2={m.width} y1={AREA_H + 0.5} y2={AREA_H + 0.5} />

                <g className="gy-peak" style={{ ["--d" as string]: `${((m.busiest.col / m.cols) * SWEEP_S).toFixed(2)}s` }}>
                  <circle cx={m.peak.x} cy={m.peak.y} r="3.5" />
                  <text x={m.peak.x + (peakRight ? -8 : 8)} y={Math.max(12, m.peak.y + 4)} textAnchor={peakRight ? "end" : "start"}>
                    {m.busiest.count} on {fmtShort(m.busiest.date)}
                  </text>
                </g>

                {[["Mon", 1], ["Wed", 3], ["Fri", 5]].map(([d, row]) => (
                  <text key={d} className="gy-wk" x="0" y={GRID_Y + (row as number) * STEP + CELL - 1.5}>{d}</text>
                ))}

                <rect x={LEFT} y={GRID_Y} width={m.cols * STEP - GAP} height={7 * STEP - GAP} fill="url(#gy-day)" />
                <g className="gy-mask" transform={`translate(0 ${GRID_Y})`}>
                  {Array.from({ length: m.pad }, (_, r) => <rect key={`a${r}`} x={LEFT - 1} y={r * STEP - 1} width={CELL + 2} height={CELL + 2} />)}
                  {Array.from({ length: 6 - m.cells[m.cells.length - 1].row }, (_, k) => {
                    const r = m.cells[m.cells.length - 1].row + 1 + k;
                    return <rect key={`z${r}`} x={LEFT + (m.cols - 1) * STEP - 1} y={r * STEP - 1} width={CELL + 2} height={CELL + 2} />;
                  })}
                </g>
                <g className="gy-on" transform={`translate(0 ${GRID_Y})`} aria-hidden>
                  {m.cells.map((c) => c.b > 0 && (
                    <rect key={c.date} className={`gy-c${c.b} gy-day`} x={LEFT + c.col * STEP} y={c.row * STEP} width={CELL} height={CELL} rx="2"
                      style={{ ["--d" as string]: `${((c.col / m.cols) * SWEEP_S).toFixed(2)}s` }} />
                  ))}
                  <rect className="gy-today" x={LEFT + m.cells[m.cells.length - 1].col * STEP - 1.5} y={m.cells[m.cells.length - 1].row * STEP - 1.5} width={CELL + 3} height={CELL + 3} rx="3" />
                </g>

                {m.months.map((mo) => (
                  <text key={mo.col} className="gy-mo" x={LEFT + mo.col * STEP} y={GRID_Y + 7 * STEP + 12}>{mo.label}</text>
                ))}
              </svg>
              <span className="gy-sweep" aria-hidden />
              {tip && (
                <span className="gy-tip" role="presentation" style={{ left: tip.x, top: tip.y }}>{tip.text}</span>
              )}
            </div>
          </div>

          <div className="gy-legend" aria-hidden>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((b) => <i key={b} className={`gy-c${b}`} title={BUCKET_LABEL[b]} />)}
            <span>More</span>
          </div>
        </div>
        <figcaption className="gy-cap">
          <p className="gy-cap-t">Contribution pulse</p>
          <p>GitHub contributions over the last twelve months. One square per day, with the weekly total drawn above.</p>
        </figcaption>
        </figure>

        <dl className="gy-facts">
          <div><dt>Active days</dt><dd>{n(active)}</dd></div>
          <div><dt>Longest streak</dt><dd>{m.best} days</dd></div>
          <div><dt>Busiest day</dt><dd>{m.busiest.count} on {fmtShort(m.busiest.date)}</dd></div>
          {DATA.publicRepos != null && <div><dt>Public repositories</dt><dd>{DATA.publicRepos}</dd></div>}
        </dl>

        <ul className="sr-only">
          {m.monthly.map(([ym, v]) => (
            <li key={ym}>{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`))}: {v} contributions</li>
          ))}
        </ul>

        <p className="gy-foot">
          Synced with GitHub <Synced iso={DATA.fetchedAt} />, and refreshed every hour.{" "}
          <a href={LINKS.github} target="_blank" rel="noreferrer">See my GitHub profile</a>
        </p>
      </div>
    </section>
  );
}
