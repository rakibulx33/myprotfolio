import { useCallback, useEffect, useState } from "react";
import { prefersReducedMotion } from "./hooks";

/* Light is "gallery lights on"; dark is "load-shedding", with the lights out. index.html sets data-theme before first paint
   (saved choice, else the system setting), so this module only reads and changes it. */

export type Theme = "light" | "dark";
const KEY = "rx33.theme";
const listeners = new Set<(t: Theme) => void>();

export const currentTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light";

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => { m.content = t === "dark" ? "#1a1917" : "#fafaf7"; m.removeAttribute("media"); });
  listeners.forEach((l) => l(t));
}

/** Switch themes. Going dark plays a short power-cut flicker first (skipped with reduced motion). */
export function setTheme(t: Theme) {
  try { window.localStorage.setItem(KEY, t); } catch { /* not remembered */ }
  window.dispatchEvent(new CustomEvent("rx:power", { detail: t }));
  const root = document.documentElement;
  if (prefersReducedMotion() || root.dataset.power) { apply(t); return; }
  root.dataset.power = t === "dark" ? "cut" : "restore";
  window.setTimeout(() => apply(t), t === "dark" ? 230 : 120);
  window.setTimeout(() => { delete root.dataset.power; }, 760);
}

/** The current theme. "light" on the server and the first client render, then the real value. */
export function useTheme() {
  const [theme, set] = useState<Theme>("light");
  useEffect(() => {
    set(currentTheme());
    listeners.add(set);
    // Follow the system setting until the visitor picks one.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(KEY); } catch { /* ignore */ }
      if (!saved) apply(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onSystem);
    return () => { listeners.delete(set); mq.removeEventListener("change", onSystem); };
  }, []);
  const toggle = useCallback(() => setTheme(currentTheme() === "dark" ? "light" : "dark"), []);
  return [theme, toggle] as const;
}
