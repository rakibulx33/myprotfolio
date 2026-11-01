// Fetches the last year of GitHub contributions into src/github.json, which the site bakes into the page.
// The deploy workflow runs this before every build and on a schedule, so the graph stays current without
// relying on a third-party API in the visitor's browser.
//
//   GITHUB_TOKEN set  -> GitHub's GraphQL API (what github.com shows on the profile)
//   no token          -> a public mirror of the same calendar
//   both fail         -> keep the existing file, so a local build or a GitHub outage never breaks the site
import { readFile, writeFile } from "node:fs/promises";

const LOGIN = "rakibulx33";
const OUT = new URL("../src/github.json", import.meta.url);
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function fromGraphQL(token) {
  const query = `query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } }
        totalCommitContributions totalPullRequestContributions totalIssueContributions
        totalPullRequestReviewContributions totalRepositoryContributions restrictedContributionsCount
      }
      repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "rakibulx33.me build" },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  const user = json.data.user;
  const c = user.contributionsCollection;
  return {
    source: "github",
    total: c.contributionCalendar.totalContributions,
    days: c.contributionCalendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0 })),
    breakdown: {
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
      repositories: c.totalRepositoryContributions,
      private: c.restrictedContributionsCount,
    },
    publicRepos: user.repositories.totalCount,
  };
}

async function fromMirror() {
  const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${LOGIN}?y=last`);
  if (!res.ok) throw new Error(`mirror HTTP ${res.status}`);
  const j = await res.json();
  if (!Array.isArray(j.contributions)) throw new Error("mirror returned no calendar");
  const total = typeof j.total === "object" ? Object.values(j.total).reduce((a, b) => a + b, 0) : j.total;
  return { source: "mirror", total, days: j.contributions.map((d) => ({ date: d.date, count: d.count, level: d.level })), breakdown: null, publicRepos: null };
}

let data;
const token = process.env.GITHUB_TOKEN;
for (const [name, get] of [["GraphQL", token ? () => fromGraphQL(token) : null], ["mirror", fromMirror]]) {
  if (!get) continue;
  try {
    data = await get();
    break;
  } catch (err) {
    console.warn(`fetch-github: ${name} failed: ${err.message}`);
  }
}

if (!data) {
  try {
    await readFile(OUT);
    console.warn("fetch-github: keeping the existing src/github.json");
    process.exit(0);
  } catch {
    console.error("fetch-github: no data and no existing file");
    process.exit(1);
  }
}

const today = new Date().toISOString().slice(0, 10);
data.days = data.days.filter((d) => d.date <= today);
await writeFile(OUT, JSON.stringify({ login: LOGIN, fetchedAt: new Date().toISOString(), ...data }) + "\n");
const active = data.days.filter((d) => d.count > 0).length;
console.log(`fetch-github: ${data.total} contributions, ${active} active days of ${data.days.length}, from ${data.source}`);
