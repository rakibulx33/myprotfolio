import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./hooks";
import { ACHIEVEMENTS, TOTAL, emit, isUnlocked, onUnlock, unlock, unlockedCount, useRxEvent, type Toast } from "./store";

/* ------------------------------------------------------------------ toasts */
/** Achievement and tip notifications, bottom-left, announced politely to screen readers. */
export function Toaster() {
  const [items, setItems] = useState<(Toast & { id: number })[]>([]);
  const idRef = useRef(0);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((x) => x.id !== id)), []);
  // At most one toast of each kind: a new achievement replaces the previous one instead of stacking over the page.
  const push = useCallback((t: Toast) => {
    const id = ++idRef.current;
    setItems((list) => [...list.filter((x) => x.kind !== t.kind), { ...t, id }]);
    window.setTimeout(() => dismiss(id), t.kind === "tip" ? 10000 : 4800);
  }, [dismiss]);
  useRxEvent<Toast>("toast", push);

  useEffect(() => onUnlock((id) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    const n = unlockedCount();
    const extra = n === TOTAL ? "All unlocked. Thanks for exploring!" : n === TOTAL - 1 && !isUnlocked("client") ? "One left: run hire to start a project." : "Keep exploring to unlock more.";
    push({ kind: "achievement", title: a.title, body: `${n}/${TOTAL}  ${extra}`, action: n === TOTAL - 1 && !isUnlocked("client") ? { label: "[hire]", event: "hire" } : undefined });
  }), [push]);

  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <div className="toast-head">
            {t.kind === "achievement" ? <><span className="c-yellow">★</span> achievement unlocked</> : <><span className="c-cyan">tip</span></>}
          </div>
          <div className="toast-title">{t.title}</div>
          {t.body && <div className="toast-body">{t.body}</div>}
          {t.action && (
            <button type="button" className="toast-act" onClick={() => { emit(t.action!.event, t.action!.detail); dismiss(t.id); }}>{t.action.label}</button>
          )}
          <button type="button" className="toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ floating hire button */
/** Shown whenever neither on-page hire button (the terminal's chip row, the contact CTA) is in view. */
export function HireDock() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const targets = [document.querySelector("#top .chips"), document.querySelector("#contact .cta-row")].filter((x): x is Element => !!x);
    if (!targets.length) return;
    const visible = new Map<Element, boolean>(targets.map((t) => [t, t === targets[0]]));
    // The top margin skips the area under the fixed tmux bar, so a sliver hidden behind it doesn't count as visible.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target, e.isIntersecting));
      setShow(![...visible.values()].some(Boolean));
    }, { rootMargin: "-56px 0px 0px 0px" });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return (
    <button type="button" className={`dock${show ? " show" : ""}`} onClick={() => emit("hire")} tabIndex={show ? 0 : -1} aria-hidden={show ? undefined : true}>
      <span className="dock-dot" aria-hidden />
      <span><span className="c-dim">$</span> hire rakibul</span>
      <span className="caret" aria-hidden />
    </button>
  );
}

/* ------------------------------------------------------------------ matrix easter egg */
const RAIN = "অআইঈউএওকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহড়য়০১২৩৪৫৬৭৮৯01<>/{}[]=+*#$";

/** Digital rain in the site's colours, with Bangla letters mixed in. Any key or click exits. */
export function Matrix() {
  const [on, setOn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const start = useCallback(() => { unlock("egg"); setOn(true); }, []);
  useRxEvent("matrix", start);

  useEffect(() => {
    if (!on) return;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const reduce = prefersReducedMotion();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = 18 * dpr;
    let cols = 0;
    let drops: number[] = [];
    const resize = () => {
      c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
      cols = Math.ceil(c.width / size);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
      ctx.fillStyle = "#0b0e1a"; ctx.fillRect(0, 0, c.width, c.height);
    };
    resize();
    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 50) return;
      last = t;
      ctx.fillStyle = "rgba(11, 14, 26, 0.17)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = `${size * 0.82}px "Martian Mono Variable", ui-monospace, monospace`;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() > 0.96 ? "#dce1f0" : i % 3 === 0 ? "#7ee787" : "#5ce1e6";
        ctx.fillText(RAIN[(Math.random() * RAIN.length) | 0], i * size, y);
        if (y > c.height && Math.random() > 0.97) drops[i] = 0;
        drops[i] += 1;
      }
    };
    if (!reduce) raf = requestAnimationFrame(draw);
    const exit = () => setOn(false);
    const timer = window.setTimeout(exit, 12000);
    const onKey = (e: KeyboardEvent) => { if (e.key !== "Tab") exit(); };
    const arm = window.setTimeout(() => window.addEventListener("keydown", onKey), 250);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); window.clearTimeout(arm);
      window.removeEventListener("keydown", onKey); window.removeEventListener("resize", resize);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div className="matrix" role="dialog" aria-modal="true" aria-label="Easter egg: digital rain" onClick={() => setOn(false)}>
      <canvas ref={canvas} aria-hidden />
      <div className="matrix-msg">
        <p>you found the rain.</p>
        <p>every system has a door.</p>
        <p>mine is <button type="button" onClick={(e) => { e.stopPropagation(); setOn(false); emit("hire"); }}>hire</button></p>
        <p className="c-dim">click anywhere or press any key to exit</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ konami code */
export function useKonami() {
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
      if (i === seq.length) { i = 0; emit("matrix"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

/* ------------------------------------------------------------------ one gentle nudge per visit */
export function useNudge() {
  useEffect(() => {
    let done = false;
    try { done = window.sessionStorage.getItem("rx33.nudged") === "1"; } catch { /* ignore */ }
    if (done) return;
    const fire = () => {
      if (done) return;
      done = true;
      cleanup();
      try { if (window.sessionStorage.getItem("rx33.nudged") === "1") return; window.sessionStorage.setItem("rx33.nudged", "1"); } catch { /* ignore */ }
      if (isUnlocked("client")) return;
      emit("toast", { kind: "tip", title: "Got an idea in mind?", body: "Run hire and I'll turn it into a project brief in about 30 seconds.", action: { label: "[start a brief]", event: "hire" } } satisfies Toast);
    };
    const timer = window.setTimeout(fire, 45000);
    const onScroll = () => {
      const p = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (p > 0.62) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); }
    return cleanup;
  }, []);
}
