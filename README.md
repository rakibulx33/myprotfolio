# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, backend & automation developer and CSE student at DIU, Dhaka.
An interactive terminal portfolio: a working zsh-style prompt in the hero (boot sequence, typed
`whoami`, real commands), a pixel-decoded portrait, tmux tabs, typed section commands with
decrypt-style headings, and a vim status line.

**Live:** [rakibulx33.me](https://rakibulx33.me) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

## Terminal commands

`hire`, `help`, `whoami` / `neofetch` (prints the photo inline with a glitch), `services`, `projects` / `ls`,
`open <project>`, `companies`, `research`, `resume` / `cv`, `skills`, `socials`, `contact`, `achievements`, `cd <section>`, `date`, `clear`.
Press `/` anywhere to focus the prompt; `↑`/`↓` for history, `Tab` to complete.
Number keys `0`–`6` jump between sections. The profile.jpg window glitches whenever a command runs.
A few commands are hidden (start with `ls -a`), and visitors collect 8 achievements as they explore.

## Resume builder (`resume`)

`resume` (or `cv`, or the "get my resume" buttons) opens a builder that lays out a **resume** (one page), a **CV**
(full record) or a **project portfolio** (cover page plus a card per project) from the same data as the site, and
exports it to PDF with the browser's print dialog, so the PDF has real, selectable text. Options: three looks
(Clean, Split for the resume, Terminal), accent colour, a focus (backend, full-stack, automation and AI, IoT) that
puts the most relevant projects and skills first, editable headline and summary, section toggles, project count,
optional photo and phone number. The page count shown is an estimate and matched Chromium's output in testing.

- Content comes from `src/data.ts` (`PROFILE`, projects, companies, research, skills), so updating the site updates the documents.
- The phone number is typed into the builder and saved only in the visitor's own browser. Do not put it in the repo.
- Code: `src/Resume.tsx` (UI and document), `src/resumeModel.ts` (options and content rules), `src/resume.css`
  (builder, templates and print rules). It is loaded on demand, so it does not affect the first page load.

## Project briefs (`hire`)

`hire` asks six quick questions and sends the answers as a brief, two ways at once:

- **Email** through [FormSubmit](https://formsubmit.co) (no backend). The first submission sends an activation link to the inbox.
- **Telegram** through a small Cloudflare Worker in [`worker/`](worker/README.md), which keeps the bot token secret.
  `HIRE_RELAY` in `src/data.ts` points the site at it (set it to `""` for email only).

The visitor sees "Delivered" as soon as either one lands. If both fail, they can open their email app or copy the brief.

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
src/Resume.tsx     — resume / CV / portfolio builder (lazy-loaded); resumeModel.ts, resume.css
src/Terminal.tsx   — the interactive terminal and its commands
src/Portfolio.tsx  — page layout and sections
src/Hire.tsx       — the `hire` project-brief wizard
src/Extras.tsx     — achievement toasts, floating hire button, matrix easter egg
src/store.ts       — achievements and page-wide events
src/hooks.ts       — in-view, typing, scramble and clock hooks
src/styles.css     — tokens and styles
public/            — profile.jpg/.webp, og.jpg, icons, robots.txt, sitemap.xml, llms.txt, CNAME
worker/            — Cloudflare Worker that forwards briefs to Telegram (deployed separately)
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
