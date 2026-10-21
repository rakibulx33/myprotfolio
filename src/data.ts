// Curated portfolio content. Edit this file to change what the site shows;
// Portfolio.tsx only handles layout.

/** Page-size portrait (720px WebP). /profile.jpg stays as the full-size image for search and social. */
export const PORTRAIT = "/profile-720.webp";

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
};

export const featuredProjects: Project[] = [
  {
    name: "BuildIoT BD",
    kind: "E-commerce platform",
    description:
      "A full online store for electronics and IoT parts in Bangladesh, with customer accounts, local payments and delivery, and a staff admin panel.",
    stack: ["Laravel", "Tailwind CSS"],
    private: true,
  },
  {
    name: "TradingSpark",
    kind: "Algorithmic trading system",
    description:
      "Breeds thousands of trading-strategy variants with a genetic algorithm on NautilusTrader. Survivors are forward-tested on data they have never seen, and the graded winners go into a vault. From there it builds decorrelated portfolios and runs them 24/7, demo first, with real money only behind an explicit gate.",
    stack: ["Python 3.13", "NautilusTrader", "Parquet", "React", "TypeScript"],
    code: `${GH}/tradingspark`,
  },
  {
    name: "ShopTalk",
    kind: "Multi-tenant SaaS",
    description:
      "A multi-tenant storefront platform where each shop gets an AI assistant that helps customers find products by voice and chat.",
    stack: ["Next.js", "Supabase", "AI"],
    private: true,
  },
  {
    name: "Replixon",
    kind: "AI social inbox",
    description:
      "An AI-assisted inbox that brings a business's social messaging channels into one place and helps answer customers faster.",
    stack: ["Next.js", "Supabase", "AI"],
    private: true,
  },
  {
    name: "InstaMiner",
    kind: "Mobile + backend platform",
    description:
      "A social engagement platform with a native Android app, a backend API and an admin panel.",
    stack: ["Kotlin", "Python", "Next.js"],
    private: true,
  },
  {
    name: "Tender Package Builder",
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

export type Research = {
  title: string;
  venue: string;
  summary: string;
  tags: string[];
};

export const research: Research[] = [
  {
    title: "Smart energy monitoring for Bangladeshi homes",
    venue: "Undergraduate thesis, DIU CSE",
    summary: "Low-cost IoT and machine learning to help households understand their electricity use and costs.",
    tags: ["IoT", "Machine learning", "Energy"],
  },
  {
    title: "IoT monitoring for potato storage",
    venue: "IEEE conference paper, second author",
    summary: "Low-cost sensing to reduce post-harvest losses in stored potatoes.",
    tags: ["IoT", "Agritech"],
  },
  {
    title: "IoT monitoring for onion storage",
    venue: "Conference paper",
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

export const services: { title: string; text: string }[] = [
  {
    title: "Backend systems and APIs",
    text: "REST and real-time APIs, databases and background jobs in Node.js, Laravel and FastAPI, built to run reliably in production.",
  },
  {
    title: "E-commerce for Bangladesh",
    text: "Online stores and admin panels with the payment and delivery options Bangladeshi customers expect.",
  },
  {
    title: "Automation and AI integrations",
    text: "Chatbots, n8n workflows and LLM features that answer customers, sync data between tools and remove manual work.",
  },
  {
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
