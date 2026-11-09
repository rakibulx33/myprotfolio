import { useEffect, useState, type CSSProperties } from "react";
import {
  HANDLE, LINKS, PORTRAIT, PROCESS, SOCIALS, companies, featuredProjects, moreProjects, research, services, skillGroups,
  type Project, type Social,
} from "./data";
import { HireDock, Matrix, ResumeLauncher, Toaster, useKonami, useNudge } from "./Extras";
import gh from "./github.json";
import GitHubYear from "./GitHubYear";
import Hire from "./Hire";
import { prefersReducedMotion, useClock, useInView } from "./hooks";
import { LineBadge, Mark, NetworkMap, linesOf, slug } from "./Lines";
import Palette from "./Palette";
import { emit, unlock } from "./store";
import { useTheme } from "./theme";

/* "Lines": the portfolio is a small metro network. Each kind of work is a numbered, coloured line; each project is
   a station; a project that spans several kinds of work is an interchange; every line ends at "your project".
   Load-shedding (dark mode) is the night service: the network keeps running on backup lighting. */

const NAV = [
  { id: "work", label: "Work", line: "backend" },
  { id: "research", label: "Research", line: "iot" },
  { id: "github", label: "GitHub", line: "automation" },
  { id: "contact", label: "Contact", line: "commerce" },
] as const;
const pad2 = (n: number) => String(n).padStart(2, "0");

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
      <Header />
      <main id="main">
        <Hero />
        <Network />
        <Lines />
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

/** A section's eyebrow: its stop number, then its name, like a platform sign. */
function Stop({ n, label }: { n: number; label: string }) {
  return <p className="eyebrow"><span className="eb-n" aria-hidden>{pad2(n)}</span>{label}</p>;
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
      title={on ? "The power is out and the network is on backup lighting. Switch load-shedding off to restore it." : "Switch load-shedding on for dark mode."}>
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
        <a className="hd-name" href="#top"><Mark /><span>Rakibul Hasan</span></a>
        <nav className="hd-nav" aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={`ln-${n.line}`} aria-current={active === n.id ? "location" : undefined}>{n.label}</a>
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
  const [theme] = useTheme();
  const clock = useClock("Asia/Dhaka");
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-main">
          <ul className="hero-lines" aria-label="Four kinds of work">
            {services.map((s) => <li key={s.key}><LineBadge line={s.key} /></li>)}
          </ul>
          <h1 id="hero-title" className="hero-h1">
            <span className="hero-name"><span className="rise">Rakibul</span> <span className="rise">Hasan</span></span>
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
            {theme === "dark" ? <>, and the power is out, so the network is running on backup lighting.</> : "."}
          </p>
        </div>

        <figure className="pass">
          <img src={PORTRAIT} alt="Rakibul Hasan in a grey waistcoat and red tie" width={720} height={960} decoding="async" fetchPriority="high" />
          <div className="pass-bars" aria-hidden><i className="b-backend" /><i className="b-automation" /><i className="b-commerce" /><i className="b-iot" /></div>
          <figcaption>
            <p className="pass-name">Rakibul Hasan <span lang="bn" className="bn">রাকিবুল হাসান</span></p>
            <p className="pass-role">Developer and IoT researcher</p>
            <p className="pass-code"><span>DHK</span> Dhaka · 23.81° N, 90.41° E</p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- the network map */

function Network() {
  const facts = [
    { k: "Projects built", v: String(featuredProjects.length + moreProjects.length) },
    { k: "Freelancing since", v: "2022" },
    { k: "Research projects", v: String(research.length) },
    { k: "GitHub contributions, last year", v: (gh as { total: number }).total.toLocaleString("en-US") },
  ];
  return (
    <section id="network" className="net" aria-labelledby="net-title">
      <div className="wrap">
        <div className="net-card">
          <header className="net-head">
            <div>
              <h2 id="net-title" className="net-title">The network</h2>
              <p className="net-sub">Four lines of work, and the projects on them. Where a project covers more than one, the lines meet.</p>
            </div>
            <p className="net-key" aria-hidden>Select a station to jump to it</p>
          </header>
          <div className="net-scroll"><NetworkMap /></div>
          <p className="net-note">The map is the full picture on a wide screen. On a phone, the lines below carry the same stations.</p>
        </div>
        <dl className="facts">
          {facts.map((f) => <div key={f.k}><dd>{f.v}</dd><dt>{f.k}</dt></div>)}
        </dl>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- what I build: the four lines */

function Lines() {
  const [ref, seen] = useInView<HTMLUListElement>();
  useEffect(() => { if (seen) unlock("services"); }, [seen]);
  return (
    <section id="services" className="sec" aria-labelledby="services-title">
      <div className="wrap">
        <header className="sec-head">
          <Stop n={1} label="Lines" />
          <h2 id="services-title">What I build</h2>
          <p className="sec-lede">Four kinds of work, each its own line. A project that mixes kinds is an interchange, where the lines meet.</p>
        </header>
        <ul className="lines" ref={ref}>
          {services.map((s) => {
            const works = featuredProjects.filter((p) => linesOf(p).includes(s.key));
            return (
              <li key={s.key} className={`line-card ln-${s.key}`}>
                <div className="lc-track" aria-hidden><i /><i /><i /></div>
                <LineBadge line={s.key} full={false} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <p className="lc-stops">
                  {works.length
                    ? <>Stations: {works.map((p, i) => (<span key={p.name}>{i > 0 && (i === works.length - 1 ? " and " : ", ")}<a href={`#p-${slug(p.name)}`}>{p.name}</a></span>))}</>
                    : <>Stations: <a href="#research">the research papers below</a></>}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- work: the stations */

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
    <section id="work" className="sec sec-alt" aria-labelledby="work-title">
      <div className="wrap">
        <header className="sec-head">
          <Stop n={2} label="Stations" />
          <h2 id="work-title">Selected work</h2>
          <p className="sec-lede">
            Production systems for clients and my own products, in the order they appear on the map. Private repositories
            are described without code, and I’m happy to walk you through them on a call.
          </p>
        </header>
        <ol className="route">
          {featuredProjects.map((p, i) => {
            const ls = linesOf(p);
            const style = { "--c1": `var(--l-${ls[0]})`, "--c2": `var(--l-${ls[1] ?? ls[0]})`, "--c3": `var(--l-${ls[2] ?? ls[1] ?? ls[0]})`, "--n": ls.length } as CSSProperties;
            return (
              <li key={p.name} id={`p-${slug(p.name)}`} className={`stn ${i % 2 ? "r" : "l"}${ls.length > 1 ? " multi" : ""}`} style={style}>
                <span className="stn-node" aria-hidden />
                <article className="stn-card">
                  <span className="stn-bar" aria-hidden />
                  <header className="stn-top">
                    <p className="stn-code">Station {pad2(i + 1)}</p>
                    <ul className="badges">{ls.map((l) => <li key={l}><LineBadge line={l} /></li>)}</ul>
                  </header>
                  <h3>{p.name}</h3>
                  <p className="stn-kind">{p.kind}</p>
                  <p className="stn-desc">{p.description}</p>
                  <ul className="stack">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
                  <ProjectLinks p={p} />
                </article>
              </li>
            );
          })}
        </ol>

        <div className="more">
          <h3 className="more-h">Also built</h3>
          <ul className="board">
            {moreProjects.map((p) => (
              <li key={p.name}>
                <div className="bd-name">
                  <p className="more-name">{p.name}</p>
                  <p className="more-kind">{p.kind}</p>
                </div>
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
    <section id="process" className="sec" aria-labelledby="process-title">
      <div className="wrap">
        <header className="sec-head">
          <Stop n={3} label="Route" />
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
    <section id="companies" className="sec sec-alt" aria-labelledby="companies-title">
      <div className="wrap">
        <header className="sec-head">
          <Stop n={4} label="Depots" />
          <h2 id="companies-title">Companies</h2>
          <p className="sec-lede">Gikpik, BuildIoT Lab and BuildIoT BD are sister companies. Alongside freelance work, I build the technical side of each.</p>
        </header>
        <ul className="co-list">
          {companies.map((c) => (
            <li key={c.name} className="co">
              <div className="co-logo"><CompanyLogo name={c.name} /></div>
              <div className="co-body">
                <h3>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.name}<span aria-hidden> ↗</span></a> : c.name}</h3>
                <p className="co-kind">{c.kind.split(" · ").pop()}</p>
                <p className="co-desc">{c.description}</p>
                <p className="co-role">My part: {c.role.charAt(0).toLowerCase() + c.role.slice(1)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- research: the IoT line */

function Research() {
  const [ref, seen] = useInView<HTMLDivElement>();
  useEffect(() => { if (seen) unlock("scholar"); }, [seen]);
  return (
    <section id="research" className="sec" aria-labelledby="research-title">
      <div className="wrap" ref={ref}>
        <header className="sec-head">
          <Stop n={5} label="IoT line" />
          <h2 id="research-title">Research</h2>
          <p className="sec-lede">Low-cost IoT for everyday problems in Bangladesh, written with classmates and faculty at Daffodil International University.</p>
        </header>
        <ol className="papers ln-iot">
          {research.map((r, i) => (
            <li key={r.title} className={`paper${i === 0 ? " lead" : ""}`}>
              <span className="paper-node" aria-hidden />
              <p className="paper-tag">{r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "In preparation"}</p>
              <h3>{r.title}</h3>
              <p className="paper-venue">{r.venue}</p>
              <p className="paper-sum">{r.summary}</p>
            </li>
          ))}
        </ol>
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
          <Stop n={7} label="Toolkit" />
          <h2 id="skills-title">Tools I use</h2>
          <p className="sec-lede">Chosen per project. Most of my production work is in TypeScript, Python and PHP.</p>
        </header>
        <dl className="skills">
          {skillGroups.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.items.map((it) => <span key={it}>{it}</span>)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- contact: the terminus */

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
        <div className="terminus">
          <div className="tm-lines" aria-hidden><i className="b-backend" /><i className="b-automation" /><i className="b-commerce" /><i className="b-iot" /></div>
          <div className="tm-body">
            <p className="eyebrow eyebrow-inv"><span className="eb-n" aria-hidden>08</span>Terminus</p>
            <h2 id="contact-title">Have a project in mind?</h2>
            <p className="sec-lede">I take on freelance backend, automation and e-commerce work. The quickest start is a short brief: six questions, about 30 seconds.</p>
            <div className="cta">
              <button type="button" className="btn btn-inv" onClick={() => emit("hire")}>Start a project brief</button>
              <button type="button" className="btn btn-inv-line" onClick={() => emit("resume")}>Get my resume, CV or portfolio</button>
            </div>
            <p className="mail">
              Or email <a href={`mailto:${LINKS.email}`} onClick={() => unlock("client")}>{LINKS.email}</a> <CopyEmail />
            </p>
          </div>
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
          Set in Instrument Sans and Martian Mono. The route map is drawn by code: each line is a kind of work, and each
          interchange is a project that covers more than one.
        </p>
        <p>
          Press <button type="button" className="btn-text" onClick={() => emit("palette")}><kbd>{mac ? "⌘K" : "Ctrl K"}</kbd></button> for commands.
        </p>
      </div>
    </footer>
  );
}

