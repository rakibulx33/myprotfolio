import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HANDLE, LINKS, PORTRAIT, PROFILE, SOCIALS, featuredProjects, moreProjects, research, type Project } from "./data";
import { prefersReducedMotion } from "./hooks";
import { goTo } from "./motion";
import { ACHIEVEMENTS, TOTAL, emit, isUnlocked, unlock, unlockedCount, useAchievementCount, useRxEvent } from "./store";

/* The command palette (Ctrl K or ⌘K): a search over every section, project, profile and action. The terminal in
   the hero is where commands are typed ("/" focuses it); the same commands also work here when typed in full. */

const ALL = [...featuredProjects, ...moreProjects];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const SECTIONS = [
  { id: "top", label: "Top of the page", keys: "home start" },
  { id: "services", label: "What I build", keys: "services backend e-commerce automation ai iot" },
  { id: "work", label: "Selected work", keys: "work projects portfolio" },
  { id: "process", label: "How we'd work together", keys: "process steps brief plan build launch" },
  { id: "companies", label: "Companies", keys: "gikpik buildiot sister" },
  { id: "research", label: "Research", keys: "research iot machine learning" },
  { id: "github", label: "A year on GitHub", keys: "github contributions commits activity" },
  { id: "skills", label: "Tools I use", keys: "skills stack languages" },
  { id: "contact", label: "Contact", keys: "email socials hire" },
];

/** Scroll to a section and move keyboard focus there too. */
export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  goTo(id);
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
};

type Group = "Actions" | "Go to" | "Projects" | "Profiles";
type Result = { out?: ReactNode; close?: boolean; then?: () => void; /** show `out`, then close and run `then` after this many ms */ delay?: number };
type Item = { id: string; group: Group; label: string; hint?: string; keys?: string; run: () => Result };

/* ------------------------------------------------------------------ outputs shown inside the palette */

function Whoami() {
  const facts: [string, string][] = [
    ["Role", "Backend and automation developer"],
    ["Based in", "Dhaka, Bangladesh"],
    ["Freelancing", "since 2022"],
    ["Studying", "CSE at Daffodil International University"],
    ["Research", "low-cost IoT for Bangladesh"],
    ["Status", "taking new projects"],
  ];
  return (
    <div className="pal-who">
      <img src={PORTRAIT} alt="Rakibul Hasan" width={720} height={960} />
      <div>
        <p className="pal-who-name">{PROFILE.name}</p>
        <dl>{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </div>
    </div>
  );
}

function Achievements() {
  return (
    <div className="pal-ach-list">
      <p className="pal-out-title">{unlockedCount()} of {TOTAL} achievements unlocked</p>
      <ul>
        {ACHIEVEMENTS.map((a) => {
          const ok = isUnlocked(a.id);
          return (
            <li key={a.id} className={ok ? "ok" : ""}>
              <span className="pal-tick" aria-hidden>{ok ? "✓" : ""}</span>
              <span>{a.title}{!ok && <span className="pal-dim">: {a.hint}</span>}</span>
              <span className="sr-only">{ok ? "unlocked" : "locked"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Hack() {
  const steps = [
    "Connecting to rakibulx33.me:22 …",
    "Bypassing the firewall … 100%",
    "Decrypting /home/rakibul/.ssh …",
    "Access granted.",
    "Just kidding. The only thing worth hacking here is your backlog.",
  ];
  const [k, setK] = useState(() => (prefersReducedMotion() ? steps.length : 1));
  useEffect(() => {
    if (k >= steps.length) return;
    const id = window.setTimeout(() => setK(k + 1), 420);
    return () => window.clearTimeout(id);
  }, [k, steps.length]);
  return (
    <div className="pal-lines">
      {steps.slice(0, k).map((s, i) => <p key={i} className={i === 3 ? "pal-ok" : i < 3 ? "pal-dim" : ""}>{s}</p>)}
      {k >= steps.length && <p><button type="button" className="pal-link" onClick={() => emit("hire")}>Start a project brief</button> and I’ll take care of it.</p>}
    </div>
  );
}

function ProjectOut({ p }: { p: Project }) {
  return (
    <div className="pal-project">
      <p className="pal-out-title">{p.name}</p>
      <p className="pal-dim">{p.kind}</p>
      <p>{p.description}</p>
      <p className="pal-dim">Built with {p.stack.join(", ")}</p>
      <p className="pal-links">
        {p.live && <a href={p.live} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>Open the live site</a>}
        {p.code && <a href={p.code} target="_blank" rel="noreferrer" onClick={() => unlock("explorer")}>View the source</a>}
        {!p.live && !p.code && <span>Private repository. <button type="button" className="pal-link" onClick={() => emit("hire")}>Ask me for a walkthrough</button></span>}
      </p>
    </div>
  );
}

const HELP: [string, string][] = [
  ["hire", "start a project brief"],
  ["resume", "build my resume, CV or portfolio as a PDF (also cv)"],
  ["whoami", "who I am"],
  ["open <project>", "a project's details and links"],
  ["cd <section>", "jump to a section"],
  ["socials", "every profile I have"],
  ["achievements", "what you've unlocked"],
  ["date", "the time in Dhaka"],
];

function Help() {
  return (
    <div className="pal-help">
      <p className="pal-out-title">Commands you can type</p>
      <dl>{HELP.map(([c, d]) => <div key={c}><dt>{c}</dt><dd>{d}</dd></div>)}</dl>
      <p className="pal-dim">A few are hidden. Start with ls -a.</p>
    </div>
  );
}

const MUG = "   ( (\n    ) )\n  ........\n  |      |]\n  \\      /\n   `----'";

/* ------------------------------------------------------------------ typed commands */

function textCommand(raw: string): Result | null {
  const [cmd = "", ...rest] = raw.trim().split(/\s+/);
  const arg = rest.join(" ");
  switch (cmd.toLowerCase()) {
    case "help":
    case "?":
      return { out: <Help /> };
    case "hire":
      return { close: true, then: () => emit("hire") };
    case "resume":
    case "cv":
    case "resume.pdf":
      return { close: true, then: () => emit("resume") };
    case "whoami":
    case "neofetch":
      unlock("whoami");
      return { out: <Whoami /> };
    case "achievements":
      return { out: <Achievements /> };
    case "socials":
    case "social":
      return { out: (
        <div className="pal-socials">
          <p className="pal-out-title">All {SOCIALS.length} profiles, all @{HANDLE}</p>
          <ul>{SOCIALS.map((s) => <li key={s.name}><a href={s.url} target="_blank" rel="noreferrer me">{s.name}</a></li>)}</ul>
        </div>
      ) };
    case "ls":
      if (/-\w*a/.test(arg)) {
        unlock("egg");
        return { out: (
          <div className="pal-lines">
            <p>.secret  projects/  research/  services.txt  resume.pdf  profile.jpg</p>
            <p className="pal-dim">Hidden: matrix, hack, cha, sudo hire rakibul, and one for keyboard veterans.</p>
          </div>
        ) };
      }
      return { close: true, then: () => scrollToId("work") };
    case "cat":
      if (/^\.?secret/i.test(arg)) {
        unlock("egg");
        return { out: <div className="pal-lines"><p className="pal-ok">You found the secret file.</p><p>Not many visitors get this far. If you send me a brief, mention “the secret file” so I know you explored.</p></div> };
      }
      if (/resume|cv/i.test(arg)) return { close: true, then: () => emit("resume") };
      return null;
    case "open": {
      const p = arg ? ALL.find((x) => slug(x.name).startsWith(slug(arg))) : undefined;
      return p ? { out: <ProjectOut p={p} /> } : { out: <p className="pal-err">No project matches “{arg || "?"}”. Try typing part of its name.</p> };
    }
    case "cd": {
      const want = arg.replace(/^~?\/?/, "").toLowerCase();
      const s = SECTIONS.find((x) => x.id.startsWith(want) || x.label.toLowerCase().startsWith(want));
      return s && want ? { close: true, then: () => scrollToId(s.id) } : { out: <p className="pal-err">No section called “{arg || "?"}”. Sections: {SECTIONS.map((x) => x.id).join(", ")}.</p> };
    }
    case "date":
    case "time":
      return { out: <p>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(new Date())} in Dhaka.</p> };
    case "matrix":
      return { close: true, then: () => emit("matrix") };
    case "hack":
      unlock("egg");
      return { out: <Hack /> };
    case "coffee":
    case "tea":
    case "cha":
      unlock("egg");
      return { out: <div className="pal-lines"><pre className="pal-mug" aria-hidden>{MUG}</pre><p>Brewing cha … done. Now, what are we building? Type hire.</p></div> };
    case "rm":
      unlock("egg");
      return { out: <p className="pal-err">Permission denied. This site is read-only for visitors, but my inbox isn’t. Type hire.</p> };
    case "sudo":
      unlock("egg");
      if (/^hire/i.test(arg)) return { out: <p className="pal-ok">[sudo] password for visitor: ******** Access granted.</p>, delay: 900, then: () => emit("hire") };
      return { out: <p className="pal-err">visitor is not in the sudoers file. This incident will be reported. (Try sudo hire rakibul.)</p> };
    case "github":
      return { close: true, then: () => window.open(LINKS.github, "_blank", "noopener") };
    case "linkedin":
      return { close: true, then: () => window.open(LINKS.linkedin, "_blank", "noopener") };
    case "email":
    case "contact":
      return { close: true, then: () => scrollToId("contact") };
    case "exit":
    case "clear":
      return { close: true };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ the palette */

const match = (it: Item, q: string) => {
  const hay = `${it.label} ${it.hint ?? ""} ${it.keys ?? ""}`.toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
};

export default function Palette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const [out, setOut] = useState<ReactNode>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const used = useRef(new Set<string>());
  const count = useAchievementCount();
  const uid = useId();

  const show = useCallback((preset?: unknown) => {
    opener.current = document.activeElement as HTMLElement | null;
    setQ(typeof preset === "string" ? preset : "");
    setOut(null);
    setHi(0);
    setOpen(true);
  }, []);
  useRxEvent("palette", show);

  const close = useCallback((restore = true) => {
    setOpen(false);
    if (restore) opener.current?.focus?.({ preventScroll: true });
  }, []);

  // Ctrl K / ⌘K toggles it anywhere ("/" belongs to the terminal).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close(); else show();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show, close]);

  // While open: keep the page still and out of reach, focus the input.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    const app = document.getElementById("root");
    root.style.overflow = "hidden";
    app?.setAttribute("inert", "");
    input.current?.focus({ preventScroll: true });
    return () => { root.style.overflow = prev; app?.removeAttribute("inert"); };
  }, [open]);

  const items = useMemo<Item[]>(() => {
    return [
      { id: "hire", group: "Actions", label: "Start a project brief", hint: "Six questions, about 30 seconds", keys: "hire brief project contact", run: () => ({ close: true, then: () => emit("hire") }) },
      { id: "resume", group: "Actions", label: "Get my resume, CV or portfolio", hint: "As a PDF", keys: "resume cv pdf download portfolio", run: () => ({ close: true, then: () => emit("resume") }) },
      { id: "copy", group: "Actions", label: "Copy my email address", hint: LINKS.email, keys: "email mail copy", run: () => {
        navigator.clipboard?.writeText(LINKS.email).catch(() => {});
        return { out: <p className="pal-ok">Copied {LINKS.email}</p> };
      } },
      { id: "whoami", group: "Actions", label: "Who is Rakibul?", hint: "whoami", keys: "about who profile neofetch", run: () => { unlock("whoami"); return { out: <Whoami /> }; } },
      ...SECTIONS.map((s) => ({ id: `go-${s.id}`, group: "Go to" as Group, label: s.label, keys: `${s.id} ${s.keys}`, run: () => ({ close: true, then: () => scrollToId(s.id) }) })),
      ...ALL.map((p) => ({ id: `p-${slug(p.name)}`, group: "Projects" as Group, label: p.name, hint: p.kind, keys: p.stack.join(" "), run: () => ({ out: <ProjectOut p={p} /> }) })),
      ...research.map((r) => ({ id: `r-${slug(r.title)}`, group: "Projects" as Group, label: r.title, hint: "Research", keys: "research", run: () => ({ close: true, then: () => scrollToId("research") }) })),
      ...SOCIALS.map((s) => ({ id: `s-${s.name}`, group: "Profiles" as Group, label: s.name, hint: s.label, keys: s.group, run: () => ({ close: true, then: () => window.open(s.url, "_blank", "noopener") }) })),
    ];
  }, []);

  const query = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!query) {
      // Without a query: actions, sections, the featured work and the main profiles.
      return items.filter((it) => it.group === "Actions" || it.group === "Go to" || (it.group === "Projects" && featuredProjects.some((p) => `p-${slug(p.name)}` === it.id)) || (it.group === "Profiles" && ["GitHub", "LinkedIn", "Fiverr", "Telegram"].includes(it.label)));
    }
    return items.filter((it) => match(it, query)).sort((a, b) => Number(b.label.toLowerCase().startsWith(query)) - Number(a.label.toLowerCase().startsWith(query)));
  }, [items, query]);

  const groups = useMemo(() => {
    const order: Group[] = ["Actions", "Go to", "Projects", "Profiles"];
    return order.map((g) => ({ g, items: shown.filter((x) => x.group === g) })).filter((x) => x.items.length);
  }, [shown]);
  const flat = groups.flatMap((g) => g.items);

  useEffect(() => { setHi(0); }, [query]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-k="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const finish = (r: Result, key: string) => {
    used.current.add(key);
    if (used.current.size >= 3) unlock("operator");
    if (r.out) setOut(r.out);
    const done = () => { close(); if (r.then) requestAnimationFrame(r.then); };
    if (r.delay) window.setTimeout(done, r.delay);
    else if (r.close) done();
    else r.then?.();
  };

  const runText = () => {
    const word = query.split(/\s+/)[0];
    const r = textCommand(q);
    if (r) { finish(r, `cmd:${word}`); return true; }
    return false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { e.preventDefault(); if (out && q) { setOut(null); } else close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setOut(null); setHi((h) => Math.min(flat.length - 1, h + 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setOut(null); setHi((h) => Math.max(0, h - 1)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      // A typed command wins when it is one (so "hire", "ls -a" and "open trad" behave like the old terminal).
      if (query && runText()) return;
      const it = flat[hi];
      if (it) finish(it.run(), it.id);
      else if (query) setOut(<p className="pal-err">Nothing matches “{q}”. Type help to see the commands.</p>);
    }
  };

  if (!open) return null;
  const listId = `${uid}-list`;
  const active = flat[hi];

  return createPortal(
    <div className="pal-backdrop" data-lenis-prevent onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pal-in">
          <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOut(null); }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={!out}
            aria-controls={listId}
            aria-activedescendant={!out && active ? `${uid}-${active.id}` : undefined}
            aria-autocomplete="list"
            placeholder="Search sections, projects and commands"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
          <button type="button" className="pal-esc" onClick={() => close()}>Esc</button>
        </div>

        {out ? (
          <div className="pal-out" aria-live="polite">{out}</div>
        ) : (
          <div className="pal-list" id={listId} role="listbox" aria-label="Results" ref={list}>
            {groups.map(({ g, items: its }) => (
              <div role="group" aria-labelledby={`${uid}-g-${slug(g)}`} key={g}>
                <p className="pal-group" id={`${uid}-g-${slug(g)}`} role="presentation">{g}</p>
                {its.map((it) => {
                  const k = flat.indexOf(it);
                  return (
                    <div
                      key={it.id}
                      id={`${uid}-${it.id}`}
                      data-k={k}
                      role="option"
                      aria-selected={k === hi}
                      className={`pal-item${k === hi ? " on" : ""}`}
                      onMouseMove={() => k !== hi && setHi(k)}
                      onClick={() => finish(it.run(), it.id)}
                    >
                      <span className="pal-label">{it.label}</span>
                      {it.hint && <span className="pal-hint">{it.hint}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
            {!flat.length && (
              <p className="pal-empty">No matches. Press Enter to run “{q}” as a command, or type help.</p>
            )}
          </div>
        )}

        <div className="pal-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
          <span><kbd>Enter</kbd> to run</span>
          <span className="pal-grow"><kbd>Esc</kbd> to close</span>
          <button type="button" className="pal-link" onClick={() => setOut(<Achievements />)}>{count} of {TOTAL} achievements</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
