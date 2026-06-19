# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, full-stack developer from Bangladesh.
A dark "ember"-themed single-page site with a real-time React Three Fiber background, smooth scrolling, scroll-driven motion and live GitHub data.

**Live:** [rakibulx33.me](https://rakibulx33.me) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

## Tech Stack

- **Vite** + **React 19** + **TypeScript** (static SPA, no SSR — deploys to GitHub Pages)
- **Tailwind CSS v4** (`@tailwindcss/vite`) with custom `ember` design tokens
- **React Three Fiber** + **drei** + **three** — particle wave field, floating embers, wireframe core
- **Framer Motion** — scroll progress, reveal/parallax animations, animated counters
- **Lenis** — smooth scrolling
- **lucide-react** — icons

## Features

- 3D ember background scene (lazy-loaded `Scene3D` chunk)
- Live GitHub integration — stats, contribution heatmap, language donut, project cards
  (fetched client-side from the GitHub API with baked-in fallbacks)
- Fully responsive with a mobile drawer nav
- SEO: canonical URL, Open Graph + Twitter cards, Person/WebSite JSON-LD, sitemap, robots.txt

## Structure

```
index.html         — Vite entry + SEO/meta + JSON-LD
src/main.tsx       — React entry
src/Portfolio.tsx  — the whole single-page portfolio
src/Scene3D.tsx    — React Three Fiber scene (lazy-loaded)
src/styles.css     — Tailwind v4 + design tokens + custom utilities
public/            — profile.jpg, robots.txt, sitemap.xml, CNAME
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` triggers `.github/workflows/static.yml`, which builds the Vite app
and publishes `dist/` to GitHub Pages (served at the `rakibulx33.me` custom domain via `public/CNAME`).

---

© 2026 Rakibul Hasan · rakibulx33@gmail.com
