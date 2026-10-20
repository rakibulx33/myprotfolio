import { useEffect, useMemo, useRef, useState } from "react";
import { featuredProjects, moreProjects, research, skillGroups, LINKS, type Project } from "./data";

const PORTRAIT = "/profile.jpg?v=5";

type Contrib = { date: string; count: number; level: number };

/* Chip geometry, in the same units as the 400x500 viewBox that sits over the portrait.
   Six pins per side; the middle four on each side are routed down into the page. */
const PIN_Y = Array.from({ length: 6 }, (_, i) => 63.5 + i * 74.6);
const LEFT_ROUTES = [1, 2, 3, 4].map((pin, k) => {
  const x = -48 - 14 * (3 - k);
  return `M -30 ${PIN_Y[pin]} H ${x} V 560 L ${x - 40} 600 V 1000`;
});
const RIGHT_ROUTES = [1, 2, 3, 4].map((pin, k) => {
  const x = 452 + 18 * (3 - k);
  return `M 430 ${PIN_Y[pin]} H ${x} V 560 L ${x + 40} 600 V 1000`;
});

export default function Portfolio() {
  const [contribs, setContribs] = useState<Contrib[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [repos, setRepos] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://github-contributions-api.jogruber.de/v4/rakibulx33?y=last")
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res?.contributions)) setContribs(res.contributions);
        if (res?.total != null) {
          const t = typeof res.total === "object" ? Object.values(res.total as Record<string, number>).reduce((a, b) => a + b, 0) : res.total;
          setTotal(t);
        }
      })
      .catch(() => {});
    fetch("https://api.github.com/users/rakibulx33")
      .then((r) => r.json())
      .then((u) => typeof u?.public_repos === "number" && setRepos(u.public_repos))
      .catch(() => {});
  }, []);

  return (
    <>
      <a className="skip" href="#work">Skip to work</a>

      <header className="board">
        <span className="fiducial" style={{ left: 22, bottom: 30 }} aria-hidden />
        <span className="fiducial" style={{ right: 22, top: 104 }} aria-hidden />

        <nav className="nav wrap" aria-label="Main">
          <a href="#top" className="nav-name" style={{ textDecoration: "none" }}>Rakibul Hasan</a>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <ul>
              <li><a href="#work">Work</a></li>
              <li><a href="#research">Research</a></li>
              <li><a href="#skills">Skills</a></li>
            </ul>
            <a href="#contact" className="nav-cta">Contact</a>
          </div>
        </nav>

        <div id="top" className="hero wrap">
          <div>
            <p className="hero-kicker">Backend and automation developer in Dhaka</p>
            <h1>
              <span>Rakibul</span>
              <span>Hasan</span>
            </h1>
            <p className="hero-lede">
              I build the systems behind online stores, AI-powered SaaS and trading bots, and research low-cost IoT
              as a CSE student at Daffodil International University. Freelancing since 2022.
            </p>
            <div className="hero-actions">
              <a className="btn btn-gold" href="#work">See my work</a>
              <a className="btn btn-line" href={`mailto:${LINKS.email}`}>Email me</a>
              <span className="availability">Taking freelance projects</span>
            </div>
          </div>

          <div className="chip">
            <svg className="traces" viewBox="0 0 400 500" aria-hidden>
              {[...LEFT_ROUTES, ...RIGHT_ROUTES].map((d) => (
                <path key={d} d={d} />
              ))}
              <circle className="via" cx={-48 - 14 * 2 - 40} cy={600} r={6} />
              <circle className="via" cx={452 + 18 * 1 + 40} cy={600} r={6} />
            </svg>
            <span className="chip-label" aria-hidden>U1</span>
            <span className="chip-outline" aria-hidden />
            <span className="pins l" aria-hidden>{PIN_Y.map((y) => <span key={y} />)}</span>
            <span className="pins r" aria-hidden>{PIN_Y.map((y) => <span key={y} />)}</span>
            <div className="chip-photo">
              <img src={PORTRAIT} alt="Rakibul Hasan in a grey waistcoat and red tie" width={1086} height={1448} />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section id="work" className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>Selected work</h2>
              <p>
                Production systems for clients and my own products. Private repositories are described without code;
                I'm happy to walk through them on a call.
              </p>
            </div>

            <ul className="work-list">
              {featuredProjects.map((p) => (
                <li key={p.name} className="work">
                  <div>
                    <h3>{p.name}</h3>
                    <p className="kind">{p.kind}</p>
                  </div>
                  <p className="desc">{p.description}</p>
                  <div className="meta">
                    <p>{p.stack.join(", ")}</p>
                    <ProjectLinks p={p} />
                  </div>
                </li>
              ))}
            </ul>

            <h3 className="more-title">Also built</h3>
            <table className="more">
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">What it does</th>
                  <th scope="col">Built with</th>
                  <th scope="col">Links</th>
                </tr>
              </thead>
              <tbody>
                {moreProjects.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <span className="pname">{p.name}</span>
                      <span className="pkind">{p.kind}</span>
                    </td>
                    <td>{p.description}</td>
                    <td>{p.stack.join(", ")}</td>
                    <td><ProjectLinks p={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="research" className="section tint">
          <div className="wrap">
            <div className="section-head">
              <h2>Research</h2>
              <p>
                Low-cost IoT for everyday problems in Bangladesh, written with classmates and faculty at Daffodil
                International University. All four papers are in preparation.
              </p>
            </div>
            <ul className="papers">
              {research.map((r) => (
                <li key={r.title} className="paper">
                  <h3>{r.title}</h3>
                  <p className="venue">{r.venue}</p>
                  <p>{r.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="wrap">
            <div className="section-head">
              <h2>Tools I use</h2>
              <p>Chosen per project. Most of my production work is in TypeScript, Python and PHP.</p>
            </div>
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

        <section id="github" className="section tint">
          <div className="wrap">
            <div className="section-head">
              <h2>On GitHub</h2>
              <p>
                {total != null ? `${total.toLocaleString()} contributions in the last year` : "My public code and day-to-day activity"}
                {repos != null ? `, across ${repos} public repositories.` : "."}{" "}
                <span className="links" style={{ display: "inline-flex" }}>
                  <a href={LINKS.github} target="_blank" rel="noreferrer">Open my profile</a>
                </span>
              </p>
            </div>
            {contribs.length > 0 && <Heatmap days={contribs} />}
          </div>
        </section>
      </main>

      <footer id="contact" className="board">
        <span className="fiducial" style={{ right: 22, top: 30 }} aria-hidden />
        <div className="contact wrap">
          <h2>Have a project in mind?</h2>
          <p>I take on freelance backend, automation and e-commerce work. Email is the fastest way to reach me.</p>
          <a className="mail" href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
          <ul className="socials">
            <li><a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a></li>
            <li><a href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li><a href={LINKS.facebook} target="_blank" rel="noreferrer">Facebook</a></li>
          </ul>
          <div className="footer">
            <span>© {new Date().getFullYear()} Rakibul Hasan</span>
            <a href="#top">Back to top</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function ProjectLinks({ p }: { p: Project }) {
  if (!p.code && !p.live) return <span className="private">Private repository</span>;
  return (
    <div className="links">
      {p.live && <a href={p.live} target="_blank" rel="noreferrer">Live site<span className="sr-only"> for {p.name}</span></a>}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer">Source code<span className="sr-only"> for {p.name}</span></a>}
    </div>
  );
}

function Heatmap({ days }: { days: Contrib[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const cells = useMemo(() => {
    const recent = days.slice(-364);
    const pad = recent.length ? new Date(recent[0].date + "T00:00:00").getDay() : 0;
    return [...Array<Contrib | null>(pad).fill(null), ...recent];
  }, [days]);

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, [cells]);

  return (
    <div>
      <div className="heat-wrap" ref={ref}>
        <div className="heat" role="img" aria-label="GitHub contribution calendar for the last year">
          {cells.map((c, i) => (
            <span key={i} data-l={c ? Math.min(4, c.level) : 0} title={c ? `${c.count} on ${c.date}` : undefined} style={c ? undefined : { visibility: "hidden" }} />
          ))}
        </div>
      </div>
      <div className="heat-legend" aria-hidden>
        Less
        <span style={{ background: "#d3ddd6" }} />
        <span style={{ background: "#a9c9b8" }} />
        <span style={{ background: "#5f9a82" }} />
        <span style={{ background: "#2a6a55" }} />
        <span style={{ background: "var(--mask)" }} />
        More
      </div>
    </div>
  );
}
