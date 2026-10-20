# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, backend & automation developer and CSE student at DIU, Dhaka.
A circuit-board themed single-page site: solder-mask green boards, gold traces and silkscreen type,
with curated projects, research summaries and live GitHub activity.

**Live:** [rakibulx33.me](https://rakibulx33.me) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

## Tech Stack

- **Vite** + **React 19** + **TypeScript** (static SPA, deploys to GitHub Pages)
- Hand-written CSS with design tokens (`src/styles.css`), Tailwind v4 for the reset
- **Archivo** variable font (self-hosted, width axis for the wide headlines)
- No animation libraries: one CSS trace-drawing moment in the hero, disabled for reduced motion

## Structure

```
index.html         — Vite entry + SEO/meta + JSON-LD
src/main.tsx       — React entry
src/data.ts        — projects, research, skills and links (edit this to change content)
src/Portfolio.tsx  — page layout
src/styles.css     — tokens and styles
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
