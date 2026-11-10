import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUpRight, Bot, Cpu, Github, Linkedin, Lock, Mail, Search, Server, ShoppingCart, Star } from "lucide-react";
import {
  HANDLE, LINKS, PORTRAIT, PROCESS, SOCIALS, companies, featuredProjects, moreProjects, research, services, skillGroups,
  type Line, type Project, type Social,
} from "./data";
import Aurora from "./Aurora";
import { Cover } from "./Covers";
import { HireDock, Matrix, ResumeLauncher, Toaster, useKonami, useNudge } from "./Extras";
import gh from "./github.json";
import GitHubYear from "./GitHubYear";
import Hire from "./Hire";
import { prefersReducedMotion, useClock, useInView, useOnScreen } from "./hooks";
import { Cursor, Words, useCountUp, useMotion, useScrollFx, useSmoothScroll } from "./motion";
import Palette from "./Palette";
import { TOTAL, emit, unlock, useAchievementCount } from "./store";
import Terminal from "./Terminal";

/* "Midnight Neon": a working terminal on a midnight page, lit by a live aurora in the colours of Dhaka's
   rickshaw art (turquoise, hot pink, marigold). The top bar is laid out like tmux windows, each section is
   introduced by the command that would print it, and most things answer the pointer. */

/** The windows in the top bar. The number is its tmux index. */
const NAV = [
  { id: "top", label: "home" },
  { id: "services", label: "services" },
  { id: "work", label: "projects" },
  { id: "research", label: "research" },
  { id: "github", label: "git.log" },
  { id: "skills", label: "skills" },
  { id: "contact", label: "ping" },
];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const pad2 = (n: number) => String(n).padStart(2, "0");
/** The position of an item in its row, for staggered reveals. */
const nth = (n: number) => ({ ["--i" as string]: n }) as CSSProperties;

export default function Portfolio() {
  useKonami();
  useNudge();
  useMotion();
  useSmoothScroll();
  useScrollFx();
  return (
    <>
      <Aurora />
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <main id="main">
        <Hero />
        <Stats />
        <Ticker />
        <Services />
        <Work />
        <Process />
        <Companies />
        <Research />
        <GitHubYear />
        <Skills />
        <Contact />
      </main>
      <Footer />
      <HireDock />
      <Toaster />
      <Matrix />
      <Hire />
      <ResumeLauncher />
      <Palette />
      <Cursor />
    </>
  );
}

/** A section, introduced by the command that would print it. `ghost` is the outlined word that drifts behind it. */
function Sec({ id, cmd, title, lede, ghost, children }: { id: string; cmd: string; title: string; lede?: ReactNode; ghost: string; children: ReactNode }) {
  return (
    <section id={id} className="sec" aria-labelledby={`${id}-title`}>
      <span className="sec-ghost" data-drift="-0.22" aria-hidden>{ghost}</span>
      <div className="wrap">
        <header className="sec-head reveal">
          <p className="sec-cmd"><span aria-hidden>~$ </span><span className="sec-typed">{cmd}</span></p>
          <h2 id={`${id}-title`}><Words text={title} /></h2>
          {lede && <p className="sec-lede">{lede}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- top bar (tmux) */

function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.userAgent)); }, []);
  return mac;
}

function TopBar() {
  const mac = useIsMac();
  const clock = useClock("Asia/Dhaka");
  const count = useAchievementCount();
  const [active, setActive] = useState("top");
  const bar = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);

  // On a phone the windows scroll sideways: keep the marked one in view.
  useEffect(() => {
    const ol = list.current;
    const on = ol?.querySelector<HTMLElement>("a.on");
    if (ol && on) ol.scrollTo({ left: on.offsetLeft - ol.offsetLeft - 24, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active]);

  useEffect(() => {
    // Scroll progress, drawn as the ember line under the bar.
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // The window for the section on screen is marked. Sections without a window (process, companies) mark none.
    const els = [...document.querySelectorAll<HTMLElement>("main > section[id]")];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(NAV.some((n) => n.id === e.target.id) ? e.target.id : ""); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); io.disconnect(); };
  }, []);

  return (
    <header className="tmux">
      <a className="tmux-session" href="#top" aria-label="Rakibul Hasan, top of the page">[rakibul]</a>
      <nav aria-label="Sections">
        <ol ref={list}>
          {NAV.map((n, i) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className={active === n.id ? "on" : undefined} aria-current={active === n.id ? "location" : undefined}>
                <span className="tmux-n" aria-hidden>{i}:</span>{n.label}{active === n.id && <span aria-hidden>*</span>}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="tmux-right">
        <button type="button" className="tmux-btn" onClick={() => emit("run", "achievements")} aria-label={`${count} of ${TOTAL} achievements unlocked. Show them in the terminal.`}>
          <Star size={12} aria-hidden /> {count}/{TOTAL}
        </button>
        <button type="button" className="tmux-btn tmux-search" onClick={() => emit("palette")} aria-keyshortcuts="Control+K Meta+K" aria-label="Search the site">
          <Search size={12} aria-hidden /> <span aria-hidden>search</span> <kbd aria-hidden>{mac ? "⌘K" : "Ctrl K"}</kbd>
        </button>
        <span className="tmux-clock">Dhaka <span className="tnum">{clock}</span></span>
      </div>
      <span className="tmux-progress" ref={bar} aria-hidden />
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

/** The portrait: an ember halo behind it, a slow scan line across it, and a lean toward the pointer. */
function Portrait({ glitch }: { glitch: number }) {
  const [ref, live] = useOnScreen<HTMLDivElement>();
  const [torn, setTorn] = useState(false);

  // Lean toward the pointer (desktop only, and not with reduced motion). Written to CSS variables, so nothing re-renders.
  useEffect(() => {
    const el = ref.current;
    if (!el || !live || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));
        el.style.setProperty("--tx", clamp((e.clientX - (r.left + r.width / 2)) / r.width).toFixed(3));
        el.style.setProperty("--ty", clamp((e.clientY - (r.top + r.height / 2)) / r.height).toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, [ref, live]);

  // Every terminal command tears the picture for a moment.
  useEffect(() => {
    if (!glitch || prefersReducedMotion()) return;
    setTorn(true);
    const id = window.setTimeout(() => setTorn(false), 480);
    return () => window.clearTimeout(id);
  }, [glitch]);

  return (
    <div className={`pt${live ? " live" : ""}`} ref={ref}>
      <span className="pt-halo" aria-hidden />
      <Orbit side="back" />
      <span className="pt-orb pt-orb-a" aria-hidden />
      <span className="pt-orb pt-orb-b" aria-hidden />
      <figure className={`pt-card gl${torn ? " glitching" : ""}`} style={{ ["--img" as string]: `url(${PORTRAIT})` }}>
        <img src={PORTRAIT} alt="Rakibul Hasan in a grey waistcoat and red tie" width={720} height={960} decoding="async" fetchPriority="high" />
        <span className="pt-tint" aria-hidden />
        <span className="pt-scan" aria-hidden />
        <span className="pt-shine" aria-hidden />
        <span className="pt-grid" aria-hidden />
        <figcaption className="pt-tags">
          <span>~/dhaka.bd</span>
          <span><i aria-hidden /> taking projects</span>
        </figcaption>
      </figure>
      <Orbit side="front" />
      <button type="button" className="badge" onClick={() => emit("hire")} aria-label="Available for freelance work. Start a project brief.">
        <svg className="badge-ring" viewBox="0 0 120 120" aria-hidden focusable="false">
          <defs><path id="badge-circle" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" /></defs>
          <text><textPath href="#badge-circle" textLength="276">available for freelance ✦ start a brief ✦</textPath></text>
        </svg>
        <ArrowUpRight className="badge-arrow" size={26} aria-hidden />
      </button>
    </div>
  );
}

/** Two rings around the portrait, each with a comet on it. Drawn twice: once behind the picture and once, cut to its
    lower half, in front of it, so the rings appear to pass around. */
function Orbit({ side }: { side: "back" | "front" }) {
  return (
    <svg className={`pt-orbit ${side}`} viewBox="0 0 400 500" aria-hidden focusable="false">
      <ellipse className="ring r1" cx="200" cy="250" rx="262" ry="88" pathLength={1000} />
      <ellipse className="comet r1" cx="200" cy="250" rx="262" ry="88" pathLength={1000} />
      <ellipse className="ring r2" cx="200" cy="250" rx="240" ry="120" pathLength={1000} />
      <ellipse className="comet r2" cx="200" cy="250" rx="240" ry="120" pathLength={1000} />
    </svg>
  );
}

function Hero() {
  const [glitch, setGlitch] = useState(0);
  const onCommand = useCallback(() => setGlitch((n) => n + 1), []);
  return (
    <section id="top" className="hero" aria-label="Introduction">
      <div className="wrap hero-grid">
        <div className="hero-main">
          <p className="hero-open"><span className="pulse" aria-hidden />Open to new projects</p>
          <Terminal onCommand={onCommand} />
          <div className="hero-cta">
            <button type="button" className="btn btn-ink magnet" onClick={() => emit("hire")}>Start a project brief</button>
            <button type="button" className="btn btn-line magnet" onClick={() => emit("resume")}>Get my resume</button>
            <ul className="hero-soc">
              <li><a href={LINKS.github} target="_blank" rel="noreferrer me" aria-label="GitHub"><Github size={20} aria-hidden /></a></li>
              <li><a href={LINKS.linkedin} target="_blank" rel="noreferrer me" aria-label="LinkedIn"><Linkedin size={20} aria-hidden /></a></li>
              <li><a href={`mailto:${LINKS.email}`} aria-label="Email" onClick={() => unlock("client")}><Mail size={20} aria-hidden /></a></li>
            </ul>
          </div>
        </div>
        <Portrait glitch={glitch} />
      </div>
      <a className="hero-down" href="#services" aria-label="Scroll to what I build"><ArrowDown size={22} aria-hidden /></a>
    </section>
  );
}

/* ---------------------------------------------------------------- numbers */

function Stats() {
  const data = gh as { total: number; publicRepos: number | null };
  const stats = [
    { to: data.total, k: "contributions in a year" },
    { to: featuredProjects.length + moreProjects.length, k: "projects built" },
    ...(data.publicRepos != null ? [{ to: data.publicRepos, k: "public repositories" }] : []),
    { to: 2022, k: "freelancing since", year: true },
  ];
  return (
    <section className="stats" aria-label="In numbers">
      <dl className="wrap stats-row" style={{ ["--n" as string]: stats.length }}>
        {stats.map((s, i) => <Stat key={s.k} {...s} i={i} />)}
      </dl>
    </section>
  );
}

function Stat({ to, k, year, i }: { to: number; k: string; year?: boolean; i: number }) {
  const [ref, v] = useCountUp(to, year ? 900 : 1500);
  // A year counts up through recent years rather than from zero, and is not written with a comma.
  const shown = year ? String(to - Math.round((to - v) / 60)) : v.toLocaleString("en-US");
  return <div className="reveal" style={nth(i)} ref={ref as React.RefObject<HTMLDivElement | null>}><dd>{shown}</dd><dt>{k}</dt></div>;
}

/* ---------------------------------------------------------------- the tools, scrolling past */

/** Every tool from the skills list, as two rows moving in opposite directions. Decorative: the same names are listed properly under "Tools I use". */
function Ticker() {
  const all = skillGroups.flatMap((g) => g.items);
  const half = Math.ceil(all.length / 2);
  const rows = [all.slice(0, half), all.slice(half)];
  return (
    <div className="ticker" aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className={`ticker-row${r ? " rev" : ""}`}>
          {[0, 1].map((copy) => <ul key={copy}>{row.map((t) => <li key={t}>{t}</li>)}</ul>)}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- what I build */

const SERVICE_ICON: Record<Line, typeof Server> = { backend: Server, automation: Bot, commerce: ShoppingCart, iot: Cpu };
const kinds = (p: Project): Line[] => [...(p.line ? [p.line] : []), ...(p.also ?? [])];

function Services() {
  const [ref, seen] = useInView<HTMLUListElement>();
  useEffect(() => { if (seen) unlock("services"); }, [seen]);
  return (
    <Sec id="services" cmd="cat services.txt" title="What I build" ghost="build" lede="Four kinds of work. Most projects mix two or three of them.">
      <ul className="svc" ref={ref}>
        {services.map((s) => {
          const Icon = SERVICE_ICON[s.key];
          const works = featuredProjects.filter((p) => kinds(p).includes(s.key));
          return (
            <li key={s.key} className="card svc-card reveal" style={nth(services.indexOf(s))}>
              <Icon className="card-icon" size={24} aria-hidden />
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <p className="svc-used">
                <span className="svc-used-k">used in</span>
                {works.length
                  ? works.map((p) => <a key={p.name} href={`#p-${slug(p.name)}`}>{slug(p.name)}/</a>)
                  : <a href="#research">research/</a>}
              </p>
            </li>
          );
        })}
      </ul>
    </Sec>
  );
}

/* ---------------------------------------------------------------- work */

function ProjectLinks({ p, compact }: { p: Project; compact?: boolean }) {
  if (!p.code && !p.live) return <p className="proj-links proj-private"><Lock size={13} aria-hidden /> {compact ? "Private repository" : "Private repository, walkthrough on request"}</p>;
  return (
    <p className="proj-links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Live site<span className="sr-only"> for {p.name}</span><ArrowUpRight size={14} aria-hidden /></a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Source code<span className="sr-only"> for {p.name}</span><ArrowUpRight size={14} aria-hidden /></a>}
    </p>
  );
}

function Work() {
  return (
    <Sec id="work" cmd="ls ./projects" title="Selected work" ghost="projects"
      lede="Production systems for clients and my own products. Private repositories are described without code, and I’m happy to walk you through them on a call.">
      <ol className="proj-grid">
        {featuredProjects.map((p, i) => (
          <li key={p.name} id={`p-${slug(p.name)}`} className="card proj tilt reveal" style={nth(i % 2)}>
            <Cover name={p.name} />
            <p className="proj-n" aria-hidden>/{pad2(i + 1)}</p>
            <h3>{p.name}</h3>
            <p className="proj-kind">{p.kind}</p>
            <p className="proj-desc">{p.description}</p>
            <ul className="stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
            <ProjectLinks p={p} />
          </li>
        ))}
      </ol>

      <div className="more">
        <p className="sec-cmd"><span aria-hidden>~$ </span>ls ./projects/more</p>
        <h3 className="more-h">Also built</h3>
        <ul className="ls">
          {moreProjects.map((p) => (
            <li key={p.name} className="reveal">
              <div className="ls-name">
                <p className="ls-title">{p.name}</p>
                <p className="ls-kind">{p.kind}</p>
              </div>
              <p className="ls-desc">{p.description}</p>
              <p className="ls-stack">{p.stack.join(", ")}</p>
              <ProjectLinks p={p} compact />
            </li>
          ))}
        </ul>
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------- process */

function Process() {
  return (
    <Sec id="process" cmd="cat process.md" title="How we’d work together" ghost="process" lede="From first message to launch, you always know what I’m building and what comes next.">
      <ol className="steps" data-progress>
        {PROCESS.map((s, i) => (
          <li key={s.title} className="step reveal" style={nth(i)}>
            <span className="step-n" aria-hidden>{pad2(i + 1)}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="steps-cta">
        <button type="button" className="btn btn-ink magnet" onClick={() => emit("hire")}>Start with a brief</button>
      </p>
    </Sec>
  );
}

/* ---------------------------------------------------------------- companies */

function CompanyLogo({ name }: { name: string }) {
  if (name === "Gikpik") return <img className="co-mark" src="/companies/gikpik.svg" alt="" width={56} height={56} loading="lazy" />;
  if (name === "BuildIoT Lab") return <img className="co-img" src="/companies/buildiot-lab.png" alt="" width={781} height={188} loading="lazy" />;
  return <span className="co-word" aria-hidden><b>Build</b>IoT <i>BD</i></span>;
}

function Companies() {
  return (
    <Sec id="companies" cmd="ls ~/companies" title="Companies" ghost="companies" lede="Gikpik, BuildIoT Lab and BuildIoT BD are sister companies. Alongside freelance work, I build the technical side of each.">
      <ul className="co-list">
        {companies.map((c, i) => (
          <li key={c.name} className="card co reveal" style={nth(i)}>
            <div className={`co-logo${c.logo?.plate ? " plate" : ""}`}><CompanyLogo name={c.name} /></div>
            <h3>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}<ArrowUpRight size={18} aria-hidden /></a> : c.name}</h3>
            <p className="co-kind">{c.kind.split(" · ").pop()}</p>
            <p className="co-desc">{c.description}</p>
            <p className="co-role"><span>my part</span>{c.role}</p>
          </li>
        ))}
      </ul>
    </Sec>
  );
}

/* ---------------------------------------------------------------- research */

function Research() {
  const [ref, seen] = useInView<HTMLOListElement>();
  useEffect(() => { if (seen) unlock("scholar"); }, [seen]);
  return (
    <Sec id="research" cmd="ls ./research" title="Research" ghost="research" lede="Early-stage ideas I am exploring alongside my degree. Details will be shared when they are ready.">
      <ol className="papers" ref={ref}>
        {research.map((r, i) => (
          <li key={r.title} className="card paper reveal" style={nth(i === 0 ? 0 : (i - 1) % 2)}>
            <p className="paper-tag">[focus area]</p>
            <h3>{r.title}</h3>
            <p className="paper-sum">{r.summary}</p>
          </li>
        ))}
      </ol>
    </Sec>
  );
}

/* ---------------------------------------------------------------- skills */

function Skills() {
  return (
    <Sec id="skills" cmd="cat skills.json" title="Tools I use" ghost="tools" lede="Chosen per project. Most of my production work is in TypeScript, Python and PHP.">
      <dl className="skills">
        {skillGroups.map((g, i) => (
          <div key={g.label} className="card reveal" style={nth(i % 3)}>
            <dt>{g.label}</dt>
            <dd>{g.items.map((it) => <span key={it}>{it}</span>)}</dd>
          </div>
        ))}
      </dl>
    </Sec>
  );
}

/* ---------------------------------------------------------------- contact */

function CopyEmail() {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-text" onClick={async () => {
      try { await navigator.clipboard.writeText(LINKS.email); setDone(true); window.setTimeout(() => setDone(false), 1800); } catch { /* clipboard blocked */ }
    }}>{done ? "Copied" : "Copy"}<span className="sr-only"> email address</span></button>
  );
}

const SOCIAL_GROUPS: { group: Social["group"]; label: string }[] = [
  { group: "Hire", label: "work with me" },
  { group: "Message", label: "message" },
  { group: "Social", label: "social" },
  { group: "Skills", label: "practice and data" },
  { group: "Personal", label: "personal" },
];

function Contact() {
  return (
    <Sec id="contact" cmd="ping rakibul" title="Have a project in mind?" ghost="hello"
      lede="I take on freelance backend, automation and e-commerce work. The quickest start is a short brief: six questions, about 30 seconds.">
      <span className="radar" aria-hidden><i /><i /><i /></span>
      <div className="cta reveal">
        <button type="button" className="btn btn-ink magnet" onClick={() => emit("hire")}>Start a project brief</button>
        <button type="button" className="btn btn-line magnet" onClick={() => emit("resume")}>Get my resume, CV or portfolio</button>
      </div>
      <p className="mail reveal">
        <span className="mail-k">or email</span>
        <a className="mail-big" href={`mailto:${LINKS.email}`} aria-label={`Email ${LINKS.email}`} onClick={() => unlock("client")} style={{ ["--n" as string]: LINKS.email.length }}>
          {[...LINKS.email].map((ch, i) => <span key={i} aria-hidden style={nth(i)}>{ch}</span>)}
        </a>
        <CopyEmail />
      </p>
      <h3 className="soc-h">Find me everywhere as @{HANDLE}</h3>
      <div className="soc">
        {SOCIAL_GROUPS.map((g) => (
          <div key={g.group} className="soc-g">
            <p className="soc-gl"># {g.label}</p>
            <ul>
              {SOCIALS.filter((s) => s.group === g.group).map((s) => (
                <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer me">{s.name}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  const mac = useIsMac();
  return (
    <footer className="ft">
      <div className="shout" aria-hidden>
        {[0, 1].map((copy) => <p key={copy}>{Array.from({ length: 4 }, (_, k) => <span key={k}>Let’s build something<i /></span>)}</p>)}
      </div>
      <div className="wrap ft-row">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Rakibul Hasan</p>
        <p>
          Press <kbd>/</kbd> for the terminal, <button type="button" className="btn-text" onClick={() => emit("palette")}><kbd>{mac ? "⌘K" : "Ctrl K"}</kbd></button> to search.
        </p>
        <p><a href="#top">Back to top</a></p>
      </div>
    </footer>
  );
}
