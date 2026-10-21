import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { featuredProjects, moreProjects, research, services, skillGroups, LINKS, PORTRAIT, SOCIALS, HANDLE } from "./data";
import { prefersReducedMotion } from "./hooks";
import { ACHIEVEMENTS, TOTAL, emit, isUnlocked, unlock, unlockedCount, useRxEvent } from "./store";

type Line = { id: number; node: ReactNode };

const PROMPT = (
  <span className="t-prompt">
    <span className="c-green">rakibul</span><span className="c-dim">@</span><span className="c-blue">dhaka</span>
    <span className="c-dim">:</span><span className="c-cyan">~</span><span className="c-dim">$</span>
  </span>
);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ALL = [...featuredProjects, ...moreProjects];
const SECTIONS = ["services", "process", "projects", "research", "skills", "github", "contact"];
const COMMANDS = ["help", "hire", "whoami", "neofetch", "photo", "services", "projects", "ls", "open", "research", "skills", "socials", "contact", "achievements", "github", "linkedin", "email", "cd", "date", "clear", "exit"];
const CHIPS = ["hire", "help", "whoami", "services", "projects", "socials", "contact"];
const used = new Set<string>(); // distinct commands this visit, for the "operator" achievement

/* Boot timeline (ms after first paint). The transcript is static markup, so it is in the
   prerendered HTML for crawlers; CSS reveals each line at its delay. */
const T = { login: 80, mount: 200, backend: 310, automation: 420, iot: 530, decode: 650, prompt: 800, type: 840, who: 1260, hint: 1360, input: 1440 };
const at = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as CSSProperties;
export const PHOTO_AT = T.decode;

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });

function Jump({ to }: { to: string }) {
  return (
    <button type="button" className="t-jump" onClick={() => scrollTo(to)}>
      cd {to}
    </button>
  );
}

const PALETTE = ["#0b0e1a", "#ff7b72", "#7ee787", "#f2cc60", "#7aa2ff", "#f778ba", "#5ce1e6", "#dce1f0"];

function Neofetch() {
  const [g, setG] = useState(0); // remount the image on hover to replay the glitch
  const info: [string, string][] = [
    ["Name", "Rakibul Hasan"],
    ["Role", "Backend & automation developer"],
    ["Location", "Dhaka, Bangladesh"],
    ["Uptime", "freelancing since 2022"],
    ["Study", "CSE, Daffodil International University"],
    ["Stack", "Laravel, Node.js, FastAPI, Next.js"],
    ["Research", "IoT, 4 papers in preparation"],
    ["Status", "open to freelance projects"],
  ];
  return (
    <div className="nf">
      <div className="nf-photo gl glitch-in" key={g} style={{ ["--img" as string]: `url(${PORTRAIT})` }} onMouseEnter={() => setG((n) => n + 1)}>
        <img src={PORTRAIT} alt="Rakibul Hasan" width={720} height={960} />
        <span className="nf-scan" aria-hidden />
      </div>
      <div className="nf-info">
        <div><span className="c-green t-strong">rakibul</span><span className="c-dim">@</span><span className="c-blue t-strong">dhaka</span></div>
        <div className="c-dim" aria-hidden>-------------</div>
        {info.map(([k, v]) => (
          <div key={k}><span className="c-cyan">{k}</span><span className="c-dim">: </span>{v}</div>
        ))}
        <div className="nf-colors" aria-hidden>{PALETTE.map((c) => <span key={c} style={{ background: c }} />)}</div>
      </div>
    </div>
  );
}

function Hack() {
  const steps = [
    ["c-dim", "connecting to rakibulx33.me:22 ..."],
    ["c-dim", "bypassing firewall ...  [##########] 100%"],
    ["c-dim", "decrypting /home/rakibul/.ssh ..."],
    ["c-green", "ACCESS GRANTED"],
    ["", "...just kidding. The only thing worth hacking here is your backlog."],
  ];
  const [n, setN] = useState(() => (prefersReducedMotion() ? steps.length : 1));
  useEffect(() => {
    if (n >= steps.length) return;
    const id = window.setTimeout(() => setN(n + 1), 420);
    return () => window.clearTimeout(id);
  }, [n, steps.length]);
  return (
    <div>
      {steps.slice(0, n).map(([c, t], i) => <div key={i} className={c}>{t}</div>)}
      {n >= steps.length && <div>Run <button type="button" className="t-jump" onClick={() => emit("hire")}>hire</button> and I'll take care of it.</div>}
    </div>
  );
}

function SocialList() {
  let group = "";
  return (
    <div>
      {SOCIALS.map((x, i) => {
        const head = x.group !== group ? (group = x.group) : null;
        return (
          <div key={x.name}>
            {head && <div className="c-dim t-group"># {head.toLowerCase()}</div>}
            <div className="t-row t-row-soc">
              <span><span className="c-dim">{String(i + 1).padStart(2, "0")}</span> <span className="c-cyan">{x.name}</span></span>
              <a href={x.url} target="_blank" rel="noreferrer me">{x.url.replace(/^https:\/\/(www\.)?/, "")}</a>
            </div>
          </div>
        );
      })}
      <div className="c-dim">{SOCIALS.length} profiles, all @{HANDLE}, ranked by how useful they are for working together.</div>
    </div>
  );
}

function AchievementList() {
  return (
    <div>
      {ACHIEVEMENTS.map((a) => {
        const ok = isUnlocked(a.id);
        return (
          <div key={a.id}>
            <span className={ok ? "c-green" : "c-dim"}>{ok ? "✓" : "·"}</span> <span className={ok ? "" : "c-dim"}>{a.title}</span>
            {!ok && <span className="c-dim">  ({a.hint})</span>}
          </div>
        );
      })}
      <div className="c-yellow">{unlockedCount()}/{TOTAL} unlocked</div>
    </div>
  );
}

const MUG = `   ( (
    ) )
  ........
  |      |]
  \\      /
   \`----'`;

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
            ["hire", "start a project brief (30 seconds)"],
            ["whoami", "who I am, with photo (also: neofetch)"],
            ["services", "what I can build for you"],
            ["projects", "selected work (also: ls)"],
            ["open <name>", "links for a project"],
            ["research", "papers in preparation"],
            ["skills", "tools I use"],
            ["socials", "every profile, ranked"],
            ["contact", "how to reach me"],
            ["achievements", "what you've unlocked"],
            ["cd <section>", "scroll to a section"],
            ["clear", "clear the screen"],
          ].map(([c, d]) => (
            <div key={c} className="t-row"><span className="c-cyan">{c}</span><span className="c-dim">{d}</span></div>
          ))}
          <div className="c-yellow">psst: a few commands are hidden. Start with <span className="c-cyan">ls -a</span>.</div>
        </div>
      );
    case "hire":
      setTimeout(() => emit("hire"), 120);
      return <span className="c-dim">opening ~/hire ...</span>;
    case "socials":
    case "social":
      return <SocialList />;
    case "achievements":
      return <AchievementList />;
    case "matrix":
      setTimeout(() => emit("matrix"), 150);
      return <span className="c-green">entering the rain ...</span>;
    case "hack":
      unlock("egg");
      return <Hack />;
    case "coffee":
    case "tea":
    case "cha":
      unlock("egg");
      return <div><pre className="t-pre c-yellow">{MUG}</pre><div>Brewing cha ... done. Fuelled up. Now, what are we building? Try <span className="c-cyan">hire</span>.</div></div>;
    case "rm":
      unlock("egg");
      return <span className="c-red">rm: permission denied. This terminal is read-only for visitors, but my inbox isn't. Try <span className="c-cyan">hire</span>.</span>;
    case "whoami":
    case "neofetch":
    case "fetch":
    case "photo":
      unlock("whoami");
      return (
        <div>
          <div className="c-dim"><span className="c-yellow">[ IMG ]</span> rendering profile.jpg</div>
          <Neofetch />
        </div>
      );
    case "cat":
    case "display":
      if (/^\.?secret/i.test(arg)) {
        unlock("egg");
        return <div><div className="c-green">You found the secret file.</div><div>Not many visitors get this far. If you send me a brief, mention "the secret file" so I know you explored.</div></div>;
      }
      if (/services/i.test(arg)) return run("services", clear);
      if (/skills/i.test(arg)) return run("skills", clear);
      if (/research/i.test(arg)) return run("research", clear);
      if (/process/i.test(arg)) { setTimeout(() => scrollTo("process"), 150); return <span className="c-dim">opening ~/process ...</span>; }
      return /profile|photo|\.jpg|\.png|\.webp/i.test(arg)
        ? <Neofetch />
        : <span className="c-red">{cmd}: {arg || "?"}: try <span className="c-cyan">{cmd} profile.jpg</span></span>;
    case "services":
      return (
        <div>
          {services.map((s) => (
            <div key={s.title} className="t-row"><span className="c-cyan">{s.title}</span><span className="c-dim">{s.text}</span></div>
          ))}
          <Jump to="services" />
        </div>
      );
    case "ls":
      if (/-\w*a/.test(arg)) {
        return (
          <div>
            <div><span className="c-blue">./</span>  <span className="c-blue">../</span>  <span className="c-yellow">.secret</span>  <span className="c-blue">projects/</span>  <span className="c-blue">research/</span>  services.txt  process.md  skills.json  profile.jpg</div>
            <div className="c-dim">hidden: matrix, hack, coffee, sudo hire rakibul ... and one more for keyboard veterans.</div>
          </div>
        );
      }
      return run("projects", clear);
    case "projects":
      return (
        <div>
          {featuredProjects.map((p) => (
            <div key={p.name} className="t-row">
              <span className="c-cyan t-strong">{slug(p.name)}/</span>
              <span>{p.kind}{p.private && <span className="c-yellow"> (private)</span>}</span>
            </div>
          ))}
          <div className="c-dim">+ {moreProjects.length} more. Try <span className="c-cyan">open tradingspark</span> or <Jump to="projects" /></div>
        </div>
      );
    case "open": {
      if (/profile|photo|\.jpg/i.test(arg)) return <Neofetch />;
      const p = arg ? ALL.find((x) => slug(x.name).startsWith(slug(arg))) : undefined;
      if (!p) return <span className="c-red">open: no project matching "{arg || "?"}". Try <span className="c-cyan">projects</span>.</span>;
      if (!p.code && !p.live) return <span><span className="c-cyan t-strong">{p.name}</span>: private repository. Ask me for a walkthrough: run <span className="c-cyan">hire</span>.</span>;
      unlock("explorer");
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
          <Jump to="research" />
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
          <div>brief     run <button type="button" className="t-jump" onClick={() => emit("hire")}>hire</button> <span className="c-dim">(fastest)</span></div>
          <div>email     <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a></div>
          <div>telegram  <a href="https://t.me/rakibulx33" target="_blank" rel="noreferrer">t.me/rakibulx33</a></div>
          <div>linkedin  <a href={LINKS.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/rakibulx33</a></div>
          <div>fiverr    <a href="https://www.fiverr.com/rakibulx33" target="_blank" rel="noreferrer">fiverr.com/rakibulx33</a></div>
          <div className="c-dim">+ {SOCIALS.length - 4} more: run <span className="c-cyan">socials</span></div>
          <div className="c-green">Taking freelance projects.</div>
        </div>
      );
    case "github":
      return <a href={LINKS.github} target="_blank" rel="noreferrer">github.com/rakibulx33</a>;
    case "linkedin":
      return <a href={LINKS.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/rakibulx33</a>;
    case "cd": {
      const want = arg.replace(/^~?\/?/, "").toLowerCase();
      const target = want ? SECTIONS.find((s) => s.startsWith(want)) : undefined;
      if (!target) return <span className="c-red">cd: no such section: {arg || "?"}. Sections: {SECTIONS.join(", ")}</span>;
      setTimeout(() => scrollTo(target), 150);
      return <span className="c-dim">moving to ~/{target}</span>;
    }
    case "date":
      return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "full", timeStyle: "short" }).format(new Date()) + " (Dhaka)";
    case "clear":
      clear();
      return null;
    case "sudo":
      unlock("egg");
      if (/^hire/i.test(arg)) {
        setTimeout(() => emit("hire"), 700);
        return <div><div className="c-dim">[sudo] password for visitor: ********</div><div className="c-green">access granted. opening ~/hire ...</div></div>;
      }
      return <span className="c-red">visitor is not in the sudoers file. This incident will be reported. (Try <span className="c-cyan">sudo hire rakibul</span>.)</span>;
    case "exit":
      setTimeout(() => scrollTo("services"), 150);
      return <span className="c-dim">logout. Scrolling to the work instead.</span>;
    default:
      return <span className="c-red">zsh: command not found: {cmd}. Type <span className="c-cyan">help</span>.</span>;
  }
}

export default function Terminal({ onPhoto, onCommand }: { onPhoto: () => void; onCommand?: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [cleared, setCleared] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const idRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = useCallback((node: ReactNode) => setLines((l) => [...l, { id: idRef.current++, node }]), []);
  const clear = useCallback(() => { setLines([]); setCleared(true); }, []);

  const execute = useCallback((raw: string) => {
    push(<>{PROMPT} {raw}</>);
    const out = run(raw, clear);
    if (out != null) push(out);
    const word = raw.trim().split(/\s+/)[0]?.toLowerCase();
    if (word) { used.add(word); if (used.size >= 3) unlock("operator"); }
    onCommand?.();
  }, [push, clear, onCommand]);

  // Other parts of the page can run a command here (e.g. the achievements counter).
  useRxEvent<string>("run", useCallback((cmd: string) => {
    document.getElementById("top")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    execute(cmd);
  }, [execute]));

  // First achievement once the boot transcript has played.
  useEffect(() => {
    const id = window.setTimeout(() => unlock("booted"), prefersReducedMotion() ? 300 : 2200);
    return () => window.clearTimeout(id);
  }, []);

  // The "[ LOAD ] Decoding profile.jpg" line starts the portrait decode.
  useEffect(() => {
    const id = window.setTimeout(onPhoto, prefersReducedMotion() ? 0 : PHOTO_AT);
    return () => window.clearTimeout(id);
  }, [onPhoto]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el && lines.length) el.scrollTop = el.scrollHeight;
  }, [lines]);

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
      const m = COMMANDS.filter((c) => input.trim() && c.startsWith(input.trim()));
      if (m.length === 1) { e.preventDefault(); setInput(m[0] + " "); }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  };

  return (
    <div className="win term" onClick={() => window.getSelection()?.isCollapsed && inputRef.current?.focus({ preventScroll: true })}>
      <div className="win-bar">
        <span className="dots" aria-hidden><i /><i /><i /></span>
        <span className="win-title">rakibul@dhaka: ~</span>
        <span className="win-meta win-hint">press <kbd>/</kbd> to type</span>
      </div>
      <div className="term-body" ref={bodyRef}>
        {!cleared && (
          <div className="boot">
            <div className="t-line boot-line c-dim" style={at(T.login)}>Last login: from rakibulx33.me</div>
            <div className="t-line boot-line" style={at(T.mount)}><span className="c-green">[  OK  ]</span> Mounted <span className="c-cyan">~/projects</span> ({ALL.length} entries)</div>
            <div className="t-line boot-line" style={at(T.backend)}><span className="c-green">[  OK  ]</span> Started <span className="c-cyan">backend.service</span></div>
            <div className="t-line boot-line" style={at(T.automation)}><span className="c-green">[  OK  ]</span> Started <span className="c-cyan">automation.service</span></div>
            <div className="t-line boot-line" style={at(T.iot)}><span className="c-green">[  OK  ]</span> Reached target <span className="c-cyan">iot-research</span></div>
            <div className="t-line boot-line" style={at(T.decode)}><span className="c-yellow">[ LOAD ]</span> Decoding profile.jpg</div>
            <div className="t-line boot-line" style={at(T.prompt)}>{PROMPT} <span className="typed-cmd" style={at(T.type)}>whoami</span></div>
            <div className="boot-line whoami" style={at(T.who)}>
              <h1 className="t-h1">
                <span className="t-name">Rakibul Hasan</span>
                <span className="sr-only"> – </span>
                <span className="t-role">Backend and automation developer in Dhaka, Bangladesh</span>
              </h1>
              <p className="t-sub c-dim">CSE student at Daffodil International University. Freelancing since 2022.</p>
            </div>
            <div className="t-line boot-line c-dim" style={at(T.hint)}>Type a command, or pick one below.</div>
            <div className="t-line boot-line" style={at(T.hint + 60)}><span className="c-yellow">tip:</span> run <span className="c-cyan">hire</span> to start a project in 30 seconds. Some commands are hidden.</div>
          </div>
        )}
        <div className="t-out" aria-live="polite">
          {lines.map((l) => <div key={l.id} className="t-line">{l.node}</div>)}
        </div>
        <label className="t-input boot-line" style={at(T.input)}>
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
      </div>
      <div className="chips" role="group" aria-label="Quick commands">
        {CHIPS.map((c) => (
          <button key={c} type="button" className={c === "hire" ? "chip-hire" : undefined} onClick={(e) => { e.stopPropagation(); execute(c); }}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
