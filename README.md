# Rakibul Hasan — Portfolio

Personal portfolio of **Rakibul Hasan**, full-stack developer from Bangladesh.
A modern, dark "ember"-themed site with a real-time 3D hero and live GitHub data — built with pure HTML, CSS and JavaScript. No frameworks, no build step.

**Live:** [rakibulx33.github.io](https://github.com/rakibulx33) · **GitHub:** [@rakibulx33](https://github.com/rakibulx33)

## Features

### 3D Hero — "Ember Ocean"
- GPU shader-driven particle wave field (Three.js) — thousands of points animated in the vertex shader at 60fps
- Floating ember sparks with twinkle, mouse-parallax camera
- Pauses when scrolled off-screen; skipped under `prefers-reduced-motion`; graceful fallback when WebGL is unavailable

### Live GitHub Integration
- Stat counters (repos, stars, contributions, followers) fetched from the GitHub API
- Contribution heatmap rendered from real data, themed to match the site
- Language donut chart computed from repository data
- Project cards enriched with live language / star / fork info
- Baked-in fallback snapshot when the API is rate-limited or offline

### Design
- Warm dark "ember" palette — amber → rose gradient on near-black
- Glassmorphism cards with backdrop blur
- Inter + JetBrains Mono typography, terminal-style section badges
- 3D tilt on project cards, scroll-reveal animations, typewriter hero roles

### Quality
- Fully responsive (375px → 1440px+), mobile drawer navigation
- Accessible: skip link, focus rings, aria labels, reduced-motion support
- Zero dependencies beyond CDN fonts/icons/Three.js

## Structure

```
index.html    — markup (semantic sections, importmap for Three.js)
style.css     — design tokens + all styling
script.js     — UI interactions + GitHub data fetching/rendering
hero3d.js     — Three.js wave-field scene (ES module, isolated)
assets/       — images
```

## Run locally

Any static server works:

```bash
python -m http.server 8000
# → http://localhost:8000
```

---

© 2026 Rakibul Hasan · rakibulx33@gmail.com
