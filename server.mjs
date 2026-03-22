// ─── Chaos Arena Server ────────────────────────────────────────────────────
// Polls YouTube Live Chat and broadcasts commands to the game via WebSocket
// Deploy on Railway, Render, or Fly.io (all free tier)

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────
const PORT          = process.env.PORT || 3000;
const YT_API_KEY    = process.env.YT_API_KEY    || '';   // YouTube Data API v3 key
const LIVE_VIDEO_ID = process.env.LIVE_VIDEO_ID || '';   // Your YouTube live stream video ID
const POLL_INTERVAL = 5000; // ms between chat polls

// Commands the game recognizes
const VALID_COMMANDS = new Set([
  'explode','freeze','boss','shield','rain','heal','chaos','left','right'
]);

// ─── HTTP server (serves game.html too) ────────────────────────────────────
const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/game') {
    try {
      const html = readFileSync(path.join(__dirname, 'game.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(404); res.end('game.html not found');
    }
  } else if (req.url === '/health') {
    res.writeHead(200); res.end('ok');
  } else {
    res.writeHead(404); res.end('not found');
  }
});

// ─── WebSocket server ──────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('[WS] client connected, total:', clients.size + 1);
  clients.add(ws);
  ws.on('close', () => { clients.delete(ws); });
  ws.on('error', () => { clients.delete(ws); });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ─── YouTube Live Chat Polling ─────────────────────────────────────────────
let liveChatId  = null;
let nextPageToken = null;
let polling = false;

async function getLiveChatId() {
  if (!YT_API_KEY || !LIVE_VIDEO_ID) {
    console.warn('[YT] No API key or video ID set. Running in demo mode.');
    return null;
  }
  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${LIVE_VIDEO_ID}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const details = data?.items?.[0]?.liveStreamingDetails;
  if (!details?.activeLiveChatId) {
    console.error('[YT] No active live chat found for video:', LIVE_VIDEO_ID);
    return null;
  }
  console.log('[YT] Got live chat ID:', details.activeLiveChatId);
  return details.activeLiveChatId;
}

async function pollChat() {
  if (!liveChatId) return;
  try {
    let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${YT_API_KEY}&maxResults=200`;
    if (nextPageToken) url += `&pageToken=${nextPageToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('[YT] API error:', data.error.message);
      return;
    }

    nextPageToken = data.nextPageToken;

    for (const item of (data.items || [])) {
      const author  = item.authorDetails?.displayName || 'User';
      const message = item.snippet?.displayMessage || '';
      const words   = message.toLowerCase().trim().split(/\s+/);

      // Check if any word in the message is a valid command
      for (const word of words) {
        if (VALID_COMMANDS.has(word)) {
          console.log(`[CMD] ${author}: ${word}`);
          broadcast({ author, command: word, message });
          break; // only trigger one command per message
        }
      }
      // Always broadcast the message for the chat overlay
      broadcast({ author, message, command: null });
    }
  } catch (err) {
    console.error('[YT] Poll error:', err.message);
  }
}

async function startPolling() {
  if (polling) return;
  polling = true;
  liveChatId = await getLiveChatId();
  setInterval(pollChat, POLL_INTERVAL);
  console.log('[YT] Polling started');
}

// ─── Demo mode (no YouTube API) ────────────────────────────────────────────
// Sends random commands every few seconds if no API key is set

// ─── Start ────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🎮 Chaos Arena server running on port ${PORT}`);
  if (YT_API_KEY && LIVE_VIDEO_ID) {
    startPolling();
  }
});
