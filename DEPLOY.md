# Deploy MoveThisOut on Railway

The frontend is a **Vite React SPA** served by a small Node server (`server.mjs`).  
Supabase (database, auth, storage, edge functions) stays on [Supabase Cloud](https://supabase.com) — Railway only hosts the web app.

## 1. Push to GitHub

```bash
git add .
git commit -m "Prepare Railway deployment"
git push origin main
```

## 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repository
3. Railway reads `railway.toml` automatically:
   - **Build:** `npm run build`
   - **Start:** `npm start`
   - **Health:** `GET /health`

## 3. Set environment variables

In Railway → your service → **Variables**, add (copy from `.env.example`):

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API → anon key |
| `VITE_GOOGLE_MAPS_KEY` | Yes* | Browser-restricted Maps + Places key |
| `VITE_VAPID_PUBLIC_KEY` | No | Push notifications |

**Important:** `VITE_*` variables are embedded at **build time**. After changing them, trigger a **Redeploy**.

## 4. Generate public URL

Railway → service → **Settings** → **Networking** → **Generate Domain**  
You’ll get something like `https://movethisout-production.up.railway.app`

## 5. Configure Supabase Auth

Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://your-app.up.railway.app`
- **Redirect URLs:** add:
  - `https://your-app.up.railway.app/auth/callback`
  - `http://localhost:5173/auth/callback` (local dev)

## 6. Configure Google Maps

Google Cloud Console → your API key → **HTTP referrers**:

- `https://your-app.up.railway.app/*`
- `http://localhost:5173/*`

Enable **Maps JavaScript API** and **Places API**.

## 7. Run database migrations (one-time)

Railway does **not** run Supabase migrations. In Supabase SQL Editor, run `scripts/full-setup.sql`.  
See `MIGRATION.md` for details.

## 8. Deploy edge functions (optional)

From your machine (not Railway):

```bash
npx supabase login
npx supabase functions deploy calculate-price claim-job complete-job --project-ref YOUR_PROJECT_REF
```

Set function secrets in Supabase (e.g. `GOOGLE_MAPS_KEY`, `PUBLIC_APP_URL`).

## Verify

- `https://your-app.up.railway.app/health` → `ok`
- Homepage loads
- Login / book flow works

## Local production test

```bash
# use your real .env values
npm run build
npm start
# open http://localhost:3000
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails “missing environment variables” | Add `VITE_SUPABASE_*` in Railway Variables, redeploy |
| Blank page / “Missing Supabase” | Vars must exist **before** build |
| 404 on route refresh | Ensure `npm start` runs `server.mjs` (SPA fallback) |
| Google Maps empty | Add Railway domain to API key referrers |
| Auth redirect error | Add Railway URL to Supabase redirect URLs |
