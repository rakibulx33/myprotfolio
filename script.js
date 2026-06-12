/* ============================================================
   Rakibul Hasan — Portfolio
   UI interactions + live GitHub data (with offline fallback)
   ============================================================ */

const GH_USER = 'rakibulx33';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Snapshot used when the GitHub API is unreachable or rate-limited */
const FALLBACK = {
    user: { public_repos: 14, followers: 2 },
    totalStars: 3,
    contributionsLastYear: 680,
    languages: {
        JavaScript: 4, TypeScript: 3, CSS: 2, Python: 1,
        Java: 1, 'C#': 1, 'C++': 1
    }
};

const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5',
    Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', C: '#555555',
    CSS: '#663399', HTML: '#e34c26', Shell: '#89e051', Other: '#8b949e'
};

/* Featured projects — descriptions sourced from each repo's README */
const FEATURED_PROJECTS = [
    {
        repo: 'diujobhub',
        title: 'DIU Job Hub',
        icon: 'fa-briefcase',
        desc: 'Full-stack, role-based university job platform with AI-powered job matching (Groq LLM), academic eligibility scoring and a premium glassmorphism UI.',
        tags: ['Next.js', 'TypeScript', 'AI']
    },
    {
        repo: 'MealNChill',
        title: 'MealNChill',
        icon: 'fa-utensils',
        desc: 'Comprehensive meal management system that makes planning, tracking and billing meals simple, efficient and chill.',
        tags: ['Next.js 15', 'TypeScript', 'MongoDB']
    },
    {
        repo: 'WaitWise',
        title: 'WaitWise',
        icon: 'fa-people-line',
        desc: 'Digital queue management system — JavaFX desktop app for admins plus a mobile web interface giving customers real-time queue status.',
        tags: ['Java', 'JavaFX', 'MySQL']
    },
    {
        repo: 'Baitur-Rahman-Jame-Mosjid',
        title: 'Mosque Admin Panel',
        icon: 'fa-mosque',
        desc: 'Server-rendered Bengali admin panel managing members, donations, expenses and bank transactions with printable reports and role-based access.',
        tags: ['Node.js', 'Express', 'PostgreSQL']
    },
    {
        repo: 'cheatSheetGenerator',
        title: 'Cheatsheet Generator',
        icon: 'fa-file-pdf',
        desc: 'Block-based cheatsheet builder with live WYSIWYG editing, drag-and-drop reordering and beautiful PDF export for technical reference sheets.',
        tags: ['React', 'Vite', 'Tailwind']
    },
    {
        repo: 'WinternetMeter',
        title: 'Winternet Meter',
        icon: 'fa-gauge-high',
        desc: 'Lightweight Windows app showing real-time upload/download speeds in a floating, always-on-top window with system-tray controls.',
        tags: ['C#', 'Windows', 'Desktop']
    }
];

/* ============ Navbar ============ */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

hamburger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
});

navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    });
});

/* Active link tracking */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.toggle(
                'active', l.getAttribute('href') === `#${entry.target.id}`));
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ============ Reveal on scroll ============ */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

function observeReveals(root = document) {
    root.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}
observeReveals();

/* ============ Typewriter ============ */
const ROLES = ['Full-Stack Developer', 'Backend Engineer', 'Product Builder', 'Problem Solver'];
const typeEl = document.getElementById('typewriter');

if (typeEl && !REDUCED_MOTION) {
    let roleIdx = 0, charIdx = ROLES[0].length, deleting = true;

    function tick() {
        const word = ROLES[roleIdx];
        charIdx += deleting ? -1 : 1;
        typeEl.textContent = word.slice(0, charIdx);

        let delay = deleting ? 45 : 85;
        if (!deleting && charIdx === word.length) {
            delay = 2200;
            deleting = true;
        } else if (deleting && charIdx === 0) {
            roleIdx = (roleIdx + 1) % ROLES.length;
            deleting = false;
            delay = 350;
        }
        setTimeout(tick, delay);
    }
    setTimeout(tick, 2000);
}

/* ============ Animated counters ============ */
function animateCounter(el, target) {
    if (REDUCED_MOTION) {
        el.textContent = target.toLocaleString();
        return;
    }
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

/* Fires when a counter is in view OR has been jumped past (e.g. nav anchor link) */
function checkCounters() {
    document.querySelectorAll('.stat-number:not([data-done])').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
            el.dataset.done = '1';
            animateCounter(el, parseInt(el.dataset.count, 10) || 0);
        }
    });
}

window.addEventListener('scroll', checkCounters, { passive: true });

/* Update a stat's target value; re-animate if it already fired */
function setStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.count = value;
    if (el.dataset.done) animateCounter(el, value);
}

/* ============ GitHub data ============ */
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

async function loadGitHubData() {
    let user = FALLBACK.user;
    let repos = [];
    let totalStars = FALLBACK.totalStars;
    let languages = FALLBACK.languages;

    try {
        [user, repos] = await Promise.all([
            fetchJSON(`https://api.github.com/users/${GH_USER}`),
            fetchJSON(`https://api.github.com/users/${GH_USER}/repos?per_page=100`)
        ]);
        totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
        languages = {};
        repos.forEach(r => {
            if (r.language && !r.fork) languages[r.language] = (languages[r.language] || 0) + 1;
        });
    } catch (err) {
        console.warn('GitHub API unavailable, using fallback snapshot:', err.message);
    }

    setStat('stat-repos', user.public_repos);
    setStat('stat-stars', totalStars);
    setStat('stat-followers', user.followers);
    checkCounters();

    renderLanguageDonut(languages);
    renderProjects(repos);
}

/* ============ Language donut chart ============ */
function renderLanguageDonut(languages) {
    const svg = document.getElementById('lang-donut');
    const legend = document.getElementById('lang-legend');
    if (!svg || !legend) return;

    const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 6);
    const otherCount = entries.slice(6).reduce((s, [, n]) => s + n, 0);
    if (otherCount > 0) top.push(['Other', otherCount]);

    const total = top.reduce((s, [, n]) => s + n, 0);
    if (!total) return;

    const R = 44, C = 2 * Math.PI * R;
    let offset = 0;
    let svgContent = '';

    top.forEach(([lang, count]) => {
        const frac = count / total;
        const color = LANG_COLORS[lang] || LANG_COLORS.Other;
        svgContent += `<circle class="donut-seg" cx="60" cy="60" r="${R}"
            stroke="${color}"
            stroke-dasharray="${(frac * C).toFixed(2)} ${(C - frac * C).toFixed(2)}"
            stroke-dashoffset="${(-offset * C + C / 4).toFixed(2)}">
            <title>${lang}: ${count} repo${count > 1 ? 's' : ''}</title>
        </circle>`;
        offset += frac;
    });

    svgContent += `<text x="60" y="58" class="donut-center">${total}</text>
        <text x="60" y="70" class="donut-center-sub">repos</text>`;
    svg.innerHTML = svgContent;

    legend.innerHTML = top.map(([lang, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = LANG_COLORS[lang] || LANG_COLORS.Other;
        return `<li><span class="swatch" style="background:${color}"></span>
            ${lang}<span class="pct">${pct}%</span></li>`;
    }).join('');
}

/* ============ Contribution heatmap ============ */
async function loadHeatmap() {
    const container = document.getElementById('heatmap');
    const totalEl = document.getElementById('heatmap-total');
    if (!container) return;

    container.innerHTML = '<span class="hm-loading">Loading contributions…</span>';

    try {
        const data = await fetchJSON(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`);
        const days = data.contributions;

        // Pad so the grid starts on Sunday, matching GitHub's layout
        const firstDay = new Date(days[0].date + 'T00:00:00').getDay();
        const cells = [];
        for (let i = 0; i < firstDay; i++) cells.push('<span class="hm-cell" style="visibility:hidden"></span>');
        days.forEach(d => {
            cells.push(`<span class="hm-cell" data-level="${d.level}" title="${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}"></span>`);
        });

        container.innerHTML = cells.join('');
        totalEl.textContent = `${data.total.lastYear.toLocaleString()} contributions in the last year`;
        setStat('stat-contribs', data.total.lastYear);

        // Scroll to the most recent weeks on small screens
        const scroller = container.parentElement;
        scroller.scrollLeft = scroller.scrollWidth;
    } catch (err) {
        console.warn('Contribution API unavailable:', err.message);
        container.innerHTML = '<span class="hm-loading">Contribution graph unavailable right now — see it on <a href="https://github.com/rakibulx33" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">GitHub</a>.</span>';
        totalEl.textContent = `${FALLBACK.contributionsLastYear}+ contributions in the last year`;
    }
}

/* ============ Project cards ============ */
function renderProjects(repos) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const repoMap = Object.fromEntries(repos.map(r => [r.name, r]));

    grid.innerHTML = FEATURED_PROJECTS.map(p => {
        const live = repoMap[p.repo];
        const stars = live ? live.stargazers_count : 0;
        const forks = live ? live.forks_count : 0;
        const lang = live ? live.language : null;
        const url = `https://github.com/${GH_USER}/${p.repo}`;

        return `<article class="project-card glass-card tilt-card reveal">
            <div class="project-top">
                <div class="project-icon"><i class="fas ${p.icon}" aria-hidden="true"></i></div>
                <div class="project-meta">
                    ${lang ? `<span><i class="fas fa-circle" style="color:${LANG_COLORS[lang] || LANG_COLORS.Other};font-size:0.6rem"></i>${lang}</span>` : ''}
                    <span><i class="fas fa-star" aria-hidden="true"></i>${stars}</span>
                    <span><i class="fas fa-code-fork" aria-hidden="true"></i>${forks}</span>
                </div>
            </div>
            <h3>${p.title}</h3>
            <p>${p.desc}</p>
            <div class="project-tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            <div class="project-links">
                <a href="${url}" target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-github" aria-hidden="true"></i> View Source
                </a>
            </div>
        </article>`;
    }).join('');

    observeReveals(grid);
    initTilt(grid);
}

/* ============ 3D tilt on cards ============ */
function initTilt(root = document) {
    if (REDUCED_MOTION || !window.matchMedia('(hover: hover)').matches) return;

    root.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* ============ Init ============ */
initTilt();
loadGitHubData();
loadHeatmap();
