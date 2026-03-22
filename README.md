# 🎮 Chaos Arena — YouTube Live Chat Game

A browser game that reacts to YouTube Live Chat comments in real-time.
Built for YouTube Shorts livestreams via OBS.

---

## 🧠 The Game

**Chaos Arena** — You pilot a 🚀 rocket dodging falling emoji enemies.
Your VIEWERS control chaos via chat:

| Comment   | Effect |
|-----------|--------|
| `explode` | 💥 Destroys all enemies on screen |
| `freeze`  | ❄️ Freezes all enemies for 5 seconds |
| `boss`    | 👾 Spawns a giant boss enemy |
| `shield`  | 🛡️ Gives the player a 10s shield |
| `rain`    | 🌧️ Spawns a meteor shower |
| `heal`    | 💚 Heals player by 1 life |
| `chaos`   | 🌀 Boss + meteor rain at the same time |

---

## 🚀 Setup in 3 Steps

### Step 1 — Get a YouTube API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **YouTube Data API v3**
3. Create credentials → **API Key**
4. Copy the key

### Step 2 — Deploy the Server (free)

**Option A: Railway (easiest)**
1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables:
   - `YT_API_KEY` = your YouTube API key
   - `LIVE_VIDEO_ID` = your stream's video ID (from the URL `?v=XXXX`)
4. Copy your Railway URL (e.g. `chaos-arena.up.railway.app`)

**Option B: Render**
1. Same GitHub push
2. Go to [render.com](https://render.com) → New Web Service
3. Build command: `npm install`
4. Start command: `npm start`
5. Set the same env vars

### Step 3 — Connect Game to Server

In `game.html`, find this line near the bottom:
```js
const WS_URL = window.WS_URL || 'ws://localhost:3000';
```

Change it to your deployed server URL:
```js
const WS_URL = 'wss://your-app.up.railway.app';
```

Then in OBS:
- Add a **Browser Source**
- Set URL to `https://your-app.up.railway.app/game`
- Set width: **1080**, height: **1920** (for Shorts)
- ✅ Done! Start your stream

---

## 🧪 Local Testing (no YouTube needed)

```bash
npm install
npm start
```

Open `game.html` in browser (or `http://localhost:3000/game`).

The server runs in **demo mode** automatically — sends random commands every 5-8s so you can see the game work without a real stream.

To test your own commands manually, open browser console on the game page and run:
```js
COMMANDS.explode('TestUser')
COMMANDS.boss('TestUser')
```

---

## 📁 File Structure

```
chaos-arena/
├── game.html      ← The game (open in OBS browser source)
├── server.mjs     ← Node.js server (YouTube API + WebSocket)
├── package.json   ← Dependencies
└── README.md      ← This file
```

---

## 💡 Tips for Streaming

- Set OBS output to **1080x1920** (vertical for Shorts)
- Use **Browser Source** in OBS pointing to your server URL
- Pin a comment or title telling viewers the commands
- The game auto-restarts 5 seconds after game over
- Player moves with mouse — on stream you can just let it follow chat chaos!
