# UNO Blitz — Railway 502 Fix Notes

## Root cause
The backend wasn't one bug — it was a fragile production setup that produced the
"server starts, then container is killed and restarted" loop:

1. **Production ran TypeScript through `tsx`** (`npx tsx api/boot.ts`). Re-transpiling
   at runtime uses much more memory and a slower cold start than running compiled JS —
   on a memory-constrained Railway instance this is what triggers the restart loop.
2. **The esbuild build bundled `ws` without externalizing its optional native addons**
   (`bufferutil`, `utf-8-validate`), so `npm run build` was fragile / could fail —
   the "esbuild can't bundle ws" symptom from the handoff.
3. **No deterministic deploy config** (no Dockerfile / `railway.json`). Railway fell
   back to Nixpacks + dashboard settings, so build/start commands drifted.
4. **No global error handlers.** In Node 22 a single unhandled promise rejection
   (e.g. a DB call to the unreachable host) terminates the process — feeding the loop.

## What changed
- **`package.json`** — `build` now compiles the server to a self-contained `dist/boot.js`
  via `build:server`, externalizing `bufferutil` / `utf-8-validate`. `start` now runs
  `node dist/boot.js` (compiled JS, low memory, deterministic) instead of `tsx`.
- **`api/boot.ts`** — added `unhandledRejection` / `uncaughtException` handlers that log
  but never crash; cwd-independent static-file resolution; graceful SIGTERM/SIGINT
  shutdown; and CORS for the Vercel→Railway cross-origin tRPC calls (with credentials).
- **`Dockerfile`** (new) — multi-stage build; runtime image is just Node + `dist/`
  (no node_modules needed because the server bundle is self-contained → small, fast).
- **`railway.json`** (new) — pins builder = Dockerfile, start command, `/health`
  healthcheck, and an `ON_FAILURE` restart policy.

## Verify locally
```bash
npm install
npm run build           # produces dist/public (frontend) + dist/boot.js (server)
node dist/boot.js       # should print "[Server] Listening on http://0.0.0.0:3000/"
curl localhost:3000/health   # -> {"status":"ok"}
```

> Note: I could not run `npm run build` inside the assistant sandbox — its package
> registry blocks `esbuild`'s binary download (403). All source changes were
> syntax-validated; run the three commands above on your machine to confirm the bundle.

## Deploy to Railway
1. Commit and push these files. Railway will detect the **Dockerfile** and use it.
2. Keep the existing env vars. `PORT` is provided by Railway automatically.
3. After deploy: `curl https://uno-blitz-production.up.railway.app/health` → `{"status":"ok"}`.

## Still to address (separate from the 502)
- **DATABASE_URL points to an Alibaba `...privatelink.aliyuncs.com` host.** That hostname
  only resolves *inside* Alibaba Cloud's VPC and is unreachable from Railway, so auth and
  stats (which use MySQL) will fail. Multiplayer itself does **not** need the DB — rooms
  are in-memory — so gameplay works without it. Use a public DB endpoint to enable auth/stats.
- If you later need the DB libraries at runtime and bundling misbehaves, switch the runtime
  Docker stage to also `COPY --from=build /app/node_modules ./node_modules`.
