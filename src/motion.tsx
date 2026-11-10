import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { prefersReducedMotion, useInView } from "./hooks";

/* Page-wide motion, set up once.
   - Reveals: anything with class "reveal" gets class "in" the first time it scrolls into view. The hidden state
     only applies under html.motion, which this hook adds, so if the script never runs nothing stays hidden.
   - Pointer effects: one listener for the whole page. It tells the card under the pointer where the pointer is
     (--mx / --my in pixels for the spotlight, --px / --py from -0.5 to 0.5 for tilt and magnetic buttons). */
export function useMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const still = prefersReducedMotion();

    const els = [...document.querySelectorAll<HTMLElement>(".reveal")];
    let io: IntersectionObserver | undefined;
    if (still || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
    } else {
      root.classList.add("motion");
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io?.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      els.forEach((el) => io!.observe(el));
    }

    if (still || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => io?.disconnect();

    let current: HTMLElement | null = null;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.<HTMLElement>(".card, .win, .magnet") ?? null;
      if (el !== current) {
        current?.style.removeProperty("--px");
        current?.style.removeProperty("--py");
        current = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(ev.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(ev.clientY - r.top).toFixed(0)}px`);
      el.style.setProperty("--px", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty("--py", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    const onMove = (e: PointerEvent) => { ev = e; if (!raf) raf = requestAnimationFrame(paint); };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { io?.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);
}

/** A heading's text, one word at a time: each word rises from behind its own baseline when the heading is revealed. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, k) => (
        <Fragment key={k}>
          <span className="hw"><span style={{ ["--w" as string]: k } as CSSProperties}>{w}</span></span>{" "}
        </Fragment>
      ))}
    </>
  );
}

/** Counts up to `to` the first time it scrolls into view. Renders the final value until then, so the prerendered page is right. */
export function useCountUp(to: number, ms = 1400) {
  const [ref, seen] = useInView<HTMLElement>("0px 0px -8% 0px");
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!seen || prefersReducedMotion()) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, ms]);
  return [ref, v] as const;
}

/* ---------------------------------------------------------------- smooth scrolling */

type LenisLike = { scrollTo: (target: HTMLElement | number, opts?: { offset?: number }) => void; stop: () => void; start: () => void; destroy: () => void };
let lenis: LenisLike | null = null;

/** Scroll to a section. Goes through the smooth scroller when it is running, so the two never fight. */
export function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

/** Weighted, eased scrolling (Lenis) for mouse and trackpad. Touch screens and reduced motion keep native scrolling.
    Dialogs lock the page by setting overflow: hidden on <html>; the scroller pauses while that is set, and
    data-lenis-prevent on a dialog leaves the wheel to the dialog itself. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let gone = false;
    let mo: MutationObserver | undefined;
    import("lenis").then(({ default: Lenis }) => {
      if (gone) return;
      // allowNestedScroll: the wheel scrolls the terminal while it has output to scroll, and the page otherwise.
      const l = new Lenis({ autoRaf: true, lerp: 0.11, anchors: true, allowNestedScroll: true });
      lenis = l;
      const root = document.documentElement;
      const sync = () => (root.style.overflow === "hidden" ? l.stop() : l.start());
      mo = new MutationObserver(sync);
      mo.observe(root, { attributes: true, attributeFilter: ["style"] });
      sync();
    });
    return () => { gone = true; mo?.disconnect(); lenis?.destroy(); lenis = null; };
  }, []);
}

/* ---------------------------------------------------------------- motion tied to the scroll position */

/** Two kinds of element follow the scroll:
    - [data-drift="0.2"] slides sideways as it passes through the screen (the outlined words behind sections);
    - [data-progress] gets --p, from 0 as it enters to 1 once it has been read (the line through the process steps). */
export function useScrollFx() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const drift = [...document.querySelectorAll<HTMLElement>("[data-drift]")];
    const prog = [...document.querySelectorAll<HTMLElement>("[data-progress]")];
    let raf = 0;
    const paint = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of drift) {
        const box = el.parentElement!.getBoundingClientRect();
        if (box.bottom < -100 || box.top > vh + 100) continue;
        el.style.transform = `translate3d(${((box.top - vh * 0.5) * Number(el.dataset.drift)).toFixed(1)}px,0,0)`;
      }
      for (const el of prog) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        el.style.setProperty("--p", Math.max(0, Math.min(1, (vh * 0.86 - r.top) / (vh * 0.5))).toFixed(3));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
}

/* ---------------------------------------------------------------- the ring that trails the pointer */

/** A soft ring that follows the mouse a little late and opens up over anything clickable. The real cursor stays. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, started = false;
    const step = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX; ty = e.clientY;
      if (!started) { started = true; x = tx; y = ty; el.classList.add("on"); }
      el.classList.toggle("over", !!(e.target as Element | null)?.closest?.("a, button, [role='button'], .chips, summary"));
      el.classList.toggle("text", !!(e.target as Element | null)?.closest?.("input, textarea"));
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => { el.classList.remove("on"); started = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); document.documentElement.removeEventListener("pointerleave", onLeave); };
  }, []);
  return <div className="cursor" ref={ref} aria-hidden />;
}
