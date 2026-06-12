# Move This Out — Setup Guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase dashboard, open **SQL Editor** and run everything in `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Get a Google Maps API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project, enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Distance Matrix API**
3. Create an API key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. Restrict the key to your domain in production.

## 3. Configure environment variables

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 4. Configure Supabase Auth

In Supabase dashboard → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (dev) or your production URL
- Redirect URLs: add `http://localhost:3000/auth/callback`

## 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## App flow

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/signup` | Create account |
| `/login` | Log in |
| `/request/new` | Post a move request (with Google Maps autocomplete + effort score) |
| `/requests` | Browse open requests (volunteer view) |
| `/requests/[id]` | Request detail + effort estimate + accept button |
| `/job/[id]` | Job card — route info, contact, realtime chat, status updates |
| `/job/[id]/rate` | Rate the other person after completion |
| `/dashboard` | My requests + jobs I'm volunteering |

## Effort score

The effort score (0–100) is calculated from:
- Distance (km × 2, capped at 40 points)
- Duration (min × 0.5, capped at 20 points)
- Item size (small=0, medium=10, large=25, extra_large=40 points)

It's displayed as: Light / Moderate / Challenging / Heavy.
The "suggested effort value" ($) is informational only — not a charge.
