import { useEffect, useState } from "react";
import {
  HANDLE, LINKS, PORTRAIT, PROCESS, SOCIALS, companies, featuredProjects, moreProjects, research, services, skillGroups,
  type Line, type Project, type Social,
} from "./data";
import Board from "./Board";
import { HireDock, Matrix, ResumeLauncher, Toaster, useKonami, useNudge } from "./Extras";
import GitHubYear from "./GitHubYear";
import Hire from "./Hire";
import { prefersReducedMotion, useClock, useInView } from "./hooks";
import Palette from "./Palette";
import Signal from "./Signal";
import { emit, unlock } from "./store";
import { useTheme } from "./theme";

const NAV = [
  { id: "work", label: "Work" },
  { id: "research", label: "Research" },
  { id: "github", label: "GitHub" },
  { id: "contact", label: "Contact" },
];
const LINE_NAME = Object.fromEntries(services.map((s) => [s.key, s.short])) as Record<Line, string>;

export default function Portfolio() {
  useKonami();
  useNudge();
  useEffect(() => {
    const id = window.setTimeout(() => unlock("booted"), prefersReducedMotion() ? 300 : 2800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Board />
      <Header />
      <main id="main">
        <Hero />
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
    </>
  );
}

/* ---------------------------------------------------------------- header */

function useIsMac() {
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/.test(navigator.userAgent)); }, []);
  return mac;
}

function LoadShedding() {
  const [theme, toggle] = useTheme();
  const on = theme === "dark";
  return (
    <button type="button" role="switch" aria-checked={on} className="ls" onClick={toggle}
      title={on ? "The power is out. Switch load-shedding off for light mode." : "Switch load-shedding on for dark mode."}>
      <span className="ls-track" aria-hidden><span className="ls-knob" /></span>
      <span className="ls-label">Load-shedding</span>
    </button>
  );
}

function Header() {
  const mac = useIsMac();
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((el) => io.observe(el));
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);

  return (
    <header className={`hd${scrolled ? " scrolled" : ""}`}>
      <div className="wrap hd-row">
        <a className="hd-name" href="#top">Rakibul Hasan</a>
        <nav className="hd-nav" aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? "location" : undefined}>{n.label}</a>
          ))}
        </nav>
        <div className="hd-tools">
          <button type="button" className="hd-search" onClick={() => emit("palette")} aria-keyshortcuts="Control+K Meta+K /" aria-label="Search and commands">
            <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <span className="hd-search-t" aria-hidden>Search</span>
            <kbd aria-hidden>{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <LoadShedding />
          <button type="button" className="btn btn-ink hd-brief" onClick={() => emit("hire")}>Start a brief</button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- hero */

function Hero() {
  const [active, setActive] = useState<Line | null>(null);
  const [theme] = useTheme();
  const clock = useClock("Asia/Dhaka");
  const [replay, setReplay] = useState(0);
  const [svcRef, svcSeen] = useInView<HTMLDivElement>();
  useEffect(() => { if (svcSeen) unlock("services"); }, [svcSeen]);
  // Flipping the load-shedding switch replays the signal, as if the meter came back on.
  useEffect(() => {
    const on = () => setReplay((n) => n + 1);
    window.addEventListener("rx:power", on);
    return () => window.removeEventListener("rx:power", on);
  }, []);

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <h1 id="hero-title" className="hero-h1">
          <span className="hero-name">Rakibul Hasan</span>
          <span className="hero-role">Backend and automation developer in Dhaka, Bangladesh</span>
        </h1>
        <div className="hero-row">
          <p className="hero-lede">
            I build APIs, online stores, AI automations and ESP32 devices for businesses, and research low-cost IoT at
            Daffodil International University. Freelancing since 2022.
          </p>
          <div className="hero-act">
            <div className="hero-cta">
              <button type="button" className="btn btn-ink" onClick={() => emit("hire")}>Start a project brief</button>
              <button type="button" className="btn btn-line" onClick={() => emit("resume")}>Get my resume</button>
            </div>
            <p className="hero-meta">
              <span className="live-dot" aria-hidden /> Taking new projects. It’s <span className="tnum">{clock}</span> in Dhaka
              {theme === "dark" ? <>, and the power is out. This page is running on IPS backup.</> : "."}
            </p>
          </div>
        </div>

        <Signal key={replay} active={active} onActive={setActive} />

        <div id="services" className="svc" ref={svcRef}>
          <h2 className="svc-h">What I build</h2>
          <ul className="svc-list">
            {services.map((s) => (
              <li key={s.key} className={`svc-item ph-${s.key}${active === s.key ? " on" : ""}`}
                onMouseEnter={() => setActive(s.key)} onMouseLeave={() => setActive(null)}>
                <span className="wire" aria-hidden />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- work */

function ProjectLinks({ p }: { p: Project }) {
  if (!p.code && !p.live) return <p className="proj-links proj-private">Private repository, walkthrough on request</p>;
  return (
    <p className="proj-links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Live site<span className="sr-only"> for {p.name}</span></a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Source code<span className="sr-only"> for {p.name}</span></a>}
    </p>
  );
}

function Work() {
  return (
    <section id="work" className="sec" aria-labelledby="work-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="work-title">Selected work</h2>
          <p className="sec-lede">
            Production systems for clients and my own products. The colour on the left shows the kind of work. Private
            repositories are described without code, and I’m happy to walk you through them on a call.
          </p>
        </header>
        <ul className="proj-list">
          {featuredProjects.map((p) => (
            <li key={p.name} className={`proj ph-${p.line ?? "backend"}`}>
              <div className="proj-id">
                <h3>{p.name}</h3>
                <p className="proj-kind">{p.kind}</p>
                {p.line && <p className="sr-only">Kind of work: {LINE_NAME[p.line]}</p>}
              </div>
              <div className="proj-body">
                <p>{p.description}</p>
                <ul className="stack" aria-label="Built with">{p.stack.map((t) => <li key={t}>{t}</li>)}</ul>
                <ProjectLinks p={p} />
              </div>
            </li>
          ))}
        </ul>

        <div className="more">
          <h3 className="more-h">Also built</h3>
          <ul className="more-list">
            {moreProjects.map((p) => (
              <li key={p.name}>
                <p className="more-name">{p.name}</p>
                <p className="more-kind">{p.kind}</p>
                <p className="more-desc">{p.description}</p>
                <p className="more-stack">{p.stack.join(", ")}</p>
                <ProjectLinks p={p} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- process */

function Process() {
  return (
    <section id="process" className="sec sec-tint" aria-labelledby="process-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="process-title">How we’d work together</h2>
          <p className="sec-lede">From first message to launch, you always know what I’m building and what comes next.</p>
        </header>
        <ol className="steps">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step-n" aria-hidden>{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="steps-cta">
          <button type="button" className="btn btn-ink" onClick={() => emit("hire")}>Start with a brief</button>
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- companies */

function CompanyLogo({ name }: { name: string }) {
  if (name === "Gikpik") return <img className="co-mark" src="/companies/gikpik.svg" alt="" width={40} height={40} loading="lazy" />;
  if (name === "BuildIoT Lab") return <span className="co-plate"><img src="/companies/buildiot-lab.png" alt="" width={781} height={188} loading="lazy" /></span>;
  return <span className="co-word" aria-hidden><b>Build</b>IoT <i>BD</i></span>;
}

function Companies() {
  return (
    <section id="companies" className="sec" aria-labelledby="companies-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="companies-title">Companies</h2>
          <p className="sec-lede">Gikpik, BuildIoT Lab and BuildIoT BD are sister companies. Alongside freelance work, I build the technical side of each.</p>
        </header>
        <ul className="co-list">
          {companies.map((c) => (
            <li key={c.name} className="co">
              <div className="co-logo"><CompanyLogo name={c.name} /></div>
              <h3>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> : c.name}</h3>
              <p className="co-kind">{c.kind.split(" · ").pop()}</p>
              <p>{c.description}</p>
              <p className="co-role">My part: {c.role.charAt(0).toLowerCase() + c.role.slice(1)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- research */

function Research() {
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => { if (seen) unlock("scholar"); }, [seen]);
  return (
    <section id="research" className="sec sec-tint" aria-labelledby="research-title">
      <div className="wrap" ref={ref}>
        <header className="sec-head">
          <h2 id="research-title">Research</h2>
          <p className="sec-lede">Low-cost IoT for everyday problems in Bangladesh, written with classmates and faculty at Daffodil International University.</p>
        </header>
        <ul className="papers">
          {research.map((r, i) => (
            <li key={r.title} className={`paper${i === 0 ? " lead" : ""}`}>
              <p className="paper-meta"><span className={`status s-${(r.status ?? "in preparation").replace(" ", "-")}`}>{r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "In preparation"}</span>{r.venue}</p>
              <h3>{r.title}</h3>
              <p>{r.summary}</p>
              {i === 0 && <p className="paper-note">The idea behind the signal at the top of this page.</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- skills */

function Skills() {
  return (
    <section id="skills" className="sec" aria-labelledby="skills-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="skills-title">Tools I use</h2>
          <p className="sec-lede">Chosen per project. Most of my production work is in TypeScript, Python and PHP.</p>
        </header>
        <dl className="skills">
          {skillGroups.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
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
  { group: "Hire", label: "Work with me" },
  { group: "Message", label: "Message" },
  { group: "Social", label: "Social" },
  { group: "Skills", label: "Practice and data" },
  { group: "Personal", label: "Personal" },
];

function Contact() {
  return (
    <section id="contact" className="sec contact" aria-labelledby="contact-title">
      <div className="wrap contact-grid">
        <figure className="me">
          <img src={PORTRAIT} alt="Rakibul Hasan in a grey waistcoat and red tie" width={720} height={960} loading="lazy" decoding="async" />
          <figcaption><span lang="bn" className="bn">রাকিবুল হাসান</span> Rakibul Hasan, Dhaka</figcaption>
        </figure>
        <div className="contact-main">
          <h2 id="contact-title">Have a project in mind?</h2>
          <p className="sec-lede">I take on freelance backend, automation and e-commerce work. The quickest start is a short brief: six questions, about 30 seconds.</p>
          <div className="cta">
            <button type="button" className="btn btn-ink" onClick={() => emit("hire")}>Start a project brief</button>
            <button type="button" className="btn btn-line" onClick={() => emit("resume")}>Get my resume, CV or portfolio</button>
          </div>
          <p className="mail">
            Or email <a href={`mailto:${LINKS.email}`} onClick={() => unlock("client")}>{LINKS.email}</a> <CopyEmail />
          </p>
          <h3 className="soc-h">Find me everywhere as @{HANDLE}</h3>
          <div className="soc">
            {SOCIAL_GROUPS.map((g) => (
              <div key={g.group} className="soc-g">
                <p className="soc-gl">{g.label}</p>
                <ul>
                  {SOCIALS.filter((s) => s.group === g.group).map((s) => (
                    <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer me">{s.name}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- footer */

function Footer() {
  const mac = useIsMac();
  return (
    <footer className="ft">
      <div className="wrap ft-row">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Rakibul Hasan</p>
        <p className="ft-colophon">
          Set in Geologica. The four colours are the mains: the red, yellow and blue phases, and earth green. Power runs
          down the left margin and data down the right.
        </p>
        <p>
          Press <button type="button" className="btn-text" onClick={() => emit("palette")}><kbd>{mac ? "⌘K" : "Ctrl K"}</kbd></button> for commands.
        </p>
      </div>
    </footer>
  );
}
