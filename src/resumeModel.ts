import { PROFILE, featuredProjects, moreProjects, skillGroups, type Project } from "./data";

/* The content model behind the résumé builder: what the options are, what each document type
   includes by default, and how a "focus" (backend, IoT, ...) reorders projects and skills.
   Nothing here touches the DOM, so it is easy to test and safe to import anywhere. */

export type DocType = "resume" | "cv" | "portfolio";
export type Template = "clean" | "split" | "terminal";
export type Focus = "all" | "backend" | "fullstack" | "ai" | "iot";
export type SectionKey = "summary" | "experience" | "companies" | "projects" | "research" | "skills" | "education";

export const DOC_TYPES: { id: DocType; label: string; blurb: string; file: string }[] = [
  { id: "resume", label: "Resume", blurb: "One page: summary, skills, experience and your strongest projects.", file: "Resume" },
  { id: "cv", label: "CV", blurb: "The full record: every project, research, companies and education.", file: "CV" },
  { id: "portfolio", label: "Portfolio", blurb: "A cover page and a card for each project, for sending to clients.", file: "Portfolio" },
];

export const TEMPLATES: { id: Template; label: string }[] = [
  { id: "clean", label: "Clean" },
  { id: "split", label: "Split" },
  { id: "terminal", label: "Terminal" },
];

/** The split layout keeps its sidebar on page one only, so it is offered for the one-page resume. */
export const canSplit = (type: DocType) => type === "resume";

export const ACCENTS = [
  { id: "#0f7b6c", label: "Teal" },
  { id: "#2b5fd9", label: "Blue" },
  { id: "#7a3fd1", label: "Violet" },
  { id: "#c2410c", label: "Orange" },
  { id: "#1f2937", label: "Graphite" },
] as const;

export const SECTION_KEYS: SectionKey[] = ["summary", "experience", "companies", "projects", "research", "skills", "education"];
export const SECTION_LABEL: Record<SectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  companies: "Companies",
  projects: "Projects",
  research: "Research",
  skills: "Skills",
  education: "Education",
};

/** Which sections each document type offers, in the order the builder lists them. */
export const TYPE_SECTIONS: Record<DocType, SectionKey[]> = {
  resume: SECTION_KEYS,
  cv: SECTION_KEYS,
  portfolio: ["summary", "projects", "companies", "research", "skills"],
};
const ON_BY_DEFAULT: Record<DocType, SectionKey[]> = {
  resume: ["summary", "skills", "experience", "projects", "companies", "education"],
  cv: SECTION_KEYS,
  portfolio: ["summary", "projects", "companies", "research", "skills"],
};
/** Reading order of a one-column resume or CV. The split template pulls skills and education into its sidebar. */
export const FLOW: Record<"resume" | "cv", SectionKey[]> = {
  resume: ["summary", "skills", "experience", "projects", "companies", "education", "research"],
  cv: ["summary", "experience", "companies", "projects", "research", "skills", "education"],
};

export const sectionsFor = (type: DocType): Record<SectionKey, boolean> =>
  Object.fromEntries(SECTION_KEYS.map((k) => [k, ON_BY_DEFAULT[type].includes(k)])) as Record<SectionKey, boolean>;

/** How many projects each document type shows until the visitor changes it. */
export const DEFAULT_MAX: Record<DocType, number> = { resume: 4, cv: 99, portfolio: 6 };
export const PROJECT_TOTAL = featuredProjects.length + moreProjects.length;

/* ------------------------------------------------------------------ focus */

export const FOCUSES: { id: Focus; label: string; headline: string; words: string[]; groups: string[] }[] = [
  { id: "all", label: "All-round", headline: PROFILE.title, words: [], groups: [] },
  {
    id: "backend",
    label: "Backend",
    headline: "Backend Developer",
    words: ["laravel", "node", "express", "fastapi", "api", "postgresql", "mysql", "mongodb", "supabase", "admin", "backend", "websocket"],
    groups: ["Backend", "Data", "Languages", "DevOps & IoT", "AI & Automation", "Frontend & Mobile"],
  },
  {
    id: "fullstack",
    label: "Full-stack",
    headline: "Full-stack Developer",
    words: ["react", "next", "tailwind", "typescript", "kotlin", "android", "vite", "javascript", "dashboard", "app"],
    groups: ["Frontend & Mobile", "Backend", "Languages", "Data", "AI & Automation", "DevOps & IoT"],
  },
  {
    id: "ai",
    label: "Automation & AI",
    headline: "Automation & AI Integration Developer",
    words: ["ai", "groq", "gemini", "llm", "bot", "automation", "n8n", "telegram", "assistant", "matching"],
    groups: ["AI & Automation", "Backend", "Languages", "Data", "DevOps & IoT", "Frontend & Mobile"],
  },
  {
    id: "iot",
    label: "IoT",
    headline: "IoT & Backend Developer",
    words: ["iot", "esp32", "lora", "electronics", "sensor", "firmware"],
    groups: ["DevOps & IoT", "Backend", "Languages", "Data", "AI & Automation", "Frontend & Mobile"],
  },
];
export const FOCUS: Record<Focus, (typeof FOCUSES)[number]> = Object.fromEntries(FOCUSES.map((f) => [f.id, f])) as never;

const text = (p: Project) => `${p.name} ${p.kind} ${p.description} ${p.stack.join(" ")}`.toLowerCase();
const score = (p: Project, words: string[]) => {
  const t = text(p);
  return words.reduce((n, w) => n + (new RegExp(`\\b${w}\\b`).test(t) ? 1 : 0), 0);
};

export const orderedSkills = (focus: Focus) => {
  const order = FOCUS[focus].groups;
  if (!order.length) return skillGroups;
  const rank = (label: string) => { const i = order.indexOf(label); return i < 0 ? order.length : i; };
  return [...skillGroups].sort((a, b) => rank(a.label) - rank(b.label));
};

/* ------------------------------------------------------------------ options */

export type Options = {
  type: DocType;
  template: Template;
  accent: string;
  focus: Focus;
  /** Empty means "use the focus's default headline". */
  headline: string;
  /** Empty means "use the site summary". */
  summary: string;
  phone: string;
  showEmail: boolean;
  showLocation: boolean;
  showLinks: boolean;
  showPhoto: boolean;
  sections: Record<SectionKey, boolean>;
  /** null means "the default for this document type". */
  maxProjects: number | null;
};

export const defaultOptions = (type: DocType = "resume"): Options => ({
  type,
  template: "clean",
  accent: ACCENTS[0].id,
  focus: "all",
  headline: "",
  summary: "",
  phone: "",
  showEmail: true,
  showLocation: true,
  showLinks: true,
  showPhoto: false,
  sections: sectionsFor(type),
  maxProjects: null,
});

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], d: T): T => ((allowed as readonly string[]).includes(v as string) ? (v as T) : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Saved settings come from the visitor's own storage, but are still checked field by field. */
export function sanitizeOptions(raw: unknown): Options {
  const d = defaultOptions();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const type = oneOf(r.type, DOC_TYPES.map((t) => t.id), d.type);
  const base = sectionsFor(type);
  const saved = (r.sections && typeof r.sections === "object" ? r.sections : {}) as Record<string, unknown>;
  const template = oneOf(r.template, TEMPLATES.map((t) => t.id), d.template);
  return {
    type,
    template: template === "split" && !canSplit(type) ? "clean" : template,
    accent: oneOf(r.accent, ACCENTS.map((a) => a.id as string), d.accent),
    focus: oneOf(r.focus, FOCUSES.map((f) => f.id), d.focus),
    headline: str(r.headline, 80),
    summary: str(r.summary, 700),
    phone: str(r.phone, 24),
    showEmail: bool(r.showEmail, d.showEmail),
    showLocation: bool(r.showLocation, d.showLocation),
    showLinks: bool(r.showLinks, d.showLinks),
    showPhoto: bool(r.showPhoto, d.showPhoto),
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, bool(saved[k], base[k])])) as Record<SectionKey, boolean>,
    maxProjects: typeof r.maxProjects === "number" && r.maxProjects >= 1 && r.maxProjects <= 99 ? Math.floor(r.maxProjects) : null,
  };
}

/* ------------------------------------------------------------------ derived content */

export const effectiveMax = (o: Options) => Math.min(o.maxProjects ?? DEFAULT_MAX[o.type], PROJECT_TOTAL);

/** Projects for the document: ranked by the chosen focus (stable, so ties keep the site's order), then trimmed. */
export function pickProjects(o: Options): Project[] {
  const all = [...featuredProjects, ...moreProjects];
  const words = FOCUS[o.focus].words;
  const ranked = words.length ? [...all].sort((a, b) => score(b, words) - score(a, words)) : all;
  return ranked.slice(0, effectiveMax(o));
}

export type ContactItem = { text: string; href?: string };

export function contactItems(o: Options): ContactItem[] {
  const items: ContactItem[] = [];
  if (o.showEmail) items.push({ text: PROFILE.email, href: `mailto:${PROFILE.email}` });
  const phone = o.phone.trim();
  if (phone) items.push({ text: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` });
  if (o.showLocation) items.push({ text: PROFILE.location });
  if (o.showLinks) {
    items.push({ text: PROFILE.website, href: `https://${PROFILE.website}` });
    items.push({ text: PROFILE.github, href: `https://${PROFILE.github}` });
    items.push({ text: PROFILE.linkedin, href: `https://www.${PROFILE.linkedin}` });
  }
  return items;
}

export const firstSentence = (s: string) => s.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? s;
export const shortUrl = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
/** "Sister company · IoT lab" becomes "IoT lab" (the document says "Companies", so the prefix is noise). */
export const companyKind = (kind: string) => kind.split(" · ").pop() ?? kind;

export const fileName = (o: Options) => `${PROFILE.name.replace(/\s+/g, "-")}-${DOC_TYPES.find((t) => t.id === o.type)?.file}`;
