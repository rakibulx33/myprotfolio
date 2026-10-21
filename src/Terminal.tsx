import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { featuredProjects, moreProjects, research, skillGroups, LINKS } from "./data";
import { prefersReducedMotion } from "./hooks";

type Line = { id: number; node: ReactNode };

const PROMPT = (
  <span className="t-prompt">
    <span className="c-green">rakibul</span><span className="c-dim">@</span><span className="c-blue">dhaka</span>
    <span className="c-dim">:</span><span className="c-cyan">~</span><span className="c-dim">$</span>
  </span>
);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ALL = [...featuredProjects, ...moreProjects];
const COMMANDS = ["help", "whoami", "projects", "ls", "open", "research", "skills", "contact", "github", "linkedin", "email", "cd", "date", "clear", "sudo", "exit"];
export const CHIPS = ["help", "whoami", "projects", "research", "skills", "contact"];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });

function Jump({ to, label }: { to: string; label: string }) {
  return (
    <button type="button" className="t-jump" onClick={() => scrollTo(to)}>
      {label}
    </button>
  );
}

function run(raw: string, clear: () => void): ReactNode {
  const [cmd = "", ...args] = raw.trim().split(/\s+/);
  const arg = args.join(" ");
  switch (cmd.toLowerCase()) {
    case "":
      return null;
    case "help":
      return (
        <div className="t-grid">
          {[
            ["whoami", "who I am"],
            ["projects", "selected work (also: ls)"],
            ["open <name>", "links for a project"],
            ["research", "papers in preparation"],
            ["skills", "tools I use"],
            ["contact", "how to reach me"],
            ["cd <section>", "scroll to a section"],
            ["clear", "clear the screen"],
          ].map(([c, d]) => (
            <div key={c} className="t-row"><span className="c-cyan">{c}</span><span className="c-dim">{d}</span></div>
          ))}
        </div>
      );
    case "whoami":
      return (
        <div>
          <div className="t-name">Rakibul Hasan</div>
          <div>Backend and automation developer in Dhaka, Bangladesh.</div>
          <div className="c-dim">CSE student at Daffodil International University. Freelancing since 2022.</div>
        </div>
      );
    case "ls":
    case "projects":
      return (
        <div>
          {featuredProjects.map((p) => (
            <div key={p.name} className="t-row">
              <span className="c-cyan t-strong">{slug(p.name)}/</span>
              <span>{p.kind}{p.private && <span className="c-yellow"> (private)</span>}</span>
            </div>
          ))}
          <div className="c-dim">+ {moreProjects.length} more. Try <span className="c-cyan">open tradingspark</span> or <Jump to="projects" label="cd projects" /></div>
        </div>
      );
    case "open": {
      const p = ALL.find((x) => slug(x.name).startsWith(slug(arg)) && arg);
      if (!p) return <span className="c-red">open: no project matching "{arg || "?"}". Try <span className="c-cyan">projects</span>.</span>;
      if (!p.code && !p.live) return <span><span className="c-cyan t-strong">{p.name}</span>: private repository. Ask me for a walkthrough: <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a></span>;
      return (
        <div>
          <div className="c-cyan t-strong">{p.name}</div>
          <div className="c-dim">{p.description}</div>
          {p.live && <div>live    <a href={p.live} target="_blank" rel="noreferrer">{p.live.replace("https://", "")}</a></div>}
          {p.code && <div>source  <a href={p.code} target="_blank" rel="noreferrer">{p.code.replace("https://", "")}</a></div>}
        </div>
      );
    }
    case "research":
      return (
        <div>
          {research.map((r) => (
            <div key={r.title}><span className="c-yellow">[in preparation]</span> {r.title}</div>
          ))}
          <Jump to="research" label="cd research" />
        </div>
      );
    case "skills":
      return (
        <div>
          {skillGroups.map((g) => (
            <div key={g.label} className="t-row"><span className="c-magenta">{g.label}</span><span>{g.items.join(", ")}</span></div>
          ))}
        </div>
      );
    case "contact":
    case "email":
      return (
        <div>
          <div>email     <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a></div>
          <div>github    <a href={LINKS.github} target="_blank" rel="noreferrer">github.com/rakibulx33</a></div>
          <div>linkedin  <a href={LINKS.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/rakibulx33</a></div>
          <div className="c-green">Taking freelance projects.</div>
        </div>
      );
    case "github":
      return <a href={LINKS.github} target="_blank" rel="noreferrer">github.com/rakibulx33</a>;
    case "linkedin":
      return <a href={LINKS.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/rakibulx33</a>;
    case "cd": {
      const target = ["projects", "research", "skills", "github", "contact"].find((s) => s.startsWith(arg.replace(/^~?\/?/, "").toLowerCase()) && arg);
      if (!target) return <span className="c-red">cd: no such section: {arg || "?"}. Sections: projects, research, skills, github, contact</span>;
      setTimeout(() => scrollTo(target), 150);
      return <span className="c-dim">moving to ~/{target}</span>;
    }
    case "date":
      return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(new Date()) + " (Dhaka)";
    case "clear":
      clear();
      return null;
    case "sudo":
      return <span className="c-red">rakibul is not in the sudoers file. This incident will be reported.</span>;
    case "exit":
      setTimeout(() => scrollTo("projects"), 150);
      return <span className="c-dim">logout. Scrolling to the work instead.</span>;
    default:
      return <span className="c-red">zsh: command not found: {cmd}. Type <span className="c-cyan">help</span>.</span>;
  }
}

const BOOT: { delay: number; node: ReactNode; photo?: boolean }[] = [
  { delay: 120, node: <span className="c-dim">Last login: from rakibulx33.me</span> },
  { delay: 260, node: <><span className="c-green">[  OK  ]</span> Mounted <span className="c-cyan">~/projects</span> ({ALL.length} entries)</> },
  { delay: 160, node: <><span className="c-green">[  OK  ]</span> Started <span className="c-cyan">backend.service</span></> },
  { delay: 160, node: <><span className="c-green">[  OK  ]</span> Started <span className="c-cyan">automation.service</span></> },
  { delay: 160, node: <><span className="c-green">[  OK  ]</span> Reached target <span className="c-cyan">iot-research</span></> },
  { delay: 220, node: <><span className="c-yellow">[ LOAD ]</span> Decoding profile.jpg</>, photo: true },
];

export default function Terminal({ onPhoto }: { onPhoto: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [typing, setTyping] = useState("");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const idRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = useCallback((node: ReactNode) => setLines((l) => [...l, { id: idRef.current++, node }]), []);
  const clear = useCallback(() => setLines([]), []);

  const execute = useCallback((raw: string, echo = true) => {
    if (echo) push(<>{PROMPT} {raw}</>);
    const out = run(raw, clear);
    if (out != null) push(out);
  }, [push, clear]);

  // Boot sequence, then type `whoami`.
  useEffect(() => {
    const reduce = prefersReducedMotion();
    if (reduce) {
      BOOT.forEach((b) => push(b.node));
      onPhoto();
      execute("whoami");
      push(<span className="c-dim">Type a command, or pick one below.</span>);
      setReady(true);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    let t = 0;
    BOOT.forEach((b) => {
      t += b.delay;
      timers.push(window.setTimeout(() => { if (!cancelled) { push(b.node); if (b.photo) onPhoto(); } }, t));
    });
    t += 500;
    const word = "whoami";
    for (let i = 1; i <= word.length; i++) {
      timers.push(window.setTimeout(() => !cancelled && setTyping(word.slice(0, i)), t + i * 85));
    }
    t += word.length * 85 + 350;
    timers.push(window.setTimeout(() => {
      if (cancelled) return;
      setTyping("");
      execute(word);
      push(<span className="c-dim">Type a command, or pick one below.</span>);
      setReady(true);
    }, t));
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [push, execute, onPhoto]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  // Press "/" anywhere to jump into the terminal.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus({ preventScroll: true });
        document.getElementById("top")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const v = input;
      setInput("");
      setHIdx(-1);
      if (v.trim()) setHistory((h) => [v, ...h].slice(0, 30));
      execute(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(history.length - 1, hIdx + 1);
      if (i >= 0) { setHIdx(i); setInput(history[i]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = hIdx - 1;
      setHIdx(Math.max(-1, i));
      setInput(i >= 0 ? history[i] : "");
    } else if (e.key === "Tab") {
      const m = COMMANDS.filter((c) => c.startsWith(input.trim()) && input.trim());
      if (m.length === 1) { e.preventDefault(); setInput(m[0] + " "); }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  };

  return (
    <div className="win term" onClick={() => ready && window.getSelection()?.isCollapsed && inputRef.current?.focus({ preventScroll: true })}>
      <div className="win-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="win-title">rakibul@dhaka: ~</span>
        <span className="win-meta">zsh</span>
      </div>
      <div className="term-body" ref={bodyRef} aria-live="polite">
        {lines.map((l) => <div key={l.id} className="t-line">{l.node}</div>)}
        {!ready && typing && <div className="t-line">{PROMPT} {typing}<span className="caret" /></div>}
        {ready && (
          <label className="t-input">
            {PROMPT}
            <span className="sr-only">Terminal command</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Type a command, for example help"
            />
          </label>
        )}
        {!ready && !typing && <span className="caret" />}
      </div>
      <div className="chips" role="group" aria-label="Quick commands">
        {CHIPS.map((c) => (
          <button key={c} type="button" disabled={!ready} onClick={(e) => { e.stopPropagation(); execute(c); }}>
            {c}
          </button>
        ))}
        <span className="chips-hint">Press <kbd>/</kbd> to type</span>
      </div>
    </div>
  );
}
