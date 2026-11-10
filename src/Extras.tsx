import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
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
    if (!a || id === "booted") return; // the first one is earned quietly, so nothing covers the page on arrival
    const n = unlockedCount();
    const extra = n === TOTAL ? "All unlocked. Thanks for exploring." : n === TOTAL - 1 && !isUnlocked("client") ? "One left: start a project brief." : "Type help in the terminal to find more.";
    push({ kind: "achievement", title: a.title, body: `${n} of ${TOTAL}. ${extra}`, action: n === TOTAL - 1 && !isUnlocked("client") ? { label: "Start a brief", event: "hire" } : undefined });
  }), [push]);

  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <div className="toast-head">{t.kind === "achievement" ? "Achievement unlocked" : "Tip"}</div>
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
    const targets = [document.querySelector("#top .hero-cta"), document.querySelector("#contact .cta"), document.querySelector("#process .steps-cta")].filter((x): x is Element => !!x);
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
      <span className="live-dot" aria-hidden />
      <span>Start a project brief</span>
    </button>
  );
}

/* ------------------------------------------------------------------ résumé builder */
/** Opens the résumé builder on the `resume` event. The builder is its own chunk, fetched the first time it is wanted. */
export function ResumeLauncher() {
  const [Builder, setBuilder] = useState<ComponentType<{ onClose: () => void }> | null>(null);
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const show = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    import("./Resume")
      .then((m) => setBuilder(() => m.default))
      .catch(() => {
        setOpen(false);
        emit("toast", { kind: "tip", title: "Couldn't load the resume builder", body: "Check your connection and run resume again." } satisfies Toast);
      });
  }, []);
  useRxEvent("resume", show);
  const close = useCallback(() => {
    setOpen(false);
    opener.current?.focus?.({ preventScroll: true });
  }, []);
  return open && Builder ? <Builder onClose={close} /> : null;
}

/* ------------------------------------------------------------------ matrix easter egg */
const PHASES = ["#ff9a3c", "#ff6b3d", "#f0436a", "#ffd08a"];
const RAIN = "অআইঈউএওকখগঘচছজঝটঠডঢণতথদধনপফবভমযরলশষসহড়য়০১২৩৪৫৬৭৮৯01<>/{}[]=+*#$";

/** Digital rain in the ember colours, with Bangla letters mixed in. Any key or click exits. */
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
      ctx.fillStyle = "#0a0606"; ctx.fillRect(0, 0, c.width, c.height);
    };
    resize();
    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 50) return;
      last = t;
      ctx.fillStyle = "rgba(10, 6, 6, 0.17)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = `600 ${size * 0.82}px "JetBrains Mono Variable", ui-monospace, monospace`;
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() > 0.96 ? "#f9f4ee" : PHASES[i % 4];
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
        <p>You found the rain.</p>
        <p>Every system has a door.</p>
        <p>Mine is a <button type="button" onClick={(e) => { e.stopPropagation(); setOn(false); emit("hire"); }}>project brief</button>.</p>
        <p className="matrix-dim">Click anywhere or press any key to exit.</p>
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
      emit("toast", { kind: "tip", title: "Got an idea in mind?", body: "Answer six quick questions and I’ll have a project brief in about 30 seconds.", action: { label: "Start a brief", event: "hire" } } satisfies Toast);
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
