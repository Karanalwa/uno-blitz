# UNO Blitz - Project Handoff Document

> **Status (updated): Backend is LIVE.** The Railway 502 crash loop and the
> multiplayer WebSocket connection are both fixed. Solo and multiplayer play work.
> See "Recent Fixes" below for what changed.

## 1. What We Built

**UNO Blitz** is a multiplayer UNO card game built as a fullstack web application.

### Features:
- **Solo Play** - Play against 1-5 AI bot opponents (fully working)
- **Multiplayer** - Create/join rooms with 6-digit codes, real-time gameplay via WebSocket (working)
- **Full UNO Rules** - Skip, Reverse, Draw 2, Wild, Wild Draw 4, UNO catch mechanic
- **Animated UI** - Card hover animations, play effects, color picker for Wild cards
- **Sound Effects** - Web Audio API synthesized sounds (card snap, draw, UNO chime, victory)
- **Responsive** - Works on mobile and desktop
- **8 AI-Generated Avatars** - Robot, Cat, Alien, Ninja, Pirate, Astronaut, Dragon, Unicorn

---

## 2. Architecture

### Frontend (Vercel - LIVE)
- **URL:** https://uno-blitz.vercel.app
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion
- **State:** Zustand (client-side game store)
- **Routing:** React Router v7
- **Build Output:** `dist/public/`
- **Backend endpoints:** centralized in `src/config.ts` (points at the Railway origin in
  production, localhost in dev). Override with the `VITE_BACKEND_HOST` build env var.

### Backend (Railway - LIVE)
- **URL:** https://uno-blitz-production.up.railway.app
- **Stack:** Hono + tRPC + Drizzle ORM + MySQL
- **WebSocket:** `ws` library on path `/ws`
- **Game Engine:** Server-authoritative in-memory state management
- **Deploy:** Docker (`Dockerfile` + `railway.json`), runs compiled `node dist/boot.js`
- **Health check:** `GET /health` → `{"status":"ok"}`

### Database (MySQL)
- **Tables:** users, user_stats, leaderboard, match_history, match_players
- **Connection:** Via DATABASE_URL env var
- **NOTE:** The current DATABASE_URL uses an Alibaba `...privatelink.aliyuncs.com` host,
  which only resolves *inside* Alibaba Cloud's VPC and is unreachable from Railway. So
  auth and stats (which need MySQL) will not work until DATABASE_URL points at a publicly
  reachable endpoint. **Gameplay does not need the DB** — rooms are in-memory — so solo and
  multiplayer work without it.

---

## 3. What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| Frontend UI | ✅ LIVE | Title screen, modals, game board |
| Solo Play (vs AI bots) | ✅ WORKING | Full game with smart AI opponents |
| Card Rendering | ✅ WORKING | All 4 colors + Wild cards with animations |
| Sound Effects | ✅ WORKING | Card snap, draw, UNO, Wild, victory sounds |
| Game Logic Engine | ✅ WORKING | Full UNO rules implemented server-side |
| AI Bot Strategy | ✅ WORKING | Prioritizes action cards, saves wilds |
| WebSocket Server | ✅ WORKING | Attaches to HTTP server on `/ws` |
| Multiplayer Rooms | ✅ WORKING | Create/join via 6-digit code, real-time sync |
| Health Check | ✅ WORKING | `GET /` and `GET /health` |
| Auth + Leaderboard | ⚠️ BLOCKED | Needs a reachable DATABASE_URL (see DB note) |

---

## 4. Recent Fixes (what unblocked the backend)

### Fix #1: Railway 502 crash loop
The container started, logged that it was listening, then got killed and restarted. Causes
and fixes:
- **Ran TypeScript via `tsx` in production** (`npx tsx api/boot.ts`) — high memory / slow
  cold start. Now compiles to a self-contained `dist/boot.js` and runs with `node`.
- **esbuild bundled `ws`** without externalizing its optional native addons. The build now
  passes `--external:bufferutil --external:utf-8-validate`.
- **No deterministic deploy config.** Added a multi-stage `Dockerfile` + `railway.json`
  (pins builder, start command, `/health` healthcheck, restart policy).
- **No global error handlers.** Added `unhandledRejection` / `uncaughtException` handlers so
  a single stray rejection can no longer kill the process.

### Fix #2: Multiplayer WebSocket connected to the wrong host
`src/store/gameStore.ts` built the WS URL from `window.location.host`, so on Vercel it tried
`wss://uno-blitz.vercel.app/ws` (no backend there). All backend URLs are now centralized in
`src/config.ts` and point at the Railway origin in production. The duplicate, unused
`src/hooks/useWebSocket.ts` was deleted.

### Fix #3: Railway port routing
The app listens on `process.env.PORT`; the public domain's **Target Port** must match it.
Pin both to the same value (e.g. set a `PORT` variable and the domain Target Port to 8080)
so they don't drift on redeploy.

---

## 5. Environment Variables (Railway)

```
APP_ID=...
APP_SECRET=...
DATABASE_URL=mysql://...        # must be a publicly reachable host for auth/stats
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
NODE_ENV=production
OWNER_UNION_ID=...
VITE_APP_ID=...
VITE_KIMI_AUTH_URL=https://auth.kimi.com
PORT=8080                       # keep in sync with the domain Target Port
CORS_ORIGIN=https://uno-blitz.vercel.app   # optional; defaults already include the Vercel app
```

Frontend (Vercel) optional override:
```
VITE_BACKEND_HOST=uno-blitz-production.up.railway.app
```

---

## 6. File Structure (key files)

```
app/
├── Dockerfile                  # NEW - deterministic Railway build/runtime
├── railway.json                # NEW - builder, start cmd, healthcheck, restart policy
├── api/
│   ├── boot.ts                 # Server entry: health checks, CORS, static, WS, error handlers
│   ├── game/
│   │   ├── uno-engine.ts       # UNO game logic
│   │   ├── room-manager.ts     # Room creation/joining/state (in-memory)
│   │   └── ws-server.ts        # WebSocket server (path /ws)
│   ├── router.ts / room-router.ts / auth-router.ts
│   └── queries/connection.ts   # Lazy MySQL (drizzle) connection
├── db/schema.ts                # MySQL schema
├── src/
│   ├── config.ts               # NEW - single source of truth for backend URLs
│   ├── store/gameStore.ts      # Zustand store + multiplayer WS client
│   ├── hooks/useMultiplayer.ts # Connects via the store
│   ├── providers/trpc.tsx      # tRPC client (uses config.ts)
│   └── pages/ (Home, Lobby, Game)
└── package.json                # build:server bundles backend; start runs node dist/boot.js
```

---

## 7. Git Repository
- **URL:** https://github.com/Karanalwa/uno-blitz
- **Main branch:** `main` (Vercel auto-deploys frontend; Railway auto-deploys backend)

---

## 8. Build & Run

```bash
npm install
npm run build        # vite build (dist/public) + esbuild bundle (dist/boot.js)
node dist/boot.js    # -> "[Server] Listening on http://0.0.0.0:<PORT>/"
curl localhost:3000/health   # -> {"status":"ok"}
```

---

## 9. Remaining Work
1. **Database:** point `DATABASE_URL` at a publicly reachable MySQL host to enable auth and
   the leaderboard. Run `npm run db:push` to sync the schema.
2. **Port stability:** keep the `PORT` variable and the Railway domain Target Port in sync.

---

*Document created: June 6, 2026*
*Last updated: After backend went live (502 + WebSocket + port fixes)*
