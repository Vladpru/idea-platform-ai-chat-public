const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.test') });

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const STATE_FILE = path.join(__dirname, '../.auth-state.json');

const FIXED_USERS = [
  { email: 'qa-user1@qa-test.dev', password: 'Test@12345', firstName: 'QA', lastName: 'UserOne' },
  { email: 'qa-user2@qa-test.dev', password: 'Test@12345', firstName: 'QA', lastName: 'UserTwo' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(endpoint, body, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const wait = attempt * 10000;
      console.log(`  429 rate-limit on ${endpoint}, retrying in ${wait / 1000}s (attempt ${attempt}/${retries})…`);
      await sleep(wait);
      continue;
    }
    return { status: res.status, body: data, headers: Object.fromEntries(res.headers.entries()) };
  }
  throw new Error(`${endpoint} still rate-limited after ${retries} retries`);
}

module.exports = async function globalSetup() {
  console.log(`\nGlobal setup → ${BASE_URL}`);
  const state = {};

  for (const user of FIXED_USERS) {
    const reg = await post('/auth/register', user);
    if (reg.status !== 201 && reg.status !== 409) {
      throw new Error(`Register ${user.email} failed ${reg.status}: ${JSON.stringify(reg.body)}`);
    }

    const login = await post('/auth/login', { email: user.email, password: user.password });
    if (login.status < 200 || login.status > 299) {
      throw new Error(`Login ${user.email} failed ${login.status}: ${JSON.stringify(login.body)}`);
    }

    state[user.email] = {
      token: login.body.accessToken,
      refreshCookie: login.headers['set-cookie'] || '',
      email: user.email,
      password: user.password,
    };
    console.log(`  ✓ ${user.email}`);
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('Global setup done\n');
};