import { useEffect, useRef, useState } from "react";

// Every hook here renders the same thing on the server and on the client's first
// pass (the page is prerendered and then hydrated); motion only starts in effects.

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True once the element has scrolled into view (fires once). */
export function useInView<T extends Element>(margin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen] as const;
}

/** Live clock for an IANA zone. Starts as a placeholder so the prerendered HTML matches. */
export function useClock(timeZone: string) {
  const [now, setNow] = useState("--:--");
  useEffect(() => {
    const fmt = () => new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date());
    setNow(fmt());
    const id = window.setInterval(() => setNow(fmt()), 15_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return now;
}
