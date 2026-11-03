# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, backend & automation developer and CSE student at DIU, Dhaka.

The design is called **Exhibition**: the portfolio hangs like a small gallery show. White walls, each featured
project framed as a two-colour screen print with a museum label beside it, research papers laid out in a glass
display case, and the GitHub year framed as a work called *Daily practice*.

The posters (`src/Gallery.tsx`) are drawn by code from each project, so nothing is a stock image: the ink is the
kind of work, and the picture is what the project does (candles for the trading system, speech bubbles for the
shop assistant, a stack of pages for the tender builder, and so on). The two inks overprint with `multiply`, as
they do on paper, and the second ink sits a hair out of register. Each poster prints itself the first time it
scrolls into view: the first ink, then the second, sliding into register.

| Ink | Kind of work |
| --- | --- |
| Blue | Backend systems and APIs |
| Fluorescent pink | E-commerce for Bangladesh |
| Orange | Automation and AI |
| Teal | IoT prototypes |

Light mode is "gallery lights on". The **Load-shedding** switch in the header is dark mode: the lights flicker out,
the walls go dark and only the framed works stay lit, each under its own picture light. On a desktop the pointer
becomes a torch. It follows the system setting until a visitor picks one.

On arrival there is one moment: the name goes up on the wall like vinyl lettering and the portrait's light comes
on. With reduced motion everything is simply there, and without JavaScript the page is complete.

Type is Libre Franklin for names, headings and labels and Newsreader for reading text.

**Live:** [rakibulx33.me](https://rakibulx33.me) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

The previous design, Signal (the circuit board, the hero energy model and the computer-science Lab), is kept on
the `signal-theme` branch.

## Command palette

`Ctrl K`, `⌘K` or `/` opens the palette (`src/Palette.tsx`): every section, project, research paper, profile and
action is searchable. The old terminal commands still work when typed in full: `hire`, `resume` / `cv`, `whoami`,
`open <project>`, `cd <section>`, `socials`, `achievements`, `lights`, `date`, `help`. A few are hidden (start with
`ls -a`), and visitors collect 8 achievements as they explore.

## GitHub contributions (live)

`scripts/fetch-github.mjs` asks GitHub's GraphQL API for the last year of contributions and writes
`src/github.json`, which is baked into the page. The deploy workflow runs it before every build **and every hour**
(`schedule` in `.github/workflows/static.yml`), so the graph stays current without calling a third-party API from
the visitor's browser. Private contributions are counted because the GitHub profile shows them.
Locally, `npm run github` refreshes the file (set `GITHUB_TOKEN` for the GraphQL source; without it, a public
mirror is used). GitHub pauses scheduled workflows in repositories with no activity for 60 days; any push resumes them.

The section draws the year like a meter: the weekly load profile on top, one cell per day below, with fixed
buckets (1–2, 3–6, 7–19, 20+) so one huge day does not flatten the rest. When it scrolls into view, a sweep line
crosses the year once while the totals count up. Without JavaScript or with reduced motion, it is simply shown.

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
- **Libre Franklin** and **Newsreader** (variable fonts), self-hosted.
  The Bangla name uses a 4.5 KB subset of **Tiro Bangla** (`public/fonts/`, SIL OFL), made with
  `pyftsubset … --text="রাকিবুল হাসান" --layout-features='*' --flavor=woff2`
- The resume builder keeps **Instrument Sans** and **Martian Mono** for its documents, loaded only with the builder
- No animation libraries; the hero intro is pure CSS (plays before JavaScript), and every animation respects `prefers-reduced-motion`

## Structure

```
index.html         — Vite entry + SEO/meta + JSON-LD
src/main.tsx       — React entry (hydrates the prerendered HTML)
src/entry-server.tsx — server render used at build time
scripts/prerender.mjs — writes the rendered page into dist/index.html
src/data.ts        — projects, research, skills and links (edit this to change content)
src/github.json    — last year of GitHub contributions (written by scripts/fetch-github.mjs)
src/Portfolio.tsx  — page layout and sections
src/Gallery.tsx    — the posters drawn from each project, the ink swatches, and the torch
src/GitHubYear.tsx — the animated contribution year
src/Palette.tsx    — command palette (Ctrl K) and the typed commands
src/theme.ts       — light / load-shedding (dark) theme
src/Resume.tsx     — resume / CV / portfolio builder (lazy-loaded); resumeModel.ts, resume.css
src/Hire.tsx       — the project-brief dialog
src/Extras.tsx     — achievement toasts, floating brief button, matrix easter egg
src/store.ts       — achievements and page-wide events
src/hooks.ts       — in-view and clock hooks
src/styles.css     — tokens and styles
scripts/fetch-github.mjs — fetches the contribution calendar before each build
public/            — profile.jpg/.webp, og.jpg, icons, fonts, robots.txt, sitemap.xml, llms.txt, CNAME
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

Pushing to `main` triggers `.github/workflows/static.yml`, which fetches the GitHub contributions, builds the Vite
app and publishes `dist/` to GitHub Pages (served at the `rakibulx33.me` custom domain via `public/CNAME`).
The same workflow runs every hour to refresh the contribution graph; IndexNow is pinged only on pushes.

---

© 2026 Rakibul Hasan · rakibulx33@gmail.com
