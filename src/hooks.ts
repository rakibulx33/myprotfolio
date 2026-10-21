import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True once the element has scrolled into view (fires once). */
export function useInView<T extends Element>(margin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (prefersReducedMotion()) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** Types `text` out once `start` is true. */
export function useTyped(text: string, start: boolean, speed = 38) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) { setOut(text); return; }
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, start, speed]);
  return out;
}

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFX";

/** Decrypts `text` from random glyphs, left to right, once `start` is true. */
export function useScramble(text: string, start: boolean, duration = 900) {
  const [out, setOut] = useState(() => text.replace(/\S/g, " "));
  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) { setOut(text); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const fixed = Math.floor(p * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < fixed || ch === " ") s += ch;
        else if (i < fixed + 6) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else s += " ";
      }
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, start, duration]);
  return out;
}

/** Live clock for a given IANA zone, e.g. "Asia/Dhaka". */
export function useClock(timeZone: string) {
  const fmt = () => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date());
  const [now, setNow] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmt()), 15_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return now;
}
