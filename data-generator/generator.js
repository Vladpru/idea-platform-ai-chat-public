'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_URL = (process.env.API_URL || 'https://idea-platform-team-2-develop.onrender.com').replace(/\/+$/, '');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const PROGRESS_FILE = process.env.PROGRESS_FILE ? path.resolve(process.env.PROGRESS_FILE) : path.join(__dirname, '.generator-progress.json');
const WRITE_GAP_MS = Number(process.env.WRITE_GAP_MS || 2100);
const REGISTER_GAP_MS = Number(process.env.REGISTER_GAP_MS || 13_000);
const MAX_RETRIES = Number(process.env.MAX_RETRIES || 6);
const TOKEN_REFRESH_MS = Number(process.env.TOKEN_REFRESH_MS || 12 * 60 * 1000);
const onlyArg = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '');
const ONLY = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim())) : null;
const phaseEnabled = (name) => !ONLY || ONLY.has(name);

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const warn = (...a) => console.warn(...a);

function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((v) => v !== '')) rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows.map((r) => { const o = {}; header.forEach((h, i) => (o[h] = (r[i] ?? '').trim())); return o; });
}
function readData(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) { warn(`(missing ${file} — skipping)`); return []; }
  return parseCsv(fs.readFileSync(p, 'utf8'));
}
function splitRefs(s) { return s ? s.split('|').map((x) => x.trim()).filter(Boolean) : []; }

let progress = { done: {} };
if (fs.existsSync(PROGRESS_FILE)) {
  try { progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { progress = { done: {} }; }
}
let _dirty = 0;
function isDone(key) { return !!progress.done[key]; }
function markDone(key, value = true) {
  progress.done[key] = value;
  _dirty++;
  flushProgress();
}
function flushProgress() { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress)); }

// ---------------------------------------------------------------------------
// HTTP with retry/backoff (429 + Render cold-start 5xx)
// ---------------------------------------------------------------------------
async function api(method, endpoint, { token, json, form, isRegister = false } = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let bodyToSend;
  if (form) bodyToSend = form;            // FormData sets its own content-type
  else if (json !== undefined) { headers['Content-Type'] = 'application/json'; bodyToSend = JSON.stringify(json); }

  let attempt = 0;
  while (true) {
    attempt++;
    let res;
    try {
      res = await fetch(url, { method, headers, body: bodyToSend });
    } catch (err) {
      if (attempt > MAX_RETRIES) return { ok: false, status: 0, data: { message: String(err) } };
      const wait = Math.min(2000 * attempt, 10000);
      warn(`   ↻ network error (${err.code || err.message}); retry in ${wait}ms`);
      await sleep(wait); continue;
    }
    let data = null;
    const ct = res.headers.get('content-type') || '';
    data = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const ra = Number(res.headers.get('retry-after'));
      const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000
        : isRegister ? REGISTER_GAP_MS : Math.min(3000 * attempt * attempt, 60000);
      warn(`   ⏳ 429 on ${method} ${endpoint}; waiting ${Math.round(wait / 1000)}s (try ${attempt}/${MAX_RETRIES})`);
      await sleep(wait); continue;
    }
    if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt <= MAX_RETRIES) {
      const wait = Math.min(5000 * attempt, 30000);
      warn(`   ☕ ${res.status} (waking up) on ${method} ${endpoint}; retry in ${Math.round(wait / 1000)}s`);
      await sleep(wait); continue;
    }
    return { ok: res.ok, status: res.status, data };
  }
}
function summarize(d) {
  if (!d) return 'no body';
  if (typeof d === 'string') return d.slice(0, 140);
  if (d.errors) return JSON.stringify(d.errors).slice(0, 180);
  if (d.message) return JSON.stringify(d.message).slice(0, 180);
  return JSON.stringify(d).slice(0, 180);
}

// ---------------------------------------------------------------------------
// Runtime ref → server-id maps  (rebuilt fresh each run, except auth which we re-establish by logging in)
// ---------------------------------------------------------------------------
const auth = {};
const problemId = {};
const ideaId = {};
const commentId = {};

async function loginUser(email) {
  const a = auth[email];
  if (!a || !a.password) return false;
  const res = await api('POST', '/auth/login', { isRegister: true, json: { email, password: a.password } });
  if (res.ok && res.data?.accessToken) {
    a.token = res.data.accessToken;
    if (res.data.user?.id) a.id = res.data.user.id;
    a.issuedAt = Date.now();
    return true;
  }
  warn(`   ✗ re-login failed for ${email}: ${summarize(res.data)}`);
  return false;
}

async function apiAs(email, method, endpoint, opts = {}) {
  const a = auth[email];
  if (!a) return { ok: false, status: 0, data: { message: `no auth for ${email}` } };
  if (a.issuedAt && Date.now() - a.issuedAt > TOKEN_REFRESH_MS) {
    await loginUser(email);
  }
  let res = await api(method, endpoint, { ...opts, token: a.token });
  if (res.status === 401) {
    if (await loginUser(email)) {
      res = await api(method, endpoint, { ...opts, token: auth[email].token });
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------
async function phaseUsers(users) {
  log(`\n=== USERS (${users.length}) ===`);
  for (const u of users) {
    let token, id, created = false;
    const reg = await api('POST', '/auth/register', {
      isRegister: true,
      json: { email: u.email, firstName: u.firstName || undefined, lastName: u.lastName || undefined, password: u.password, avatarUrl: u.avatarUrl || undefined },
    });
    if (reg.ok && reg.data?.accessToken) {
      token = reg.data.accessToken; id = reg.data.user?.id; created = true;
      await sleep(REGISTER_GAP_MS); // respect 5/min
    } else {
      const login = await api('POST', '/auth/login', { isRegister: true, json: { email: u.email, password: u.password } });
      if (login.ok && login.data?.accessToken) { token = login.data.accessToken; id = login.data.user?.id; }
      else { warn(`   ✗ auth failed ${u.email}: ${summarize(reg.data)} / ${summarize(login.data)}`); continue; }
    }
    auth[u.email] = { token, id, password: u.password, issuedAt: Date.now() };
    log(`   ✓ ${created ? 'registered' : 'exists→login'} ${u.email}`);
    if (u.firstName || u.lastName) {
      await apiAs(u.email, 'PATCH', `/users/${id}`, { json: { firstName: u.firstName || undefined, lastName: u.lastName || undefined } });
      await sleep(WRITE_GAP_MS);
    }
    if (u.themePreference) {
      await apiAs(u.email, 'PATCH', '/users/me/theme', { json: { theme: u.themePreference } });
      await sleep(WRITE_GAP_MS);
    }
  }
}

async function phaseProblems(problems) {
  log(`\n=== PROBLEMS (${problems.length}) ===`);
  let ok = 0;
  for (const p of problems) {
    const a = auth[p.authorEmail];
    if (!a) { warn(`   ⚠ ${p.ref}: author not authed (${p.authorEmail})`); continue; }
    const key = `problem:${p.ref}`;
    if (isDone(key)) { problemId[p.ref] = progress.done[key]; ok++; continue; }
    const res = await apiAs(p.authorEmail, 'POST', '/problems', {
      json: {
        stage: p.stage || undefined,
        title: p.title, description: p.description,
        valueProposition: p.valueProposition || undefined,
        costBenefit: p.costBenefit || undefined,
        category: p.category || undefined,
        impact: p.impact || undefined,
        tagLabels: splitRefs(p.tagLabels),
        isPublished: true,
      },
    });
    if (res.ok && res.data?.id) { problemId[p.ref] = res.data.id; markDone(key, res.data.id); ok++; }
    else warn(`   ⚠ ${p.ref} failed (${res.status}): ${summarize(res.data)}`);
    await sleep(WRITE_GAP_MS);
  }
  log(`   created/known: ${ok}/${problems.length}`);
}

async function phaseIdeas(ideas) {
  log(`\n=== IDEAS (${ideas.length}) ===`);
  let ok = 0;
  for (const it of ideas) {
    const a = auth[it.authorEmail];
    if (!a) { warn(`   ⚠ ${it.ref}: author not authed`); continue; }
    const key = `idea:${it.ref}`;
    if (isDone(key)) { ideaId[it.ref] = progress.done[key]; ok++; continue; }
    const linkedIds = splitRefs(it.problemRefs).map((r) => problemId[r]).filter(Boolean);
    const res = await apiAs(it.authorEmail, 'POST', '/ideas', {
      json: {
        stage: it.stage || undefined,
        title: it.title, description: it.description,
        problemIds: linkedIds,
        tagLabels: splitRefs(it.tagLabels),
        isPublished: true,
      },
    });
    if (res.ok && res.data?.id) { ideaId[it.ref] = res.data.id; markDone(key, res.data.id); ok++; }
    else warn(`   ⚠ ${it.ref} failed (${res.status}): ${summarize(res.data)}`);
    await sleep(WRITE_GAP_MS);
  }
  log(`   created/known: ${ok}/${ideas.length}`);
}

async function phaseLikes(rows, refMap, endpointFor, label, refField) {
  log(`\n=== ${label} (${rows.length}) ===`);
  let ok = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const a = auth[r.userEmail];
    const targetId = refMap[r[refField]];
    if (!a || !targetId) { continue; }
    const key = `${label}:${r[refField]}:${r.userEmail}`;
    if (isDone(key)) { ok++; continue; }
    const res = await apiAs(r.userEmail, 'POST', endpointFor(targetId), {});
    if (res.ok) { markDone(key); ok++; }
    else warn(`   ⚠ ${label} ${r[refField]} by ${r.userEmail} (${res.status}): ${summarize(res.data)}`);
    await sleep(WRITE_GAP_MS);
  }
  log(`   applied/known: ${ok}/${rows.length}`);
}

async function phaseJoins(rows) {
  log(`\n=== IDEA MEMBERS / JOINS (${rows.length}) ===`);
  let ok = 0;
  for (const r of rows) {
    const a = auth[r.userEmail];
    const id = ideaId[r.ideaRef];
    if (!a || !id) continue;
    const key = `join:${r.ideaRef}:${r.userEmail}`;
    if (isDone(key)) { ok++; continue; }
    const res = await apiAs(r.userEmail, 'POST', `/ideas/${id}/join`, {});
    // 201 join ok; if already a member the API may 4xx — treat as done so reruns are quiet.
    if (res.ok || res.status === 409 || res.status === 400) { markDone(key); ok++; }
    else warn(`   ⚠ join ${r.ideaRef} by ${r.userEmail} (${res.status}): ${summarize(res.data)}`);
    await sleep(WRITE_GAP_MS);
  }
  log(`   joined/known: ${ok}/${rows.length}`);
}

async function phaseComments(rows) {
  log(`\n=== COMMENTS + REPLIES (${rows.length}) ===`);
  let ok = 0;
  for (const c of rows) {
    const a = auth[c.authorEmail];
    if (!a) continue;
    const targetId = c.targetType === 'idea' ? ideaId[c.targetRef] : problemId[c.targetRef];
    if (!targetId) continue;
    const key = `comment:${c.ref}`;
    if (isDone(key)) { commentId[c.ref] = progress.done[key]; ok++; continue; }
    let parentServerId;
    if (c.parentRef) {
      parentServerId = commentId[c.parentRef] || progress.done[`comment:${c.parentRef}`];
      if (!parentServerId) { warn(`   ⚠ ${c.ref}: parent ${c.parentRef} not created yet — skipping`); continue; }
    }
    const form = new FormData();
    form.append('content', c.content);
    if (parentServerId) form.append('parentId', parentServerId);
    const entity = c.targetType === 'idea' ? 'ideas' : 'problems';
    const res = await apiAs(c.authorEmail, 'POST', `/${entity}/${targetId}/comments`, { form });
    if (res.ok && res.data?.id) { commentId[c.ref] = res.data.id; markDone(key, res.data.id); ok++; }
    else warn(`   ⚠ comment ${c.ref} (${res.status}): ${summarize(res.data)}`);
    await sleep(WRITE_GAP_MS);
  }
  log(`   created/known: ${ok}/${rows.length}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log(`\n🌱 Idea Platform generator`);
  log(`   API:  ${API_URL}`);
  log(`   data: ${DATA_DIR}`);
  if (ONLY) log(`   phases: ${[...ONLY].join(', ')}`);
  log(`   (resumable — progress in ${path.basename(PROGRESS_FILE)})\n`);
  if (!fs.existsSync(DATA_DIR)) { console.error(`No data/ folder next to generator.js`); process.exit(1); }
  log('Checking API (a sleeping Render instance can take ~30–60s to wake)…');
  const probe = await api('GET', '/users');
  if (probe.status === 0) { console.error(`Cannot reach ${API_URL}.`); process.exit(1); }
  log(`API responded (HTTP ${probe.status}). Proceeding.`);
  const users = readData('users.csv');
  const problems = readData('problems.csv');
  const ideas = readData('ideas.csv');
  const ideaLikes = readData('idea_likes.csv');
  const problemLikes = readData('problem_likes.csv');
  const ideaMembers = readData('idea_members.csv');
  const comments = readData('comments.csv');
  const commentLikes = readData('comment_likes.csv');
  await phaseUsers(users);
  if (phaseEnabled('problems')) await phaseProblems(problems);
  else problems.forEach((p) => { const v = progress.done[`problem:${p.ref}`]; if (v) problemId[p.ref] = v; });
  if (phaseEnabled('ideas')) await phaseIdeas(ideas);
  else ideas.forEach((i) => { const v = progress.done[`idea:${i.ref}`]; if (v) ideaId[i.ref] = v; });
  if (phaseEnabled('idea_likes'))
    await phaseLikes(ideaLikes, ideaId, (id) => `/ideas/${id}/like`, 'idea_likes', 'ideaRef');
  if (phaseEnabled('problem_likes'))
    await phaseLikes(problemLikes, problemId, (id) => `/problems/${id}/like`, 'problem_likes', 'problemRef');
  if (phaseEnabled('idea_members')) await phaseJoins(ideaMembers);
  if (phaseEnabled('comments') || phaseEnabled('comment_likes')) {
    problems.forEach((p) => { const v = progress.done[`problem:${p.ref}`]; if (v) problemId[p.ref] = v; });
    ideas.forEach((i) => { const v = progress.done[`idea:${i.ref}`]; if (v) ideaId[i.ref] = v; });
    comments.forEach((c) => { const v = progress.done[`comment:${c.ref}`]; if (v) commentId[c.ref] = v; });
  }
  if (phaseEnabled('comments')) await phaseComments(comments);
  if (phaseEnabled('comment_likes'))
    await phaseLikes(commentLikes, commentId, (id) => `/comments/${id}/like`, 'comment_likes', 'commentRef');
  flushProgress();
  log(`\n────────────────────────────────────────────`);
  log('Done.');
  log(`Users:          ${users.length}`);
  log(`Problems known: ${Object.keys(problemId).length}/${problems.length}`);
  log(`Ideas known:    ${Object.keys(ideaId).length}/${ideas.length}`);
  log(`Comments known: ${Object.keys(commentId).length}/${comments.length}`);
  log(`Progress saved to ${path.basename(PROGRESS_FILE)} (delete it to re-create from scratch).`);
}

// Graceful Ctrl+C: save progress so a re-run resumes cleanly.
let _shuttingDown = false;
process.on('SIGINT', () => {
  if (_shuttingDown) process.exit(1);
  _shuttingDown = true;
  try { flushProgress(); } catch { }
  console.log('\n\nInterrupted — progress saved. Re-run `node generator.js` to continue where you left off.');
  process.exit(0);
});

main().catch((e) => { flushProgress(); console.error('\nFatal error:', e); process.exit(1); });