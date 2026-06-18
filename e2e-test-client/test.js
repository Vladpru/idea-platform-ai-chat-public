/**
 * Manual end-to-end client for the realtime-edge service.
 *
 * Simulates the frontend flow against the edge + monolith + Redis bridge:
 *   1. generate a valid JWT (HS256, `id` claim — same as the monolith signs)
 *   2. connect to the /live-chat namespace over websocket with the token
 *   3. listen for room:join_approved / room:join_denied / message
 *   4. emit join_room  -> (edge -> edge:upstream -> monolith -> edge:downstream)
 *   5. emit send_message after a short delay -> broadcast comes back as `message`
 *
 * Required env (all three secrets MUST be identical):
 *   JWT_SECRET     - same value as backend/.env and realtime-edge/.env
 *   TEST_USER_ID   - a real user id in Postgres (so the monolith approves the join)
 *   TEST_ROOM_ID   - a live-chat room id that user can access
 * Optional: EDGE_URL (default ws://localhost:3002), SEND_DELAY_MS, EXIT_AFTER_MS
 *
 * Run:  JWT_SECRET=... TEST_USER_ID=... TEST_ROOM_ID=... node test.js
 *   (PowerShell: $env:JWT_SECRET="..."; ... ; node test.js)
 */

import { randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';
import { io } from 'socket.io-client';

const EDGE_URL = process.env.EDGE_URL ?? 'ws://localhost:3002';
const NAMESPACE = '/live-chat';
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-to-match-the-backend';
const USER_ID =
  process.env.TEST_USER_ID ?? '00000000-0000-0000-0000-000000000001';
const ROOM_ID =
  process.env.TEST_ROOM_ID ?? '00000000-0000-0000-0000-000000000002';
const SEND_DELAY_MS = Number(process.env.SEND_DELAY_MS ?? 2000);
const EXIT_AFTER_MS = Number(process.env.EXIT_AFTER_MS ?? 8000);

const ts = () => new Date().toISOString().slice(11, 23);
const log = (step, ...rest) => console.log(`[${ts()}] ${step}`, ...rest);

// 1. Generate a JWT the edge will accept (HS256, user id in the `id` claim).
const token = jwt.sign({ id: USER_ID }, JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '1h',
});
log('STEP 1  Generated JWT', `userId=${USER_ID} secretLen=${JWT_SECRET.length}`);

// 2. Connect to the /live-chat namespace, websocket-only, token in `auth`.
log('STEP 2  Connecting to', `${EDGE_URL}${NAMESPACE}`, '(websocket)…');
const socket = io(`${EDGE_URL}${NAMESPACE}`, {
  transports: ['websocket'],
  auth: { token },
  reconnection: false,
});

// 3. Listeners.
socket.on('connect', () => {
  log('STEP 3  Connected', `sid=${socket.id}`);
  // 4. Request to join the room (async authorization via the monolith).
  log('STEP 4  Emitting join_room', { roomId: ROOM_ID });
  socket.emit('join_room', { roomId: ROOM_ID });
});

socket.on('connection_ready', () =>
  log('        <- connection_ready (edge JWT auth OK)'),
);

socket.on('room:join_approved', data =>
  log('STEP 5  <- room:join_approved', data),
);

socket.on('room:join_denied', data =>
  log(
    'STEP 5  <- room:join_denied',
    data,
    '\n        (set TEST_USER_ID/TEST_ROOM_ID to real DB rows to get approved)',
  ),
);

socket.on('message', data => log('STEP 7  <- message (broadcast)', data));

socket.on('connect_error', err =>
  log('!! connect_error:', err.message, '\n   (often: JWT_SECRET mismatch or edge not running)'),
);
socket.on('disconnect', reason => log('-- disconnected:', reason));

// 6. After a short delay, send a message; it is persisted by the monolith and
//    broadcast back to the room (received above as `message`).
setTimeout(() => {
  if (!socket.connected) {
    log('STEP 6  skipped send_message (not connected)');
    return;
  }
  const payload = {
    roomId: ROOM_ID,
    content: 'Hello from the e2e test client 👋',
    clientMessageId: randomUUID(),
  };
  log('STEP 6  Emitting send_message', payload);
  socket.emit('send_message', payload);
}, SEND_DELAY_MS);

// Clean shutdown so the script terminates on its own.
setTimeout(() => {
  log('Done — closing connection.');
  socket.close();
  process.exit(0);
}, EXIT_AFTER_MS);
