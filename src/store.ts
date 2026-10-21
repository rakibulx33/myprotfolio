import { useEffect, useState } from "react";

/* Tiny client-side store: achievements (saved per visitor) and page-wide events.
   Everything touching window/localStorage runs in effects or handlers, so the
   prerendered HTML and the first client render always match. */

export const ACHIEVEMENTS = [
  { id: "booted", title: "Booted the system", hint: "load the page" },
  { id: "whoami", title: "Met the developer", hint: "run whoami" },
  { id: "operator", title: "Terminal operator", hint: "run three different commands" },
  { id: "explorer", title: "Explorer", hint: "open one of my projects" },
  { id: "services", title: "Read the menu", hint: "see what I build" },
  { id: "scholar", title: "Scholar", hint: "read the research" },
  { id: "egg", title: "Found a hidden command", hint: "try ls -a" },
  { id: "client", title: "Started a project", hint: "run hire" },
] as const;
export type AchId = (typeof ACHIEVEMENTS)[number]["id"];
export const TOTAL = ACHIEVEMENTS.length;

const KEY = "rx33.achievements";
let unlocked = new Set<string>();
let loaded = false;
const listeners = new Set<(id: AchId) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) unlocked = new Set(JSON.parse(raw));
  } catch { /* private mode or blocked storage: progress just isn't remembered */ }
}

export function unlock(id: AchId) {
  load();
  if (unlocked.has(id)) return;
  unlocked.add(id);
  try { window.localStorage.setItem(KEY, JSON.stringify([...unlocked])); } catch { /* ignore */ }
  listeners.forEach((l) => l(id));
}

export function isUnlocked(id: AchId) {
  load();
  return unlocked.has(id);
}

export function unlockedCount() {
  load();
  return unlocked.size;
}

export function onUnlock(fn: (id: AchId) => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** Live count of unlocked achievements (0 on the server and first render). */
export function useAchievementCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(unlockedCount());
    return onUnlock(() => setCount(unlockedCount()));
  }, []);
  return count;
}

/* Page-wide events: the terminal, buttons and keyboard shortcuts talk through these. */
type EventName = "hire" | "matrix" | "run" | "toast";
export const emit = (name: EventName, detail?: unknown) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(`rx:${name}`, { detail }));
};
export function useRxEvent<T = unknown>(name: EventName, handler: (detail: T) => void) {
  useEffect(() => {
    const h = (e: Event) => handler((e as CustomEvent<T>).detail);
    window.addEventListener(`rx:${name}`, h);
    return () => window.removeEventListener(`rx:${name}`, h);
  }, [name, handler]);
}

export type Toast = { kind: "achievement" | "tip"; title: string; body?: string; action?: { label: string; event: EventName; detail?: unknown } };
