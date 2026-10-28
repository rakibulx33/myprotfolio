import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { companies, featuredProjects, moreProjects, research, services, skillGroups, LINKS, PORTRAIT, SOCIALS, PROCESS, HANDLE, type Project } from "./data";
import Hire from "./Hire";
import { HireDock, Matrix, Toaster, useKonami, useNudge } from "./Extras";
import { TOTAL, emit, unlock, useAchievementCount } from "./store";
import Terminal from "./Terminal";
import { prefersReducedMotion, useClock, useInView, useScramble, useTyped } from "./hooks";

const TABS = [
  { id: "top", label: "home" },
  { id: "services", label: "services" },
  { id: "projects", label: "projects" },
  { id: "companies", label: "companies" },
  { id: "research", label: "research" },
  { id: "skills", label: "skills" },
  { id: "contact", label: "contact" },
];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type Contrib = { date: string; count: number; level: number };

export default function Portfolio() {
  const [photoOn, setPhotoOn] = useState(false);
  const [glitch, setGlitch] = useState(0);
  const onPhoto = useCallback(() => setPhotoOn(true), []);
  const onCommand = useCallback(() => setGlitch((n) => n + 1), []);
  useKonami();
  useNudge();

  return (
    <>
      <a className="skip" href="#services">Skip to content</a>
      <TabBar />

      <header id="top" className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-stage wrap">
          <Terminal onPhoto={onPhoto} onCommand={onCommand} />
          <div className="win photo-win">
            <div className="win-bar">
              <span className="dots" aria-hidden><i /><i /><i /></span>
              <span className="win-title">profile.jpg</span>
              <span className="win-meta">1086×1448</span>
            </div>
            <PixelPhoto start={photoOn} glitch={glitch} />
          </div>
        </div>
        <a className="scroll-hint" href="#services">scroll or type <kbd>cd services</kbd></a>
      </header>

      <main>
        <Section id="services" onSeen={() => unlock("services")} cmd="cat services.txt" title="What I build"
          lede="I work as a freelance backend and automation developer for businesses and teams, remotely from Dhaka, Bangladesh.">
          <ul className="svc">
            {services.map((s, i) => (
              <Reveal as="li" key={s.title} i={i} className="svc-item">
                <h3><span className="c-cyan" aria-hidden>› </span>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </ul>
          <p className="links svc-cta">
            <button type="button" className="linkish" onClick={() => emit("hire")}>[start a project]</button>
            <a href="#projects">[see selected work]</a>
          </p>
        </Section>

        <Section id="process" cmd="cat process.md" title="How we'd work together"
          lede="From first message to launch, you always know what I'm building and what comes next.">
          <Pipeline />
          <p className="links svc-cta"><button type="button" className="linkish" onClick={() => emit("hire")}>[start with a brief]</button></p>
        </Section>

        <Section id="projects" cmd="ls ~/projects --featured" title="Selected work"
          lede="Production systems for clients and my own products. Private repositories are described without code; I'm happy to walk through them on a call.">
          <div className="panes">
            {featuredProjects.map((p, i) => <ProjectPane key={p.name} p={p} i={i} />)}
          </div>
          <MoreProjects />
        </Section>

        <Section id="companies" cmd="cat companies.md" title="Companies"
          lede="Alongside freelance work, I build the technical side of a few companies.">
          <ul className="svc">
            {companies.map((c, i) => (
              <Reveal as="li" key={c.name} i={i} className="svc-item">
                <h3><span className="c-cyan" aria-hidden>› </span>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> : c.name}</h3>
                <p className="c-dim">{c.kind}</p>
                <p>{c.description}</p>
                <p className="c-dim">role = &quot;{c.role}&quot;</p>
              </Reveal>
            ))}
          </ul>
        </Section>

        <Section id="research" onSeen={() => unlock("scholar")} cmd="cat research.md" title="Research"
          lede="Low-cost IoT for everyday problems in Bangladesh, written with classmates and faculty at Daffodil International University.">
          <ul className="papers">
            {research.map((r, i) => (
              <Reveal as="li" key={r.title} i={i} className="paper">
                <p className="paper-status"><span className="c-yellow">[{r.status ?? "in preparation"}]</span> <span className="c-dim">{r.venue}</span></p>
                <h3><span className="c-magenta" aria-hidden>## </span>{r.title}</h3>
                <p>{r.summary}</p>
              </Reveal>
            ))}
          </ul>
        </Section>

        <Section id="skills" cmd="cat skills.json" title="Tools I use"
          lede="Chosen per project. Most of my production work is in TypeScript, Python and PHP.">
          <SkillsJson />
        </Section>

        <GitHubSection />

        <Contact />
      </main>

      <StatusBar />
      <HireDock />
      <Toaster />
      <Matrix />
      <Hire />
    </>
  );
}

/* ---------------------------------------------------------------- chrome */

function TabBar() {
  const [active, setActive] = useState("top");
  const clock = useClock("Asia/Dhaka");
  useEffect(() => {
    const els = TABS.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
    }, { rootMargin: "-45% 0px -50% 0px" });
    els.forEach((el) => io.observe(el));
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 0 && n < TABS.length) {
        document.getElementById(TABS[n].id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { io.disconnect(); window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <nav className="tmux" aria-label="Sections">
      <span className="tmux-session">[rakibul]</span>
      <ol>
        {TABS.map((t, i) => (
          <li key={t.id}>
            <a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined} className={active === t.id ? "on" : ""}>
              <span className="tmux-n">{i}</span>:{t.label}{active === t.id ? "*" : ""}
            </a>
          </li>
        ))}
      </ol>
      <AchievementCounter />
      <span className="tmux-clock">Dhaka {clock}</span>
    </nav>
  );
}

function StatusBar() {
  return (
    <footer className="status">
      <span className="status-mode">NORMAL</span>
      <span className="status-item">main</span>
      <span className="status-item grow">rakibulx33.me</span>
      <span className="status-item">utf-8</span>
      <span className="status-item" suppressHydrationWarning>© {new Date().getFullYear()} Rakibul Hasan</span>
      <a className="status-item" href="#top">gg</a>
    </footer>
  );
}

/* ---------------------------------------------------------------- hero photo */

/* The real <img> is always in the page (no-JS visitors, crawlers, LCP); with JS a canvas
   sits on top, shows a "waiting" panel, pixel-decodes the portrait, then fades away. */
function PixelPhoto({ start, glitch }: { start: boolean; glitch: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const [hover, setHover] = useState(0);
  const [glitching, setGlitching] = useState(false);

  // A short RGB-split glitch whenever a terminal command runs (or on hover), once decoded.
  useEffect(() => {
    if (!done || (!glitch && !hover) || prefersReducedMotion()) return;
    setGlitching(false);
    const r = requestAnimationFrame(() => setGlitching(true));
    const t = window.setTimeout(() => setGlitching(false), 520);
    return () => { cancelAnimationFrame(r); window.clearTimeout(t); };
  }, [glitch, hover, done]);

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) { setDone(true); return; }
    const img = new Image();
    img.src = PORTRAIT;
    let raf = 0;
    let cancelled = false;
    img.onload = () => {
      const c = canvasRef.current;
      if (!c || cancelled) return;
      const ctx = c.getContext("2d");
      if (!ctx) { setDone(true); return; }
      c.width = 540; c.height = 720;
      const steps = [48, 32, 20, 12, 7, 4, 2];
      const per = 110;
      const tiny = document.createElement("canvas");
      const tctx = tiny.getContext("2d")!;
      const t0 = performance.now();
      const draw = (t: number) => {
        const k = Math.max(0, Math.floor((t - t0) / per));
        if (k >= steps.length) { setDone(true); return; }
        const b = steps[k];
        tiny.width = Math.ceil(c.width / b); tiny.height = Math.ceil(c.height / b);
        tctx.drawImage(img, 0, 0, tiny.width, tiny.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, 0, 0, c.width, c.height);
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    };
    img.onerror = () => setDone(true);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [start]);

  return (
    <div
      className={`photo gl${start ? " started" : ""}${done ? " done" : ""}${glitching ? " glitching" : ""}`}
      style={{ ["--img" as string]: `url(${PORTRAIT})` }}
      onMouseEnter={() => setHover((n) => n + 1)}
    >
      <img
        src={PORTRAIT}
        alt="Rakibul Hasan, backend and automation developer, in a grey waistcoat and red tie"
        width={720}
        height={960}
        fetchPriority="high"
        decoding="async"
      />
      <canvas ref={canvasRef} aria-hidden />
      <span className="photo-wait" aria-hidden>waiting for decoder…</span>
      <span className="photo-sweep" aria-hidden />
    </div>
  );
}

/* ---------------------------------------------------------------- section kit */

function Prompt({ typed }: { typed: string }) {
  return (
    <p className="sec-cmd" aria-hidden>
      <span className="c-green">rakibul</span><span className="c-dim">@</span><span className="c-blue">dhaka</span>
      <span className="c-dim">:~$ </span>{typed}<span className="caret" />
    </p>
  );
}

function ScrambleHeading({ id, text, start }: { id?: string; text: string; start: boolean }) {
  const { fx, done } = useScramble(text, start, 700);
  return (
    <h2 id={id} className={`scramble${done ? " done" : ""}`}>
      <span className="scramble-real">{text}</span>
      {!done && <span className="scramble-fx" aria-hidden>{fx}</span>}
    </h2>
  );
}

function AchievementCounter() {
  const n = useAchievementCount();
  return (
    <button type="button" className={`tmux-ach${n === TOTAL ? " all" : ""}`} onClick={() => emit("run", "achievements")}
      title="Achievements: show the list in the terminal">
      <span className="c-yellow" aria-hidden>★</span> {n}/{TOTAL}<span className="sr-only"> achievements unlocked</span>
    </button>
  );
}

/* Scroll-linked pipeline: the line fills and each step lights up as you read down. */
function Pipeline() {
  const ref = useRef<HTMLOListElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setP(1); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      setP(Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.35))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <ol className="pipe" ref={ref} style={{ ["--p" as string]: p }}>
      <li className="pipe-track" aria-hidden><span className="pipe-fill" /><span className="pipe-packet" /></li>
      {PROCESS.map((s, i) => (
        <li key={s.title} className={`pipe-step${p >= (i + 0.35) / PROCESS.length ? " lit" : ""}`}>
          <span className="pipe-n">{String(i + 1).padStart(2, "0")}</span>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Section({ id, cmd, title, lede, onSeen, children }: { id: string; cmd: string; title: string; lede?: string; onSeen?: () => void; children: ReactNode }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => { if (seen) onSeen?.(); }, [seen, onSeen]);
  const typed = useTyped(cmd, seen, 34);
  return (
    <section id={id} className="sec" aria-labelledby={`${id}-title`}>
      <div className="wrap">
        <div ref={ref} className="sec-head">
          <Prompt typed={typed} />
          <ScrambleHeading id={`${id}-title`} text={title} start={seen && typed.length === cmd.length} />
          {lede && <p className={`sec-lede${seen ? " in" : ""}`}>{lede}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Reveal({ as: Tag = "div", i = 0, className = "", children, style }: { as?: "div" | "li"; i?: number; className?: string; children: ReactNode; style?: CSSProperties }) {
  const [ref, seen] = useInView<HTMLElement>("0px 0px -8% 0px");
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as never} className={`reveal${seen ? " in" : ""} ${className}`} style={{ ...style, ["--i" as string]: i }}>
      {children}
    </Comp>
  );
}

function glow(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function Links({ p }: { p: Project }) {
  if (!p.code && !p.live) return <span className="c-dim">private repository</span>;
  return (
    <span className="links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>[live site]<span className="sr-only"> for {p.name}</span></a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>[source]<span className="sr-only"> for {p.name}</span></a>}
    </span>
  );
}

function ProjectPane({ p, i }: { p: Project; i: number }) {
  return (
    <Reveal i={i % 2} className="win pane">
      <article className="pane-inner" onMouseMove={glow}>
        <div className="win-bar">
          <span className="win-title">~/projects/{slug(p.name)}</span>
          <span className={`badge ${p.private ? "b-private" : "b-public"}`}>{p.private ? "private" : "public"}</span>
        </div>
        <div className="pane-body">
          <p className="pane-kind">{p.kind}</p>
          <h3>{p.name}</h3>
          <p className="pane-desc">{p.description}</p>
          <p className="pane-stack">
            <span className="c-magenta">stack</span><span className="c-dim"> = [</span>
            {p.stack.map((s, k) => (
              <span key={s}><span className="c-green">"{s}"</span>{k < p.stack.length - 1 && <span className="c-dim">, </span>}</span>
            ))}
            <span className="c-dim">]</span>
          </p>
          <Links p={p} />
        </div>
      </article>
    </Reveal>
  );
}

function MoreProjects() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const typed = useTyped("ls -l ~/projects/more", seen, 30);
  return (
    <div className="more" ref={ref}>
      <div className="more-cmd"><Prompt typed={typed} /></div>
      <h3 className="more-title">Also built</h3>
      <p className="c-dim more-total">total {moreProjects.length}</p>
      <ul className="ls">
        {moreProjects.map((p, i) => (
          <Reveal as="li" key={p.name} i={i} className="ls-row">
            <span className="ls-perm c-dim" aria-hidden>{p.private ? "drwx------" : "drwxr-xr-x"}</span>
            <span className="ls-name"><span className="c-cyan">{p.name}</span><span className="ls-kind c-dim">{p.kind}</span></span>
            <span className="ls-desc">{p.description}</span>
            <span className="ls-stack c-dim">{p.stack.join(", ")}</span>
            <span className="ls-links"><Links p={p} /></span>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

function SkillsJson() {
  const lines = useMemo(() => {
    const out: ReactNode[] = [<span className="c-dim">{"{"}</span>];
    skillGroups.forEach((g, gi) => {
      out.push(
        <>
          {"  "}<span className="c-cyan">"{g.label}"</span><span className="c-dim">: [</span>
          {g.items.map((it, k) => (
            <span key={it}><span className="c-green">"{it}"</span>{k < g.items.length - 1 && <span className="c-dim">, </span>}</span>
          ))}
          <span className="c-dim">]{gi < skillGroups.length - 1 ? "," : ""}</span>
        </>,
      );
    });
    out.push(<span className="c-dim">{"}"}</span>);
    return out;
  }, []);
  return (
    <div className="win code" onMouseMove={glow}>
      <div className="win-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="win-title">skills.json</span>
        <span className="win-meta">JSON</span>
      </div>
      <ol className="code-body">
        {lines.map((l, i) => (
          <Reveal as="li" key={i} i={i} className="code-line"><span>{l}</span></Reveal>
        ))}
      </ol>
    </div>
  );
}

/* ---------------------------------------------------------------- GitHub */

function GitHubSection() {
  const [contribs, setContribs] = useState<Contrib[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [repos, setRepos] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://github-contributions-api.jogruber.de/v4/rakibulx33?y=last").then((r) => r.json()).then((res) => {
      if (Array.isArray(res?.contributions)) setContribs(res.contributions);
      if (res?.total != null) setTotal(typeof res.total === "object" ? Object.values(res.total as Record<string, number>).reduce((a, b) => a + b, 0) : res.total);
    }).catch(() => {});
    fetch("https://api.github.com/users/rakibulx33").then((r) => (r.ok ? r.json() : null)).then((u) => typeof u?.public_repos === "number" && setRepos(u.public_repos)).catch(() => {});
  }, []);

  const summary = [
    total != null ? `${total.toLocaleString()} contributions in the last year` : "My public code and recent activity",
    repos != null ? ` across ${repos} public repositories` : "",
  ].join("");

  return (
    <Section id="github" cmd='git log --since="1 year" --graph' title="On GitHub" lede={`${summary}.`}>
      {contribs.length > 0 && <Heatmap days={contribs} />}
      <p className="links gh-link"><a href={LINKS.github} target="_blank" rel="noreferrer">[open github.com/rakibulx33]</a></p>
    </Section>
  );
}

function Heatmap({ days }: { days: Contrib[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inRef, seen] = useInView<HTMLDivElement>();
  const cells = useMemo(() => {
    const recent = days.slice(-364);
    const pad = recent.length ? new Date(recent[0].date + "T00:00:00").getDay() : 0;
    return [...Array<Contrib | null>(pad).fill(null), ...recent];
  }, [days]);
  useEffect(() => { if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth; }, [cells]);
  return (
    <div ref={inRef} className={`heat-box${seen ? " in" : ""}`}>
      <div className="heat-wrap" ref={ref}>
        <div className="heat" role="img" aria-label="GitHub contribution calendar for the last year">
          {cells.map((c, i) => (
            <span key={i} data-l={c ? Math.min(4, c.level) : 0} title={c ? `${c.count} on ${c.date}` : undefined}
              style={{ visibility: c ? undefined : "hidden", ["--d" as string]: `${Math.floor(i / 7) * 14}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- contact */

function Contact() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const PING = [
    <>PING rakibul (rakibulx33.me): 56 data bytes</>,
    <>64 bytes from rakibul: icmp_seq=0 <span className="c-green">status=available</span></>,
    <>64 bytes from rakibul: icmp_seq=1 <span className="c-green">open_to=freelance</span></>,
    <>64 bytes from rakibul: icmp_seq=2 <span className="c-green">location=Dhaka</span></>,
    <span className="c-dim">--- 3 packets transmitted, 3 received, 0% packet loss ---</span>,
  ];
  const typed = useTyped("ping rakibul", seen, 60);
  const done = typed.length === "ping rakibul".length;
  return (
    <section id="contact" className="sec contact" aria-labelledby="contact-title">
      <div className="wrap" ref={ref}>
        <Prompt typed={typed} />
        <div className="ping" aria-hidden>
          {PING.map((l, i) => (
            <div key={i} className={`ping-line${done ? " in" : ""}`} style={{ ["--i" as string]: i }}>{l}</div>
          ))}
        </div>
        <ScrambleHeading id="contact-title" text="Have a project in mind?" start={done} />
        <p className="sec-lede in">I take on freelance backend, automation and e-commerce work. The quickest start is a short brief: six questions, about 30 seconds.</p>
        <div className="cta-row">
          <button type="button" className="btn-hire" onClick={() => emit("hire")} onMouseMove={glow}>
            <span className="c-dim">$</span> hire rakibul<span className="caret" aria-hidden />
          </button>
          <span className="cta-or">or email</span>
          <span className="mail-row">
            <a className="mail" href={`mailto:${LINKS.email}`} onClick={() => unlock("client")}>{LINKS.email}</a>
            <CopyEmail />
          </span>
        </div>
        <LocalTime />
        <h3 className="soc-title">Find me everywhere as <span className="c-cyan">@{HANDLE}</span></h3>
        <ol className="soc">
          {SOCIALS.map((x, i) => (
            <li key={x.name} className={`soc-${x.group.toLowerCase()}`}>
              <a href={x.url} target="_blank" rel="noreferrer me" onMouseMove={glow}>
                <span className="soc-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="soc-name">{x.name}</span>
                <span className="soc-label">{x.label}</span>
                <span className="soc-group">{x.group.toLowerCase()}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CopyEmail() {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="copy" onClick={async () => {
      try { await navigator.clipboard.writeText(LINKS.email); setDone(true); window.setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked */ }
    }} aria-label="Copy email address">{done ? "[copied]" : "[copy]"}</button>
  );
}

function LocalTime() {
  const t = useClock("Asia/Dhaka");
  return <p className="local-time c-dim">It's <span className="c-fg">{t}</span> in Dhaka right now.</p>;
}
