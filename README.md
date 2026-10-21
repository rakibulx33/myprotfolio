# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, backend & automation developer and CSE student at DIU, Dhaka.
An interactive terminal portfolio: a working zsh-style prompt in the hero (boot sequence, typed
`whoami`, real commands), a pixel-decoded portrait, tmux tabs, typed section commands with
decrypt-style headings, and a vim status line.

**Live:** [rakibulx33.me](https://rakibulx33.me) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

## Terminal commands

`help`, `whoami` / `neofetch` (prints the photo inline with a glitch), `services`, `projects` / `ls`,
`open <project>`, `research`, `skills`, `contact`, `cd <section>`, `date`, `clear`. Press `/` anywhere to focus the prompt; `↑`/`↓` for history, `Tab` to complete.
Number keys `0`–`5` jump between sections. The profile.jpg window glitches whenever a command runs.

## SEO

- **Prerendered HTML.** `npm run build` server-renders the page (`src/entry-server.tsx` →
  `scripts/prerender.mjs`) so crawlers, link previews and AI assistants get the full content
  without JavaScript; the client hydrates it. Animations are progressive enhancement: content is
  only hidden while JS runs (`html.js`).
- ProfilePage + Person + WebSite JSON-LD, Open Graph/Twitter cards (`public/og.jpg`, 1200×630),
  favicon set + web manifest, image sitemap (lastmod stamped at build), `robots.txt`, `llms.txt`.
- IndexNow key in `public/` and a post-deploy ping in the workflow (Bing, Yandex, Seznam, Naver).

## Tech Stack

- **Vite** + **React 19** + **TypeScript** (static SPA, deploys to GitHub Pages)
- Hand-written CSS with design tokens (`src/styles.css`), Tailwind v4 for the reset
- **Martian Mono** (variable width) + **Instrument Sans**, self-hosted
- No animation libraries; every animation respects `prefers-reduced-motion`

## Structure

```
index.html         — Vite entry + SEO/meta + JSON-LD
src/main.tsx       — React entry (hydrates the prerendered HTML)
src/entry-server.tsx — server render used at build time
scripts/prerender.mjs — writes the rendered page into dist/index.html
src/data.ts        — projects, research, skills and links (edit this to change content)
src/Terminal.tsx   — the interactive terminal and its commands
src/Portfolio.tsx  — page layout and sections
src/hooks.ts       — in-view, typing, scramble and clock hooks
src/styles.css     — tokens and styles
public/            — profile.jpg/.webp, og.jpg, icons, robots.txt, sitemap.xml, llms.txt, CNAME
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
