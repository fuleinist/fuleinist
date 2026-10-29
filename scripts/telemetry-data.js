'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const H = {
  Accept: 'application/vnd.github+json',
  'User-Agent': `${cfg.login}-telemetry`
};
if (token) H.Authorization = `Bearer ${token}`;

async function api(p) {
  const r = await fetch(`https://api.github.com${p}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status} ${await r.text()}`);
  return r.json();
}

async function graphql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json();
  if (j.errors) throw new Error(`graphql: ${JSON.stringify(j.errors)}`);
  return j.data;
}

(async () => {
  const user = await api(`/users/${cfg.login}`);

  let repos = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await api(`/users/${cfg.login}/repos?per_page=100&page=${page}&sort=pushed`);
    repos = repos.concat(batch);
    if (batch.length < 100) break;
  }

  const own = repos.filter((r) => !r.fork);

  const langCount = {};
  for (const r of own) {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  }
  const languages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const featured = cfg.featured
    .map((n) => repos.find((x) => x.name === n))
    .filter(Boolean)
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count,
      forks: r.forks_count
    }));

  let contrib = null;
  if (token) {
    const to = new Date();
    const from = new Date(to.getTime() - 365 * 864e5);
    const query = `query($login:String!,$from:DateTime!,$to:DateTime!){
      user(login:$login){
        contributionsCollection(from:$from,to:$to){
          contributionCalendar{
            totalContributions
            weeks{ contributionDays{ date contributionCount weekday } }
          }
        }
      }
    }`;
    const d = await graphql(query, {
      login: cfg.login,
      from: from.toISOString(),
      to: to.toISOString()
    });
    const cal = d.user.contributionsCollection.contributionCalendar;
    contrib = {
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) =>
        w.contributionDays.map((x) => ({
          date: x.date,
          count: x.contributionCount,
          weekday: x.weekday
        }))
      )
    };
  }

  const out = {
    login: cfg.login,
    fetchedAt: new Date().toISOString(),
    publicRepos: user.public_repos,
    ownRepos: own.length,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    totalForks: own.reduce((s, r) => s + r.forks_count, 0),
    followers: user.followers,
    languages,
    featured,
    contrib
  };

  fs.writeFileSync(path.join(ROOT, 'data.json'), JSON.stringify(out, null, 2) + '\n');
  console.log('wrote data.json', {
    originals: out.ownRepos,
    stars: out.totalStars,
    languages: languages.length,
    contributions: contrib ? contrib.total : null
  });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});