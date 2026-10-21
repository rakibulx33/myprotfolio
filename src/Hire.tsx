import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { HIRE_RELAY, LINKS } from "./data";
import { prefersReducedMotion } from "./hooks";
import { unlock, useRxEvent } from "./store";

/* `hire`: a 30-second project brief, asked like a CLI, sent to me two ways at once:
   by email through FormSubmit (free, no backend; its first submission emails me an activation link)
   and, when HIRE_RELAY is set, to my Telegram through a small Cloudflare Worker (worker/).
   It counts as delivered as soon as either one lands. If both fail, the visitor can open
   their email app or copy the brief instead. */

type Q = { key: string; label: string; q: string; options?: string[]; input?: "text" | "contact"; placeholder?: string; optional?: boolean };
const QUESTIONS: Q[] = [
  { key: "project", label: "project", q: "What are we building?", options: ["Online store or e-commerce", "Backend, API or SaaS", "Automation or AI chatbot", "IoT prototype", "Something else"] },
  { key: "stage", label: "stage", q: "Where is it right now?", options: ["Just an idea", "Designs or a spec are ready", "An existing product needs work"] },
  { key: "launch", label: "launch", q: "When would you like it live?", options: ["Within a month", "In 1–3 months", "I'm flexible"] },
  { key: "details", label: "details", q: "Describe it in a sentence or two", input: "text", placeholder: "e.g. a store for handmade bags with local payments", optional: true },
  { key: "name", label: "from", q: "What's your name?", input: "text", placeholder: "Your name" },
  { key: "contact", label: "reply_to", q: "Where should I reply?", input: "contact", placeholder: "Email, or WhatsApp number with country code" },
];
const ENDPOINT = `https://formsubmit.co/ajax/${LINKS.email}`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{8,20}$/;
type Phase = "ask" | "review" | "sending" | "sent" | "failed";

const PROMPT = (
  <span className="t-prompt">
    <span className="c-green">visitor</span><span className="c-dim">@</span><span className="c-blue">rakibulx33.me</span><span className="c-dim">:~$</span>
  </span>
);

function Spinner() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setI((n) => (n + 1) % 4), 90); return () => window.clearInterval(id); }, []);
  return <span className="c-cyan" aria-hidden>{"|/-\\"[i]}</span>;
}

/** A short burst of terminal glyphs, used when the brief is delivered. */
function burst(canvas: HTMLCanvasElement | null, from: HTMLElement | null) {
  if (!canvas || prefersReducedMotion()) return;
  const host = canvas.parentElement!.getBoundingClientRect();
  const origin = from?.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = host.width * dpr; canvas.height = host.height * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const ox = ((origin ? origin.left + origin.width / 2 : host.left + host.width / 2) - host.left) * dpr;
  const oy = ((origin ? origin.top : host.top + host.height * 0.7) - host.top) * dpr;
  const glyphs = ["✦", "*", "+", "•", "·", "{", "}", "1", "0"];
  const colors = ["#5ce1e6", "#7ee787", "#f2cc60", "#f778ba", "#7aa2ff", "#dce1f0"];
  const parts = Array.from({ length: 70 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const v = (4 + Math.random() * 7) * dpr;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: glyphs[(Math.random() * glyphs.length) | 0], c: colors[(Math.random() * colors.length) | 0], s: (11 + Math.random() * 9) * dpr };
  });
  const t0 = performance.now();
  const step = (t: number) => {
    const k = (t - t0) / 1300;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (k >= 1) return;
    ctx.globalAlpha = 1 - k;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.28 * dpr; p.vx *= 0.985;
      ctx.fillStyle = p.c; ctx.font = `${p.s}px ui-monospace, monospace`; ctx.fillText(p.g, p.x, p.y);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Hire() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("ask");
  const [hi, setHi] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [why, setWhy] = useState("");
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const honey = useRef<HTMLInputElement>(null);
  const burstCanvas = useRef<HTMLCanvasElement>(null);
  const sendBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    try { window.sessionStorage.setItem("rx33.nudged", "1"); } catch { /* ignore */ }
    setMounted(true);
    setOpen(true);
  }, []);
  useRxEvent("hire", show);

  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.({ preventScroll: true });
  }, []);

  // Keep the page still behind the dialog.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => { root.style.overflow = prev; };
  }, [open]);

  // Focus the current control and keep the newest line in view.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
      if (body.current) body.current.scrollTop = body.current.scrollHeight;
    }, 40);
    return () => window.clearTimeout(id);
  }, [open, step, phase, hi]);

  const q = QUESTIONS[step];

  const answer = (value: string) => {
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setError("");
    setHi(0);
    const next = QUESTIONS[step + 1];
    setText(next?.input ? answers[next.key] ?? "" : "");
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else setPhase("review");
  };

  const submitText = () => {
    const v = text.trim();
    if (!v && q.optional) return answer("");
    if (q.key === "name" && v.length < 2) return setError("Please enter your name.");
    if (q.input === "contact" && !(EMAIL_RE.test(v) || PHONE_RE.test(v))) return setError("Enter an email address, or a phone number with country code.");
    answer(v);
  };

  const back = () => {
    setError("");
    if (phase === "review" || phase === "failed") { setPhase("ask"); setStep(QUESTIONS.length - 1); setText(answers.contact ?? ""); return; }
    if (step > 0) {
      const prev = QUESTIONS[step - 1];
      setStep(step - 1);
      setText(prev.input ? answers[prev.key] ?? "" : "");
      setHi(Math.max(0, prev.options?.indexOf(answers[prev.key]) ?? 0));
    }
  };

  const restart = () => { setAnswers({}); setStep(0); setPhase("ask"); setText(""); setHi(0); setError(""); };

  const rows = useMemo(() => QUESTIONS.map((x) => [x.label, answers[x.key] || (x.optional ? "" : "")] as const), [answers]);
  const briefText = useMemo(
    () => ["# brief.yml (from rakibulx33.me)", ...rows.map(([k, v]) => `${(k + ":").padEnd(10)}${k === "details" ? JSON.stringify(v || "") : v}`)].join("\n"),
    [rows],
  );
  const mailto = `mailto:${LINKS.email}?subject=${encodeURIComponent(`Project brief: ${answers.project ?? "new project"}`)}&body=${encodeURIComponent(briefText)}`;

  const send = async () => {
    if (honey.current?.value) { setPhase("sent"); return; } // bots fill hidden fields; humans don't
    setPhase("sending");
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 15000);
    const fields = {
      name: answers.name,
      reply_to: answers.contact,
      project: answers.project,
      stage: answers.stage,
      launch: answers.launch,
      details: answers.details || "",
      source: "rakibulx33.me terminal (hire)",
    };
    const isEmail = EMAIL_RE.test(answers.contact ?? "");

    // Email through FormSubmit. Its "please activate this form" reply also means it was received.
    const email = fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `New project brief: ${answers.project} (${answers.name})`,
        _template: "table",
        ...(isEmail ? { _replyto: answers.contact } : {}),
        ...fields,
        details: fields.details || "(none)",
      }),
      signal: ctrl.signal,
    }).then(async (res) => {
      const data: { success?: string | boolean; message?: string } = await res.json().catch(() => ({}));
      const ok = res.ok && (data.success === true || data.success === "true" || /activat/i.test(String(data.message ?? "")));
      if (!ok) throw new Error(String(data.message || `HTTP ${res.status}`));
    });
    const jobs = [email];

    // Telegram through the relay Worker. A text/plain body keeps it a simple request, with no CORS preflight.
    if (HIRE_RELAY) {
      jobs.push(fetch(HIRE_RELAY, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(fields), signal: ctrl.signal })
        .then(async (res) => {
          const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
          if (!(res.ok && data.ok)) throw new Error(data.error || `HTTP ${res.status}`);
        }));
    }
    Promise.allSettled(jobs).finally(() => window.clearTimeout(timer));

    try {
      await Promise.any(jobs); // delivered as soon as either channel has it
      setPhase("sent");
      unlock("client");
      requestAnimationFrame(() => burst(burstCanvas.current, sendBtn.current ?? dialog.current));
    } catch (err) {
      const reasons = err instanceof AggregateError ? err.errors : [err];
      setWhy(reasons.some((e) => (e as Error)?.name === "AbortError") ? "the request timed out" : "the form service didn't accept it");
      setPhase("failed");
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(briefText); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") { // keep focus inside the dialog
      const f = [...(dialog.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([tabindex='-1']), a[href]") ?? [])].filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      return;
    }
    if (phase === "ask" && q.options) {
      const n = q.options.length;
      if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % n); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h - 1 + n) % n); }
      else if (/^[1-9]$/.test(e.key) && Number(e.key) <= n) { e.preventDefault(); answer(q.options[Number(e.key) - 1]); }
    }
    if (phase === "review" && e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON" && (e.target as HTMLElement).tagName !== "A") { e.preventDefault(); send(); }
  };

  if (!mounted) return null;
  return (
    <div className={`hire-backdrop${open ? " open" : ""}`} hidden={!open} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="win hire" role="dialog" aria-modal="true" aria-labelledby="hire-title" ref={dialog} onKeyDown={onKeyDown}>
        <div className="win-bar">
          <span className="dots" aria-hidden><i /><i /><i /></span>
          <span className="win-title" id="hire-title">~/hire: new project brief</span>
          <button type="button" className="win-close" onClick={close} aria-label="Close the project brief">esc</button>
        </div>

        <div className="hire-body" ref={body}>
          <div className="t-line">{PROMPT} hire rakibul</div>
          <div className="t-line c-dim">Let's scope your project. It takes about 30 seconds.</div>

          {QUESTIONS.slice(0, phase === "ask" ? step : QUESTIONS.length).map((x) => (
            <div key={x.key} className="t-line hire-done">
              <span className="c-green">✓</span> {x.q} <span className="c-cyan">{answers[x.key] || "(skipped)"}</span>
            </div>
          ))}

          {phase === "ask" && (
            <div className="hire-q" key={q.key}>
              <div className="t-line"><span className="c-yellow">?</span> <strong>{q.q}</strong>{q.optional && <span className="c-dim"> (optional, enter to skip)</span>}</div>
              {q.options ? (
                <div className="hire-opts" role="group" aria-label={q.q}>
                  {q.options.map((o, i) => (
                    <button key={o} type="button" className={i === hi ? "on" : ""} data-autofocus={i === hi ? "" : undefined}
                      onMouseEnter={() => setHi(i)} onFocus={() => setHi(i)} onClick={() => answer(o)}>
                      <span className="hire-key">{i + 1}</span><span className="hire-arrow" aria-hidden>{i === hi ? "›" : " "}</span>{o}
                    </button>
                  ))}
                </div>
              ) : (
                <form className="hire-input" onSubmit={(e) => { e.preventDefault(); submitText(); }}>
                  <span className="c-cyan" aria-hidden>›</span>
                  <input data-autofocus="" value={text} onChange={(e) => { setText(e.target.value); setError(""); }}
                    placeholder={q.placeholder} maxLength={q.key === "details" ? 400 : 120} aria-label={q.q} aria-invalid={error ? true : undefined}
                    type={q.input === "contact" ? "text" : "text"} inputMode={q.input === "contact" ? "email" : undefined}
                    autoComplete={q.key === "name" ? "name" : q.input === "contact" ? "email" : "off"} spellCheck={q.key === "details"} />
                  <button type="submit" className="hire-enter">enter</button>
                </form>
              )}
              {error && <div className="t-line c-red" role="alert">{error}</div>}
            </div>
          )}

          {phase !== "ask" && (
            <pre className="hire-brief" aria-label="Your project brief">
              <span className="c-dim"># brief.yml</span>{"\n"}
              {rows.map(([k, v]) => (
                <span key={k}><span className="c-cyan">{(k + ":").padEnd(10)}</span>{k === "details" ? <span className="c-green">{JSON.stringify(v || "")}</span> : v}{"\n"}</span>
              ))}
            </pre>
          )}

          {phase === "review" && (
            <div className="hire-actions">
              <button type="button" ref={sendBtn} className="hire-primary" data-autofocus="" onClick={send}>send to rakibul <span aria-hidden>↵</span></button>
              <button type="button" onClick={back}>[edit]</button>
              <a href={mailto} onClick={() => unlock("client")}>[email instead]</a>
            </div>
          )}

          {phase === "sending" && <div className="t-line"><Spinner /> <span className="c-dim">sending brief.yml to rakibul…</span></div>}

          {phase === "sent" && (
            <div className="hire-result" role="status">
              <div className="t-line c-green">✓ Delivered. I've got your brief.</div>
              <div className="t-line">I'll reply to <span className="c-cyan">{answers.contact}</span>. Feel free to keep exploring meanwhile.</div>
              <div className="hire-actions">
                <button type="button" className="hire-primary" data-autofocus="" onClick={close}>close</button>
                <button type="button" onClick={restart}>[new brief]</button>
              </div>
            </div>
          )}

          {phase === "failed" && (
            <div className="hire-result" role="alert">
              <div className="t-line c-red">✗ Couldn't send it from here ({why}).</div>
              <div className="t-line">Your brief is safe. Send it another way:</div>
              <div className="hire-actions">
                <a className="hire-primary" data-autofocus="" href={mailto} onClick={() => unlock("client")}>open email app</a>
                <button type="button" onClick={copy}>{copied ? "[copied]" : "[copy brief]"}</button>
                <button type="button" onClick={send}>[try again]</button>
              </div>
            </div>
          )}

          <input ref={honey} className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="_honey" />
        </div>

        <div className="hire-foot">
          <span className="c-dim">
            {phase === "ask" ? (q.options ? `↑↓ to choose, 1–${q.options.length} to pick, enter to select` : "enter to continue") : phase === "review" ? "enter to send" : ""}
          </span>
          {((phase === "ask" && step > 0) || phase === "review" || phase === "failed") && (
            <button type="button" className="hire-back" onClick={back}>[back]</button>
          )}
        </div>
        <canvas ref={burstCanvas} className="hire-burst" aria-hidden />
      </div>
    </div>
  );
}
