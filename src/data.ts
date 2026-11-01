// Curated portfolio content. Edit this file to change what the site shows;
// Portfolio.tsx only handles layout.

/** Page-size portrait (720px WebP). /profile.jpg stays as the full-size image for search and social. */
export const PORTRAIT = "/profile-720.webp";

/** Every public profile, all under the same handle, in priority order. */
export const HANDLE = "rakibulx33";
export type Social = { name: string; url: string; label: string; group: "Hire" | "Message" | "Social" | "Skills" | "Personal" };
export const SOCIALS: Social[] = [
  { name: "GitHub", url: "https://github.com/rakibulx33", label: "@rakibulx33", group: "Hire" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/rakibulx33", label: "in/rakibulx33", group: "Hire" },
  { name: "Fiverr", url: "https://www.fiverr.com/rakibulx33", label: "@rakibulx33", group: "Hire" },
  { name: "Telegram", url: "https://t.me/rakibulx33", label: "t.me/rakibulx33", group: "Message" },
  { name: "Facebook", url: "https://www.facebook.com/rakibulx33", label: "fb.com/rakibulx33", group: "Social" },
  { name: "X", url: "https://x.com/rakibulx33", label: "@rakibulx33", group: "Social" },
  { name: "YouTube", url: "https://www.youtube.com/@rakibulx33", label: "@rakibulx33", group: "Social" },
  { name: "Instagram", url: "https://www.instagram.com/rakibulx33", label: "@rakibulx33", group: "Social" },
  { name: "Kaggle", url: "https://www.kaggle.com/rakibulx33", label: "@rakibulx33", group: "Skills" },
  { name: "Codeforces", url: "https://codeforces.com/profile/rakibulx33", label: "rakibulx33", group: "Skills" },
  { name: "LeetCode", url: "https://leetcode.com/u/rakibulx33", label: "u/rakibulx33", group: "Skills" },
  { name: "AtCoder", url: "https://atcoder.jp/users/rakibulx33", label: "rakibulx33", group: "Skills" },
  { name: "CodeChef", url: "https://www.codechef.com/users/rakibulx33", label: "rakibulx33", group: "Skills" },
  { name: "Reddit", url: "https://www.reddit.com/user/rakibulx33", label: "u/rakibulx33", group: "Personal" },
  { name: "TikTok", url: "https://www.tiktok.com/@rakibulx33", label: "@rakibulx33", group: "Personal" },
  { name: "Snapchat", url: "https://www.snapchat.com/add/rakibulx33", label: "rakibulx33", group: "Personal" },
];

/** How a project runs, start to finish (a real sequence, so it is numbered on the page). */
export const PROCESS: { title: string; text: string }[] = [
  { title: "Brief", text: "You tell me what you need: the problem, who it's for and when you'd like it live." },
  { title: "Plan", text: "I reply with questions and a plan: scope, stack and milestones you can agree to." },
  { title: "Build", text: "I build in small milestones you can try as we go, with regular progress updates." },
  { title: "Launch", text: "We ship it. You get the code, the docs and help settling in after launch." },
];

/**
 * The Telegram relay for `hire` briefs (worker/README.md). Set it to "" for email only.
 * VITE_HIRE_RELAY overrides it at build time; the tests use that.
 */
export const HIRE_RELAY: string = import.meta.env.VITE_HIRE_RELAY ?? "https://hire-relay.rakibulx33.workers.dev/";

export const LINKS = {
  email: "rakibulx33@gmail.com",
  github: "https://github.com/rakibulx33",
  linkedin: "https://www.linkedin.com/in/rakibulx33",
  facebook: "https://www.facebook.com/rakibulx33",
};

const GH = "https://github.com/rakibulx33";

export type Project = {
  name: string;
  kind: string;
  description: string;
  stack: string[];
  code?: string;
  live?: string;
  /** Repo is private: shown as a case study with no code link. */
  private?: boolean;
  /** Which kind of work it is (sets its colour in the project index). */
  line?: Line;
};

export const featuredProjects: Project[] = [
  {
    name: "BuildIoT BD",
    line: "commerce",
    kind: "E-commerce platform",
    description:
      "A full online store for electronics and IoT parts in Bangladesh, with customer accounts, local payments and delivery, and a staff admin panel.",
    stack: ["Laravel", "Tailwind CSS"],
    private: true,
  },
  {
    name: "TradingSpark",
    line: "automation",
    kind: "Algorithmic trading system",
    description:
      "Breeds thousands of trading-strategy variants with a genetic algorithm on NautilusTrader. Survivors are forward-tested on data they have never seen, and the graded winners go into a vault. From there it builds decorrelated portfolios and runs them 24/7, demo first, with real money only behind an explicit gate.",
    stack: ["Python 3.13", "NautilusTrader", "Parquet", "React", "TypeScript"],
    code: `${GH}/tradingspark`,
  },
  {
    name: "ShopTalk",
    line: "commerce",
    kind: "Multi-tenant SaaS",
    description:
      "A multi-tenant storefront platform where each shop gets an AI assistant that helps customers find products by voice and chat.",
    stack: ["Next.js", "Supabase", "AI"],
    private: true,
  },
  {
    name: "Replixon",
    line: "automation",
    kind: "AI social inbox",
    description:
      "An AI-assisted inbox that brings a business's social messaging channels into one place and helps answer customers faster.",
    stack: ["Next.js", "Supabase", "AI"],
    private: true,
  },
  {
    name: "InstaMiner",
    line: "backend",
    kind: "Mobile + backend platform",
    description:
      "A social engagement platform with a native Android app, a backend API and an admin panel.",
    stack: ["Kotlin", "Python", "Next.js"],
    private: true,
  },
  {
    name: "Tender Package Builder",
    line: "automation",
    kind: "Solo build for AI DevFest 2026",
    description:
      "Takes a tender's requirements.json and a set of PDFs and produces one checked, correctly ordered PDF package, with a cover page and a page footer on every page. Everything runs in the browser, in English and Bangla, and no file is ever uploaded.",
    stack: ["React", "Vite", "pdf-lib", "GitHub Actions"],
    code: `${GH}/devfest-241-15-223`,
    live: "https://rakibulx33.github.io/devfest-241-15-223/",
  },
];

export const moreProjects: Project[] = [
  {
    name: "Smart Escape",
    kind: "Evacuation route simulator",
    description: "Finds the lowest-cost route to an open exit and recalculates as corridors or exits are blocked. English/Bangla, keyboard accessible.",
    stack: ["JavaScript", "SVG"],
    code: `${GH}/AI-DEV-FEST-2026-VIBE-CODING-MOCK`,
    live: "https://rakibulx33.github.io/AI-DEV-FEST-2026-VIBE-CODING-MOCK/",
  },
  {
    name: "Mosque Admin Panel",
    kind: "Bengali admin system",
    description: "Members with family trees, donations, expenses, bank ledger and printable Bengali reports. Role-based access with CSRF protection and rate limiting.",
    stack: ["Express", "PostgreSQL", "Knex", "EJS"],
    code: `${GH}/Baitur-Rahman-Jame-Mosjid`,
  },
  {
    name: "DIU Job Hub",
    kind: "University job platform",
    description: "Student, recruiter and admin portals, with AI job matching and academic eligibility scoring.",
    stack: ["Next.js 15", "TypeScript", "MySQL", "Groq"],
    code: `${GH}/diujobhub`,
  },
  {
    name: "Upbit Watch",
    kind: "Listing-alert bot",
    description: "Watches Upbit, Binance, Bithumb and Coinbase for new listings, streams live status over WebSocket and sends Telegram alerts.",
    stack: ["Python", "FastAPI", "WebSocket", "SQLite"],
    code: `${GH}/firstlight`,
  },
  {
    name: "MealNChill",
    kind: "Mess management system",
    description: "Meals, attendance, inventory and shared finances for hostels and shared living spaces.",
    stack: ["Next.js 15", "TypeScript", "MongoDB"],
    code: `${GH}/MealNChill`,
  },
  {
    name: "WaitWise",
    kind: "Queue management",
    description: "JavaFX admin desktop app plus a mobile web view. Customers join by QR code and see their live position.",
    stack: ["Java", "JavaFX", "MySQL"],
    code: `${GH}/WaitWise`,
  },
  {
    name: "BongoScript",
    kind: "Team compiler project",
    description: "A programming language with Bangla keywords, transpiled to C. Built for the compiler design course.",
    stack: ["Flex", "Bison", "C", "Node.js"],
    code: "https://github.com/toha129/bongoscript_project",
  },
  {
    name: "Winternet Meter",
    kind: "Windows desktop app",
    description: "A floating, always-on-top meter showing live upload and download speed, with a customizable look.",
    stack: ["C#", ".NET"],
    code: `${GH}/WinternetMeter`,
  },
  {
    name: "Cheatsheet Generator",
    kind: "Document builder",
    description: "Drag-and-drop, block-based cheatsheet builder with templates and PDF export.",
    stack: ["React", "dnd-kit", "jsPDF"],
    code: `${GH}/cheatSheetGenerator`,
  },
  {
    name: "NS Order Forward",
    kind: "Android automation",
    description: "An Android automation app for processing orders in the background.",
    stack: ["Kotlin", "Android"],
    private: true,
  },
  {
    name: "ClanWar Coach",
    kind: "Game stats tracker",
    description: "Clan and player stats for Clash of Clans, served through a caching proxy for the official API.",
    stack: ["React", "Express", "Recharts"],
    code: `${GH}/Clash-of-Clan-Status`,
  },
];

export type Company = {
  name: string;
  kind: string;
  description: string;
  /** What I do there, in a few words. */
  role: string;
  url?: string;
  /** Logo in /public/companies. `plate` puts it on a light tile, for artwork that vanishes on dark. */
  logo?: { src: string; plate?: boolean };
};

/** Companies I build for. No team sizes or ownership split on purpose. */
export const companies: Company[] = [
  {
    name: "Gikpik",
    kind: "Sister company · software and automation",
    description: "A software company building web, mobile and automation products for businesses, with a focus on professional delivery.",
    role: "Backend, automation and full-stack development",
    url: "https://rakibulx33.github.io/gikpik/",
    logo: { src: "/companies/gikpik.svg" },
  },
  {
    name: "BuildIoT BD",
    kind: "Sister company · electronics and IoT parts store",
    description: "An online store for electronics and IoT parts in Bangladesh, with local payments, delivery and a staff admin panel.",
    role: "Technical side: platform, backend and design",
    url: "https://buildiotbd.com",
  },
  {
    name: "BuildIoT Lab",
    kind: "Sister company · IoT and embedded engineering",
    description: "Hardware design, custom PCBs, firmware and connected software, delivered remotely.",
    role: "Technical side: website and IoT builds",
    url: "https://buildiotlabs.com",
    logo: { src: "/companies/buildiot-lab.png", plate: true },
  },
];

export type Research = {
  title: string;
  venue: string;
  summary: string;
  tags: string[];
  /** Shown in brackets before the venue. */
  status?: "in progress" | "in preparation";
};

export const research: Research[] = [
  {
    title: "Smart energy monitoring for Bangladeshi homes",
    venue: "Undergraduate thesis, DIU CSE",
    summary: "Low-cost IoT and machine learning to help households understand their electricity use and costs.",
    tags: ["IoT", "Machine learning", "Energy"],
    status: "in progress",
  },
  {
    title: "Single-meter energy insights for homes",
    venue: "IEEE conference paper, first author",
    summary: "Showing households where their electricity goes, using one low-cost meter and no extra sensors.",
    tags: ["IoT", "Energy"],
  },
  {
    title: "IoT monitoring for potato storage",
    venue: "IEEE conference paper, second author",
    summary: "Low-cost sensing to reduce post-harvest losses in stored potatoes.",
    tags: ["IoT", "Agritech"],
  },
  {
    title: "IoT monitoring for onion storage",
    venue: "Springer conference paper",
    summary: "Low-cost sensing to reduce post-harvest losses in stored onions.",
    tags: ["IoT", "Agritech"],
  },
  {
    title: "Device-free human presence sensing",
    venue: "IEEE conference paper",
    summary: "Detecting whether people are in a room without cameras or wearables.",
    tags: ["IoT", "Sensing"],
  },
];

/** The four kinds of work. Each has one colour across the site (the mains phases: blue, red, yellow, earth green). */
export type Line = "backend" | "commerce" | "automation" | "iot";

export const services: { key: Line; title: string; short: string; text: string }[] = [
  {
    key: "backend",
    short: "Backend",
    title: "Backend systems and APIs",
    text: "REST and real-time APIs, databases and background jobs in Node.js, Laravel and FastAPI, built to run reliably in production.",
  },
  {
    key: "commerce",
    short: "E-commerce",
    title: "E-commerce for Bangladesh",
    text: "Online stores and admin panels with the payment and delivery options Bangladeshi customers expect.",
  },
  {
    key: "automation",
    short: "Automation and AI",
    title: "Automation and AI integrations",
    text: "Chatbots, n8n workflows and LLM features that answer customers, sync data between tools and remove manual work.",
  },
  {
    key: "iot",
    short: "IoT",
    title: "IoT prototypes",
    text: "ESP32-based sensing and monitoring systems, from the device and firmware to the dashboard.",
  },
];

export const skillGroups: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["TypeScript", "JavaScript", "Python", "PHP", "Kotlin", "Java", "C#", "C", "C++"] },
  { label: "Backend", items: ["Node.js", "Express", "FastAPI", "Laravel", "Next.js", "REST", "WebSockets"] },
  { label: "Frontend & Mobile", items: ["React", "Tailwind CSS", "Livewire", "Filament", "React Three Fiber", "Jetpack Compose"] },
  { label: "Data", items: ["PostgreSQL", "MySQL / MariaDB", "MongoDB", "Supabase", "Redis", "SQLite"] },
  { label: "AI & Automation", items: ["Groq", "Gemini", "Ollama", "n8n", "Selenium", "LLM evals"] },
  { label: "DevOps & IoT", items: ["Docker", "Linux", "GitHub Actions", "Cloudflare Tunnel", "ESP32", "LoRa"] },
];

/**
 * Résumé content, used by the `resume` builder (src/Resume.tsx). Everything here is already public on the
 * site, so editing the site's data above keeps the generated documents current. Contact details that are
 * not public (a phone number) are typed into the builder and stay in the visitor's browser, never in this repo.
 */
export const PROFILE = {
  name: "Rakibul Hasan",
  title: "Backend & Automation Developer",
  location: "Dhaka, Bangladesh",
  email: LINKS.email,
  website: "rakibulx33.me",
  github: "github.com/rakibulx33",
  linkedin: "linkedin.com/in/rakibulx33",
  summary:
    "Freelance backend and automation developer in Dhaka, Bangladesh, and a third-year CSE student at Daffodil International University. Builds Laravel, Node.js and Python systems, AI integrations and ESP32-based IoT prototypes for businesses and teams. Freelancing since 2022.",
  education: [
    { degree: "BSc in Computer Science and Engineering", school: "Daffodil International University", detail: "Third-year student" },
  ],
  experience: [
    {
      role: "Freelance Backend & Automation Developer",
      org: "Self-employed, remote",
      period: "2022 – present",
      points: [
        "Build REST and real-time APIs, databases and background jobs in Node.js, Laravel and FastAPI for client projects.",
        "Deliver e-commerce stores and admin panels with the payment and delivery options Bangladeshi customers expect.",
        "Build chatbots, n8n workflows and LLM features that answer customers, sync data between tools and remove manual work.",
        "Prototype ESP32-based sensing and monitoring systems, from the device and firmware to the dashboard.",
      ],
    },
  ],
};
