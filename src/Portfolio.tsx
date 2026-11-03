import { useEffect, useState, type CSSProperties } from "react";
import {
  HANDLE, LINKS, PORTRAIT, PROCESS, SOCIALS, companies, featuredProjects, moreProjects, research, services, skillGroups,
  type Line, type Project, type Social,
} from "./data";
import { HireDock, Matrix, ResumeLauncher, Toaster, useKonami, useNudge } from "./Extras";
import { InkChip, INKS, Poster, RisoDefs, Torch } from "./Gallery";
import GitHubYear from "./GitHubYear";
import Hire from "./Hire";
import { prefersReducedMotion, useClock, useInView } from "./hooks";
import Palette from "./Palette";
import { emit, unlock } from "./store";
import { useTheme } from "./theme";

/* "Exhibition": the portfolio hangs like a small gallery show. White walls, framed work with museum
   labels, research papers in a display case. Load-shedding turns the gallery lights off. */

const NAV = [
  { id: "work", label: "Work" },
  { id: "research", label: "Research" },
  { id: "github", label: "GitHub" },
  { id: "contact", label: "Contact" },
];
const LINE_NAME = Object.fromEntries(services.map((s) => [s.key, s.short])) as Record<Line, string>;
/** "A, B and C" */
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export default function Portfolio() {
  useKonami();
  useNudge();
  useEffect(() => {
    const id = window.setTimeout(() => unlock("booted"), prefersReducedMotion() ? 300 : 2400);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <RisoDefs />
      <Header />
      <main id="main">
        <Hero />
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
      <Torch />
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
      title={on ? "The power is out. Switch load-shedding off to turn the gallery lights back on." : "Switch load-shedding on for dark mode."}>
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

/* ---------------------------------------------------------------- hero: the entrance wall */

function Hero() {
  const [theme] = useTheme();
  const clock = useClock("Asia/Dhaka");
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-main">
          <h1 id="hero-title" className="hero-h1">
            <span className="hero-name"><span className="vinyl">Rakibul</span> <span className="vinyl">Hasan</span></span>
            <span className="hero-role">Backend and automation developer in Dhaka, Bangladesh</span>
          </h1>
          <p className="hero-lede">
            I build APIs, online stores, AI automations and ESP32 devices for businesses, and research low-cost IoT at
            Daffodil International University. Freelancing since 2022.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-ink" onClick={() => emit("hire")}>Start a project brief</button>
            <button type="button" className="btn btn-line" onClick={() => emit("resume")}>Get my resume</button>
          </div>
          <p className="hero-open">
            <span className="open-dot" aria-hidden /> Taking new projects. It’s <span className="tnum">{clock}</span> in Dhaka
            {theme === "dark" ? <>, and the power is out, so the gallery is running on backup lights.</> : "."}
          </p>
        </div>

        <figure className="work hero-portrait">
          <div className="frame">
            <img src={PORTRAIT} alt="Rakibul Hasan in a grey waistcoat and red tie" width={720} height={960} decoding="async" fetchPriority="high" />
          </div>
          <figcaption className="placard">
            <p className="pl-title">Rakibul Hasan <span lang="bn" className="bn">রাকিবুল হাসান</span></p>
            <p className="pl-meta">Developer and IoT researcher, Dhaka</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- what I build: the four inks */

function Services() {
  const [ref, seen] = useInView<HTMLUListElement>();
  useEffect(() => { if (seen) unlock("services"); }, [seen]);
  return (
    <section id="services" className="sec sec-alt" aria-labelledby="services-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="services-title">What I build</h2>
          <p className="sec-lede">Four kinds of work, each printed in its own ink. The posters in the next room use the same colours.</p>
        </header>
        <ul className="svc-list" ref={ref}>
          {services.map((s) => {
            const works = featuredProjects.filter((p) => p.line === s.key).map((p) => p.name);
            return (
              <li key={s.key} className={`svc ph-${s.key}`}>
                <InkChip line={s.key} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <p className="svc-works">
                  <span className="sr-only">Printed in {INKS[s.key].name.toLowerCase()}. </span>
                  {works.length ? <>On the wall: {list(works)}</> : <>See the research papers below</>}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- work: the main room */

function ProjectLinks({ p }: { p: Project }) {
  if (!p.code && !p.live) return <p className="proj-links proj-private">Private repository, walkthrough on request</p>;
  return (
    <p className="proj-links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Live site<span className="sr-only"> for {p.name}</span></a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Source code<span className="sr-only"> for {p.name}</span></a>}
    </p>
  );
}

/** A salon hang: frames of different sizes, dropped to different heights. `ratio` is the poster's height over its width. */
const HANG = [
  { span: 5, ratio: 1.25, drop: 0 },
  { span: 4, ratio: 1, drop: 72 },
  { span: 3, ratio: 4 / 3, drop: 24 },
  { span: 3, ratio: 4 / 3, drop: 40 },
  { span: 4, ratio: 1.25, drop: 0 },
  { span: 5, ratio: 0.8, drop: 96 },
];

function Work() {
  return (
    <section id="work" className="sec" aria-labelledby="work-title">
      <div className="wrap">
        <header className="sec-head">
          <h2 id="work-title">Selected work</h2>
          <p className="sec-lede">
            Production systems for clients and my own products. Each poster is drawn by code from its project, in the
            ink of its kind of work. Private repositories are described without code, and I’m happy to walk you through
            them on a call.
          </p>
        </header>
        <ul className="hang">
          {featuredProjects.map((p, i) => {
            const h = HANG[i % HANG.length];
            return (
              <li key={p.name} className={`work ph-${p.line ?? "backend"}`} style={{ "--span": h.span, "--drop": `${h.drop}px` } as CSSProperties}>
                <div className="frame"><Poster project={p} ratio={h.ratio} /></div>
                <div className="placard">
                  <h3 className="pl-title"><i>{p.name}</i></h3>
                  <p className="pl-meta">{p.kind}{p.line && <span className="sr-only">. Kind of work: {LINE_NAME[p.line]}</span>}</p>
                  <p className="pl-medium">{p.stack.join(", ")}</p>
                  <p className="pl-desc">{p.description}</p>
                  <ProjectLinks p={p} />
                </div>
              </li>
            );
          })}
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
    <section id="process" className="sec sec-alt" aria-labelledby="process-title">
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
  if (name === "Gikpik") return <img className="co-mark" src="/companies/gikpik.svg" alt="" width={56} height={56} loading="lazy" />;
  if (name === "BuildIoT Lab") return <img className="co-img" src="/companies/buildiot-lab.png" alt="" width={781} height={188} loading="lazy" />;
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
            <li key={c.name} className="co work">
              <div className="frame frame-sm"><div className="co-logo"><CompanyLogo name={c.name} /></div></div>
              <div className="placard">
                <h3 className="pl-title">{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}</a> : c.name}</h3>
                <p className="pl-meta">{c.kind.split(" · ").pop()}</p>
                <p className="pl-desc">{c.description}</p>
                <p className="co-role">My part: {c.role.charAt(0).toLowerCase() + c.role.slice(1)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- research: the display case */

function Research() {
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => { if (seen) unlock("scholar"); }, [seen]);
  return (
    <section id="research" className="sec sec-alt" aria-labelledby="research-title">
      <div className="wrap" ref={ref}>
        <header className="sec-head">
          <h2 id="research-title">Research</h2>
          <p className="sec-lede">Low-cost IoT for everyday problems in Bangladesh, written with classmates and faculty at Daffodil International University.</p>
        </header>
        <div className="vitrine">
          <ul className="papers">
            {research.map((r, i) => (
              <li key={r.title} className={`paper${i === 0 ? " lead" : ""}`}>
                <p className="paper-tag">{r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "In preparation"}</p>
                <h3>{r.title}</h3>
                <p className="paper-venue">{r.venue}</p>
                <p className="paper-sum">{r.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- skills */

function Skills() {
  return (
    <section id="skills" className="sec sec-alt" aria-labelledby="skills-title">
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
      <div className="wrap">
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
        </div>
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
          Set in Libre Franklin and Newsreader. The posters are two-colour prints drawn by code: each ink is a kind of
          work, and each picture is what the project does.
        </p>
        <p>
          Press <button type="button" className="btn-text" onClick={() => emit("palette")}><kbd>{mac ? "⌘K" : "Ctrl K"}</kbd></button> for commands.
        </p>
      </div>
    </footer>
  );
}
