import { useState } from "react";
import { useInView } from "./hooks";
import { featuredProjects, lineNo, research, services, type Line, type Project } from "./data";

/* "Lines": the portfolio is drawn as a small metro network. Each kind of work is a line with a number and one
   colour; each project is a station on the line it belongs to, and a project that spans more than one kind
   of work is an interchange. The IoT line carries the research. Everything here is deterministic, so the server
   and the browser draw the same map. */

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const LINE_NAME = Object.fromEntries(services.map((s) => [s.key, s.short])) as Record<Line, string>;

/** Every line a project is on, in map order (top to bottom). */
export const linesOf = (p: Project): Line[] => {
  const set = new Set<Line>([...(p.line ? [p.line] : []), ...(p.also ?? [])]);
  return services.map((s) => s.key).filter((k) => set.has(k));
};

/** The numbered, coloured badge of a line, as on a platform sign. */
export function LineBadge({ line, full = true }: { line: Line; full?: boolean }) {
  return (
    <span className={`lb ln-${line}${full ? "" : " lb-n"}`}>
      <b aria-hidden>{lineNo(line)}</b>
      <span className={full ? undefined : "sr-only"}>{LINE_NAME[line]}</span>
    </span>
  );
}

/** The site's mark: the four lines meeting at one station. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" className="mark-bg" />
      <g strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M6 8.5h20" className="s-backend" />
        <path d="M6 14.2h20" className="s-automation" />
        <path d="M6 19.8h20" className="s-commerce" />
        <path d="M6 25.5h20" className="s-iot" />
      </g>
      <rect x="12.6" y="4.6" width="6.8" height="22.8" rx="3.4" className="mark-st" />
    </svg>
  );
}

/* ---------------------------------------------------------------- the map */

const W = 1200;
const H = 476;
const ROW: Record<Line, number> = { backend: 96, automation: 196, commerce: 296, iot: 396 };
const X0 = 236;
const XT = 1110; // the terminus, where every line ends: your project

/** Where each featured project stops. Its lines come from the data, so the map and the cards cannot disagree. */
const AT: Record<string, number> = {
  InstaMiner: 316,
  TradingSpark: 480,
  Replixon: 644,
  ShopTalk: 808,
  "BuildIoT BD": 560,
  "Tender Package Builder": 968,
};
const IOT_X = [316, 466, 616, 766, 916];

type Stop = { id: string; label: string; x: number; lines: Line[]; href: string; aria: string };

function stops(): Stop[] {
  const work = featuredProjects.filter((p) => AT[p.name] != null).map((p): Stop => {
    const lines = linesOf(p);
    return { id: p.name, label: p.name, x: AT[p.name], lines, href: `#p-${slug(p.name)}`, aria: `${p.name}, ${lines.map((l) => LINE_NAME[l]).join(" and ")}` };
  });
  const papers = research.map((r, i): Stop => ({ id: r.title, label: r.short, x: IOT_X[i] ?? IOT_X[IOT_X.length - 1], lines: ["iot"], href: "#research", aria: `${r.title}, research on the IoT line` }));
  return [...work, ...papers];
}

export function NetworkMap() {
  const [active, setActive] = useState<Line[] | null>(null);
  const [ref, seen] = useInView<SVGSVGElement>("0px 0px -12% 0px");
  const all = stops();
  const dim = (ls: Line[]) => (active && !ls.some((l) => active.includes(l)) ? " dim" : "");
  const on = (ls: Line[]) => ({
    onPointerEnter: () => setActive(ls),
    onPointerLeave: () => setActive(null),
    onFocus: () => setActive(ls),
    onBlur: () => setActive(null),
  });

  return (
    <svg ref={ref} className={`netmap${seen ? " run" : ""}`} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Route map: four lines of work, with my projects as stations" focusable="false">
      {/* the four tracks */}
      {services.map((s, i) => (
        <g key={s.key} className={`ln ln-${s.key}${dim([s.key])}`} style={{ ["--i" as string]: i }} {...on([s.key])}>
          <path className="track" d={`M${X0} ${ROW[s.key]}H${XT}`} pathLength={1} />
          <circle className="badge-c" cx={44} cy={ROW[s.key]} r={17} />
          <text className="badge-n" x={44} y={ROW[s.key] + 5.5} textAnchor="middle">{i + 1}</text>
          <text className="line-name" x={72} y={ROW[s.key] + 5.5}>{s.short}</text>
        </g>
      ))}

      {/* stations */}
      {all.map((st) => {
        const ys = st.lines.map((l) => ROW[l]);
        const top = Math.min(...ys), bottom = Math.max(...ys);
        const multi = st.lines.length > 1;
        return (
          <a key={st.id} href={st.href} className={`stop${multi ? " multi" : ""}${dim(st.lines)}`} aria-label={st.aria} {...on(st.lines)}>
            <rect className="stop-hit" x={st.x - 44} y={top - 44} width={88} height={bottom - top + 52} />
            <rect className="stop-dot" x={st.x - 13} y={top - 13} width={26} height={bottom - top + 26} rx={13} />
            {multi && st.lines.map((l) => <circle key={l} className={`stop-pip ln-${l}`} cx={st.x} cy={ROW[l]} r={4.5} />)}
            <text className="stop-label" x={st.x} y={top - 24} textAnchor="middle">{st.label}</text>
          </a>
        );
      })}

      {/* the terminus: every line ends at your project */}
      <a href="#contact" className="stop terminus" aria-label="Terminus: your project. Start a brief.">
        <rect className="stop-hit" x={XT - 70} y={ROW.backend - 70} width={140} height={ROW.iot - ROW.backend + 130} />
        <rect className="stop-dot" x={XT - 16} y={ROW.backend - 16} width={32} height={ROW.iot - ROW.backend + 32} rx={16} />
        {services.map((s) => <circle key={s.key} className="term-pip" cx={XT} cy={ROW[s.key]} r={5.5} />)}
        <text className="term-label" x={XT} y={ROW.backend - 32} textAnchor="middle">Your project</text>
        <text className="term-cta" x={XT} y={ROW.iot + 52} textAnchor="middle">Start a brief →</text>
      </a>
    </svg>
  );
}
