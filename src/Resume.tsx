import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { PORTRAIT, PROFILE, companies, research, type Project } from "./data";
import {
  ACCENTS, DOC_TYPES, FLOW, FOCUS, FOCUSES, PROJECT_TOTAL, SECTION_LABEL, TEMPLATES, TYPE_SECTIONS,
  canSplit, companyKind, contactItems, defaultOptions, effectiveMax, fileName, firstSentence, orderedSkills, pickProjects,
  sanitizeOptions, sectionsFor, shortUrl, type ContactItem, type DocType, type Options, type SectionKey,
} from "./resumeModel";
import "@fontsource-variable/instrument-sans/wdth.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "./resume.css";

/* The résumé builder (`resume` / `cv` in the terminal). It lays out a document from the same data the
   site uses (src/data.ts) and prints it to PDF with the browser, so the PDF has real, selectable text.
   The builder is loaded on demand (see ResumeLauncher in Extras.tsx), so it adds nothing to the first load. */

const KEY = "rx33.resume.v1";
const MM = 96 / 25.4;
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;
const PAD = 14 * MM;

/* ------------------------------------------------------------------ the document */

function ContactList({ items, stacked }: { items: ContactItem[]; stacked?: boolean }) {
  if (!items.length) return null;
  return (
    <ul className={`d-contact${stacked ? " stacked" : ""}`}>
      {items.map((i) => (
        <li key={i.text}>{i.href ? <a href={i.href}>{i.text}</a> : i.text}</li>
      ))}
    </ul>
  );
}

function Sec({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`d-sec ${className}`}>
      <h3 className="d-h">{title}</h3>
      {children}
    </section>
  );
}

function Links({ p, one, compact }: { p: Project; one?: boolean; compact?: boolean }) {
  const links = [p.live && { label: "Live", url: p.live }, p.code && { label: "Source", url: p.code }].filter(Boolean) as { label: string; url: string }[];
  if (!links.length) return <p className="d-links">{compact ? "Private repository" : "Private repository. Walkthrough on request."}</p>;
  return (
    <p className="d-links">
      {(one ? links.slice(0, 1) : links).map((l, i) => (
        <span key={l.url}>
          {i > 0 && <span className="d-sep"> · </span>}
          <a href={l.url}>{shortUrl(l.url)}</a>
        </span>
      ))}
    </p>
  );
}

function ProjectItem({ p, compact }: { p: Project; compact: boolean }) {
  return (
    <div className="d-item">
      <div className="d-row">
        <h4>{p.name}</h4>
        <span className="d-when">{p.kind}</span>
      </div>
      <p>{compact ? firstSentence(p.description) : p.description}</p>
      {compact ? (
        <div className="d-row d-foot">
          <p className="d-meta">{p.stack.join(" · ")}</p>
          <Links p={p} one compact />
        </div>
      ) : (
        <>
          <p className="d-meta">{p.stack.join(" · ")}</p>
          <Links p={p} />
        </>
      )}
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="d-card">
      <p className="d-kind">{p.kind}</p>
      <h4>{p.name}</h4>
      <p>{p.description}</p>
      <ul className="d-chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
      <Links p={p} />
    </article>
  );
}

export function DocView({ o, innerRef }: { o: Options; innerRef?: Ref<HTMLElement> }) {
  const headline = o.headline.trim() || FOCUS[o.focus].headline;
  const summary = o.summary.trim() || PROFILE.summary;
  const contacts = contactItems(o);
  const projects = o.sections.projects ? pickProjects(o) : [];
  const skills = orderedSkills(o.focus);
  const compact = o.type === "resume";
  const portfolio = o.type === "portfolio";
  const split = o.template === "split" && canSplit(o.type);
  const style = { "--acc": o.accent } as CSSProperties;

  const s = o.sections;
  const sec: Record<SectionKey, ReactNode> = {
    summary: s.summary && (
      <Sec key="summary" title="Summary">
        <p className="d-sum">{summary}</p>
      </Sec>
    ),
    experience: s.experience && (
      <Sec key="experience" title="Experience">
        {PROFILE.experience.map((e) => (
          <div className="d-item" key={e.role}>
            <div className="d-row">
              <h4>{e.role}</h4>
              <span className="d-when">{compact ? `${e.org} · ${e.period}` : e.period}</span>
            </div>
            {!compact && <p className="d-sub">{e.org}</p>}
            <ul>{e.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
          </div>
        ))}
      </Sec>
    ),
    companies: s.companies && (
      <Sec key="companies" title="Companies">
        {companies.map((c) => (
          <div className="d-item" key={c.name}>
            {compact ? (
              <div className="d-row">
                <h4>{c.name}<span className="d-inl"> · {companyKind(c.kind)}</span></h4>
                <span className="d-when">{c.role}</span>
              </div>
            ) : (
              <>
                <div className="d-row">
                  <h4>{c.name}</h4>
                  <span className="d-when">{companyKind(c.kind)}</span>
                </div>
                <p>{`${c.role}. ${c.description}`}</p>
                {c.url && <p className="d-links"><a href={c.url}>{shortUrl(c.url)}</a></p>}
              </>
            )}
          </div>
        ))}
      </Sec>
    ),
    projects: projects.length > 0 && (
      <Sec key="projects" title={portfolio ? "Selected work" : "Projects"} className={portfolio ? "d-work" : ""}>
        {portfolio ? (
          <div className="d-cards">{projects.map((p) => <ProjectCard key={p.name} p={p} />)}</div>
        ) : (
          projects.map((p) => <ProjectItem key={p.name} p={p} compact={compact} />)
        )}
      </Sec>
    ),
    research: s.research && (
      <Sec key="research" title="Research">
        {research.map((r) => (
          <div className="d-item" key={r.title}>
            <div className="d-row">
              <h4>{r.title}</h4>
              <span className="d-when">{r.status ?? "in preparation"}</span>
            </div>
            <p className="d-sub">{r.venue}</p>
            {!compact && <p>{r.summary}</p>}
          </div>
        ))}
      </Sec>
    ),
    skills: s.skills && (
      <Sec key="skills" title="Skills">
        <dl className="d-skills">
          {skills.map((g) => (
            <div key={g.label}>
              <dt>{g.label}</dt>
              <dd>{g.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Sec>
    ),
    education: s.education && (
      <Sec key="education" title="Education">
        {PROFILE.education.map((e) => (
          <div className="d-item" key={e.degree}>
            {compact && !split ? (
              <div className="d-row">
                <h4>{e.degree}, {e.school}</h4>
                <span className="d-when">{e.detail}</span>
              </div>
            ) : (
              <>
                <h4>{e.degree}</h4>
                <p className="d-sub">{e.school}</p>
                <p className="d-sub">{e.detail}</p>
              </>
            )}
          </div>
        ))}
      </Sec>
    ),
  };

  const photo = o.showPhoto ? <img className="d-photo" src={PORTRAIT} alt="" /> : null;
  const prompt = o.template === "terminal" ? <p className="d-prompt">rakibul@dhaka:~$ {portfolio ? "ls ~/projects" : "whoami"}</p> : null;

  if (portfolio) {
    return (
      <article ref={innerRef} className="doc" data-tpl={o.template} data-type="portfolio" style={style} aria-label="Portfolio preview">
        <section className="d-cover">
          {photo}
          {prompt}
          <p className="d-kicker">Portfolio</p>
          <p className="d-name">{PROFILE.name}</p>
          <p className="d-title">{headline}</p>
          {s.summary && <p className="d-sum">{summary}</p>}
          <ContactList items={contacts} />
        </section>
        {(["projects", "companies", "research", "skills"] as const).map((k) => sec[k])}
      </article>
    );
  }

  const header = (
    <header className="d-head">
      {photo}
      <div className="d-id">
        {prompt}
        <p className="d-name">{PROFILE.name}</p>
        <p className="d-title">{headline}</p>
        {!split && <ContactList items={contacts} />}
      </div>
    </header>
  );

  if (split) {
    return (
      <article ref={innerRef} className="doc" data-tpl="split" data-type={o.type} style={style} aria-label={`${o.type} preview`}>
        {header}
        <div className="d-body">
          <aside className="d-side">
            <Sec title="Contact"><ContactList items={contacts} stacked /></Sec>
            {sec.skills}
            {sec.education}
          </aside>
          <div className="d-main">{(["summary", "experience", "projects", "companies", "research"] as const).map((k) => sec[k])}</div>
        </div>
      </article>
    );
  }

  return (
    <article ref={innerRef} className="doc" data-tpl={o.template} data-type={o.type} style={style} aria-label={`${o.type} preview`}>
      {header}
      <div className="d-main">{FLOW[o.type === "cv" ? "cv" : "resume"].map((k) => sec[k])}</div>
    </article>
  );
}

/* ------------------------------------------------------------------ controls */

type Choice<T extends string> = { id: T; label: string; disabled?: boolean };

function Seg<T extends string>({ legend, name, value, options, onChange, hint }: {
  legend: string; name: string; value: T; options: Choice<T>[]; onChange: (v: T) => void; hint?: string;
}) {
  return (
    <fieldset className="rb-f">
      <legend>{legend}</legend>
      <div className="rb-seg">
        {options.map((op) => (
          <label key={op.id} className={`${value === op.id ? "on" : ""}${op.disabled ? " off" : ""}`}>
            <input type="radio" name={name} value={op.id} checked={value === op.id} disabled={op.disabled} onChange={() => onChange(op.id)} />
            <span>{op.label}</span>
          </label>
        ))}
      </div>
      {hint && <p className="rb-hint">{hint}</p>}
    </fieldset>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="rb-chk">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function load(): Options {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return sanitizeOptions(JSON.parse(raw));
  } catch { /* blocked storage or bad JSON: start from the defaults */ }
  return defaultOptions();
}

export default function ResumeBuilder({ onClose }: { onClose: () => void }) {
  const uid = useId();
  const [o, setO] = useState<Options>(load);
  const set = useCallback(<K extends keyof Options>(k: K, v: Options[K]) => setO((p) => ({ ...p, [k]: v })), []);
  const dialog = useRef<HTMLDivElement>(null);
  const doc = useRef<HTMLElement | null>(null);
  const fit = useRef<HTMLDivElement>(null);
  const [docH, setDocH] = useState(PAGE_H);
  const [scale, setScale] = useState(1);

  // Remember the settings for this visitor. The phone number is typed here and never leaves the browser.
  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* ignore */ }
  }, [o]);

  // Keep the page behind still, hide it from printing and assistive tech, and close on Escape.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    const app = document.getElementById("root");
    root.style.overflow = "hidden";
    document.body.classList.add("rb-open");
    app?.setAttribute("inert", "");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", onKey);
    dialog.current?.querySelector<HTMLElement>("input:checked")?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = prevOverflow;
      document.body.classList.remove("rb-open");
      app?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // The PDF's default file name comes from the page title while printing.
  const name = fileName(o);
  useEffect(() => {
    let prev = document.title;
    const before = () => { prev = document.title; document.title = name; };
    const after = () => { document.title = prev; };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => { window.removeEventListener("beforeprint", before); window.removeEventListener("afterprint", after); };
  }, [name]);

  // Preview: scale the A4 sheet down to fit narrow screens, and measure it to estimate the page count.
  useEffect(() => {
    const el = doc.current;
    const box = fit.current;
    if (!el || !box) return;
    const measure = () => {
      setDocH(el.offsetHeight);
      setScale(Math.min(1, box.clientWidth / PAGE_W));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const pages = Math.max(1, Math.ceil((docH - 2 * PAD - 2) / (PAGE_H - 2 * PAD)));
  const over = o.type === "resume" && pages > 1;
  const sheet = DOC_TYPES.find((t) => t.id === o.type)!;
  const shown = effectiveMax(o);

  const setType = (type: DocType) =>
    setO((p) => ({ ...p, type, sections: sectionsFor(type), maxProjects: null, template: p.template === "split" && !canSplit(type) ? "clean" : p.template }));
  const setSection = (k: SectionKey, v: boolean) => setO((p) => ({ ...p, sections: { ...p.sections, [k]: v } }));

  return createPortal(
    <div className="rb-backdrop" ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`}>
      {/* A4, no browser margins: the document carries its own padding, which also keeps the browser's headers and footers off the PDF. */}
      <style>{"@page{size:A4;margin:0}"}</style>
      <div className="rb">
        <header className="rb-bar">
          <h2 id={`${uid}-title`}>Resume builder</h2>
          <p className={`rb-pages${over ? " warn" : ""}`} role="status">
            ≈ {pages} {pages === 1 ? "page" : "pages"}{over ? ". Over one page." : ""}
          </p>
          <button type="button" className="rb-btn primary" onClick={() => window.print()}>Download PDF</button>
          <button type="button" className="rb-btn" onClick={onClose} aria-label="Close the resume builder">Close</button>
        </header>

        <div className="rb-main">
          <div className="rb-panel">
            <Seg legend="Document" name={`${uid}-type`} value={o.type} onChange={setType} hint={sheet.blurb}
              options={DOC_TYPES.map((t) => ({ id: t.id, label: t.label }))} />

            <fieldset className="rb-f">
              <legend>Look</legend>
              <div className="rb-seg">
                {TEMPLATES.map((t) => {
                  const off = t.id === "split" && !canSplit(o.type);
                  return (
                    <label key={t.id} className={`${o.template === t.id ? "on" : ""}${off ? " off" : ""}`} title={off ? "Split is for the one-page resume" : undefined}>
                      <input type="radio" name={`${uid}-tpl`} checked={o.template === t.id} disabled={off} onChange={() => set("template", t.id)} />
                      <span>{t.label}</span>
                    </label>
                  );
                })}
              </div>
              <div className="rb-swatches" role="radiogroup" aria-label="Accent colour">
                {ACCENTS.map((a) => (
                  <label key={a.id} className={o.accent === a.id ? "on" : ""} title={a.label}>
                    <input type="radio" name={`${uid}-acc`} checked={o.accent === a.id} onChange={() => set("accent", a.id)} aria-label={a.label} />
                    <i style={{ background: a.id }} />
                  </label>
                ))}
              </div>
            </fieldset>

            <Seg legend="Focus" name={`${uid}-focus`} value={o.focus} onChange={(v) => set("focus", v)}
              hint="Puts the most relevant projects and skills first, and sets the headline."
              options={FOCUSES.map((f) => ({ id: f.id, label: f.label }))} />

            <fieldset className="rb-f">
              <legend>Text</legend>
              <label className="rb-field">
                <span>Headline</span>
                <input type="text" maxLength={80} value={o.headline} placeholder={FOCUS[o.focus].headline} onChange={(e) => set("headline", e.target.value)} />
              </label>
              <label className="rb-field">
                <span>Summary</span>
                <textarea rows={5} maxLength={700} value={o.summary} placeholder={PROFILE.summary} onChange={(e) => set("summary", e.target.value)} />
              </label>
              <p className="rb-hint">Leave a field empty to use the text from the site.</p>
            </fieldset>

            <fieldset className="rb-f">
              <legend>Sections</legend>
              <div className="rb-checks">
                {TYPE_SECTIONS[o.type].map((k) => (
                  <Check key={k} label={SECTION_LABEL[k]} checked={o.sections[k]} onChange={(v) => setSection(k, v)} />
                ))}
              </div>
              {o.sections.projects && (
                <div className="rb-step">
                  <span id={`${uid}-n`}>Projects shown</span>
                  <button type="button" aria-label="Show fewer projects" disabled={shown <= 1} onClick={() => set("maxProjects", shown - 1)}>−</button>
                  <output aria-labelledby={`${uid}-n`}>{shown >= PROJECT_TOTAL ? "All" : shown}</output>
                  <button type="button" aria-label="Show more projects" disabled={shown >= PROJECT_TOTAL} onClick={() => set("maxProjects", shown + 1)}>+</button>
                </div>
              )}
              {over && <p className="rb-hint warn">This runs past one page. Show fewer projects or turn a section off.</p>}
            </fieldset>

            <fieldset className="rb-f">
              <legend>Contact</legend>
              <div className="rb-checks">
                <Check label="Email" checked={o.showEmail} onChange={(v) => set("showEmail", v)} />
                <Check label="Location" checked={o.showLocation} onChange={(v) => set("showLocation", v)} />
                <Check label="Web and profile links" checked={o.showLinks} onChange={(v) => set("showLinks", v)} />
                <Check label="Photo" checked={o.showPhoto} onChange={(v) => set("showPhoto", v)} />
              </div>
              <label className="rb-field">
                <span>Phone (optional)</span>
                <input type="tel" inputMode="tel" autoComplete="off" maxLength={24} value={o.phone} placeholder="+880 ..." onChange={(e) => set("phone", e.target.value)} />
              </label>
              <p className="rb-hint">Your phone number and settings stay in this browser. Nothing is uploaded.</p>
            </fieldset>

            <div className="rb-foot">
              <button type="button" className="rb-btn" onClick={() => setO(defaultOptions())}>Reset everything</button>
              <p className="rb-hint">Download PDF opens the print dialog. Choose “Save as PDF” as the destination.</p>
            </div>
          </div>

          <div className="rb-stage">
            <div className="rb-fit" ref={fit}>
              <div className="rb-paper" style={{ width: PAGE_W * scale, height: docH * scale }}>
                <div className="rb-scale" style={{ transform: `scale(${scale})`, width: PAGE_W }}>
                  <DocView o={o} innerRef={doc} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
