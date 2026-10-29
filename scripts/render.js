'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

const THEMES = {
  dark:  { text: '#e6edf3', muted: '#8b949e', dim: '#6e7681', line: '#30363d' },
  light: { text: '#1f2328', muted: '#59636e', dim: '#818b98', line: '#d1d9e0' }
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function shell(w, h, body, aria) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(aria)}">\n${body}\n</svg>\n`;
}

function label(t, text) {
  return `<text x="0" y="16" font-family="${MONO}" font-size="11.5" letter-spacing="2.4" fill="${t.muted}">${esc(text.toUpperCase())}</text>`;
}

function header(t) {
  let b = '';
  b += `<text x="0" y="66" font-family="${SANS}" font-size="58" font-weight="650" letter-spacing="-2.2" fill="${t.text}">${esc(cfg.name)}</text>`;
  b += `<text x="0" y="100" font-family="${SANS}" font-size="19" fill="${t.muted}">${esc(cfg.tagline)} · ${esc(cfg.location)}</text>`;
  b += `<text x="1000" y="64" text-anchor="end" font-family="${MONO}" font-size="13" fill="${t.dim}">${esc(cfg.handle)}</text>`;
  b += `<text x="0" y="146" font-family="${MONO}" font-size="13" letter-spacing="0.6" fill="${t.dim}">$ whoami --verbose</text>`;
  b += `<text x="0" y="172" font-family="${MONO}" font-size="14" fill="${t.muted}">→ building agent tools, context infrastructure, and small sharp utilities</text>`;
  b += `<line x1="0" y1="200" x2="1000" y2="200" stroke="${t.line}" stroke-width="1"/>`;
  return shell(1000, 212, b, `${cfg.name} — ${cfg.login}`);
}

function whoami(t) {
  const lines = cfg.whoami;
  const h = 58 + lines.length * 26 + 18;
  let b = label(t, '01 — whoami');
  b += `<line x1="0" y1="30" x2="1000" y2="30" stroke="${t.line}"/>`;
  lines.forEach((l, i) => {
    b += `<text x="0" y="${62 + i * 26}" font-family="${MONO}" font-size="14.5" fill="${i === 0 ? t.text : t.muted}">${esc(l)}</text>`;
  });
  return shell(1000, h, b, '01 — whoami');
}

function ecosystem(t) {
  const h = 58 + 3 * 44 + 20;
  let b = label(t, '02 — system map');
  b += `<line x1="0" y1="30" x2="1000" y2="30" stroke="${t.line}"/>`;
  const cols = [[0, cfg.ecosystem.left], [510, cfg.ecosystem.right]];
  for (const [x0, list] of cols) {
    list.forEach(([k, v], i) => {
      const y = 64 + i * 44;
      b += `<text x="${x0}" y="${y}" font-family="${MONO}" font-size="11" letter-spacing="1.4" fill="${t.dim}">${esc(k.toUpperCase())}</text>`;
      b += `<text x="${x0}" y="${y + 20}" font-family="${MONO}" font-size="13.5" fill="${t.text}">${esc(v)}</text>`;
    });
  }
  return shell(1000, h, b, '02 — system map');
}

function projectsHead(t) {
  let b = label(t, '03 — projects');
  b += `<line x1="0" y1="30" x2="1000" y2="30" stroke="${t.line}"/>`;
  b += `<text x="0" y="62" font-family="${SANS}" font-size="15" fill="${t.muted}">${esc(cfg.projectsNote)}</text>`;
  return shell(1000, 92, b, '03 — projects');
}

function wrapText(s, max) {
  const words = String(s || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function card(t, repo) {
  const w = 490;
  const h = 172;
  const desc = wrapText(repo.description || '', 56).slice(0, 3);
  let b = '';
  b += `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="none" stroke="${t.line}"/>`;
  b += `<text x="26" y="46" font-family="${MONO}" font-size="19" font-weight="600" fill="${t.text}">${esc(repo.name)}</text>`;
  b += `<text x="${w - 26}" y="46" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.dim}">↗</text>`;
  desc.forEach((l, i) => {
    b += `<text x="26" y="${76 + i * 21}" font-family="${SANS}" font-size="13.5" fill="${t.muted}">${esc(l)}</text>`;
  });
  const yb = h - 24;
  b += `<circle cx="31" cy="${yb - 4}" r="4.5" fill="${t.text}" fill-opacity="0.85"/>`;
  b += `<text x="44" y="${yb}" font-family="${MONO}" font-size="12" fill="${t.muted}">${esc(repo.language || '—')}</text>`;
  b += `<text x="150" y="${yb}" font-family="${MONO}" font-size="12" fill="${t.muted}">★ ${repo.stars}</text>`;
  b += `<text x="240" y="${yb}" font-family="${MONO}" font-size="12" fill="${t.muted}">forks ${repo.forks}</text>`;
  return shell(w, h, b, repo.name);
}

function telemetry(t, d) {
  const langs = (d.languages || []).slice(0, 6);
  const h = 168 + langs.length * 24 + 16;
  let b = label(t, '04 — telemetry');
  b += `<line x1="0" y1="30" x2="1000" y2="30" stroke="${t.line}"/>`;
  const stats = [
    ['public repos', d.publicRepos],
    ['originals', d.ownRepos],
    ['total stars', d.totalStars],
    ['followers', d.followers]
  ];
  stats.forEach(([k, v], i) => {
    const x = i * 250;
    b += `<text x="${x}" y="88" font-family="${SANS}" font-size="38" font-weight="600" fill="${t.text}">${esc(v)}</text>`;
    b += `<text x="${x}" y="110" font-family="${MONO}" font-size="10.5" letter-spacing="1.8" fill="${t.dim}">${esc(k.toUpperCase())}</text>`;
  });
  b += `<line x1="0" y1="138" x2="1000" y2="138" stroke="${t.line}" stroke-opacity="0.6"/>`;
  const max = Math.max(...langs.map((l) => l.count), 1);
  langs.forEach((l, i) => {
    const y = 170 + i * 24;
    const bw = Math.round((l.count / max) * 640);
    b += `<text x="0" y="${y}" font-family="${MONO}" font-size="12" fill="${t.muted}">${esc(l.name)}</text>`;
    b += `<rect x="150" y="${y - 10}" width="640" height="10" rx="5" fill="${t.line}" fill-opacity="0.45"/>`;
    b += `<rect x="150" y="${y - 10}" width="${bw}" height="10" rx="5" fill="${t.text}" fill-opacity="0.85"/>`;
    b += `<text x="806" y="${y}" font-family="${MONO}" font-size="12" fill="${t.dim}">${l.count}</text>`;
  });
  return shell(1000, h, b, '04 — telemetry');
}

function contrib(t, d) {
  const c = d.contrib || { total: 0, weeks: [] };
  const weeks = (c.weeks || []).filter((w) => Array.isArray(w) && w.length);
  const pitch = weeks.length ? Math.min(19, Math.floor(1000 / weeks.length)) : 19;
  const cell = Math.max(8, pitch - 4);
  const top = 78;
  const h = top + 7 * pitch + 44;
  let b = label(t, '05 — contribution telemetry');
  b += `<line x1="0" y1="30" x2="1000" y2="30" stroke="${t.line}"/>`;
  b += `<text x="1000" y="16" text-anchor="end" font-family="${MONO}" font-size="11.5" fill="${t.dim}">${c.total} contributions · last 12 months</text>`;

  const max = Math.max(1, ...weeks.flat().map((x) => x.count || 0));
  const levels = [0, 0.2, 0.4, 0.65, 0.95];

  let lastMonth = -1;
  let lastLabelX = -100;
  weeks.forEach((week, wi) => {
    const first = week.find((x) => x && x.date);
    if (first) {
      const m = new Date(first.date + 'T00:00:00Z').getUTCMonth();
      if (m !== lastMonth) {
        const x = wi * pitch;
        if (wi === 0 || x - lastLabelX > 40) {
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          b += `<text x="${x}" y="60" font-family="${MONO}" font-size="10.5" letter-spacing="1" fill="${t.dim}">${months[m]}</text>`;
          lastLabelX = x;
        }
        lastMonth = m;
      }
    }
    week.forEach((day) => {
      if (!day || typeof day.weekday !== 'number') return;
      const x = wi * pitch;
      const y = top + day.weekday * pitch;
      const ratio = (day.count || 0) / max;
      const lvl = day.count === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      if (lvl === 0) {
        b += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${t.line}" fill-opacity="0.55"/>`;
      } else {
        b += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${t.text}" fill-opacity="${levels[lvl]}"/>`;
      }
    });
  });

  const ly = top + 7 * pitch + 18;
  b += `<text x="1000" y="${ly}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${t.dim}">less</text>`;
  for (let i = 0; i < 5; i++) {
    const x = 1000 - 210 + i * 18;
    const op = levels[i];
    if (i === 0) {
      b += `<rect x="${x}" y="${ly - 10}" width="${cell - 1}" height="${cell - 1}" rx="3" fill="${t.line}" fill-opacity="0.55"/>`;
    } else {
      b += `<rect x="${x}" y="${ly - 10}" width="${cell - 1}" height="${cell - 1}" rx="3" fill="${t.text}" fill-opacity="${op}"/>`;
    }
  }
  b += `<text x="1000" y="${ly}" text-anchor="end" font-family="${MONO}" font-size="10.5" fill="${t.dim}" opacity="0">.</text>`;
  b += `<text x="${1000 - 118}" y="${ly}" font-family="${MONO}" font-size="10.5" fill="${t.dim}">more</text>`;
  return shell(1000, h, b, '05 — contribution telemetry');
}

function footer(t) {
  let b = `<line x1="0" y1="1" x2="1000" y2="1" stroke="${t.line}"/>`;
  b += `<text x="0" y="34" font-family="${MONO}" font-size="12.5" fill="${t.muted}">open to collaboration · ${esc(cfg.location)}</text>`;
  b += `<text x="0" y="58" font-family="${MONO}" font-size="12.5" fill="${t.dim}">github.com/${esc(cfg.login)} · ${esc(cfg.website.replace(/^https?:\/\//, ''))}</text>`;
  b += `<text x="1000" y="34" text-anchor="end" font-family="${MONO}" font-size="12.5" fill="${t.dim}">EOF</text>`;
  return shell(1000, 84, b, 'footer');
}

const out = path.join(ROOT, 'assets');
fs.mkdirSync(out, { recursive: true });

const featured = (data.featured || []).filter(Boolean);

for (const [name, t] of Object.entries(THEMES)) {
  const files = {
    [`header-${name}.svg`]: header(t),
    [`whoami-${name}.svg`]: whoami(t),
    [`ecosystem-${name}.svg`]: ecosystem(t),
    [`projects-${name}.svg`]: projectsHead(t),
    [`telemetry-${name}.svg`]: telemetry(t, data),
    [`contrib-${name}.svg`]: contrib(t, data),
    [`footer-${name}.svg`]: footer(t)
  };
  for (const repo of featured) {
    files[`proj-${repo.name}-${name}.svg`] = card(t, repo);
  }
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(out, file), content);
  }
}

console.log(`wrote ${fs.readdirSync(out).length} svg files to assets/`);