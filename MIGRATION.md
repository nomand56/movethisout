# MoveThisOut — Supabase migration guide

Your remote Supabase project must match the SQL files in `supabase/migrations/`. If migrations are missing, you will see errors like:

- `404` on `saved_addresses` or `notifications`
- `PGRST204` when inserting jobs (missing columns)
- Settings page crashes or empty referral credit
- `confirm-payment` CORS errors (function not deployed — booking no longer requires it)

## Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. Your project ref: **`idrjqczlvfvatgdwfxei`**

## One-time setup

```bash
cd "D:\New folder (3)\movethisout"

supabase login
supabase link --project-ref idrjqczlvfvatgdwfxei
```

## Apply all migrations

```bash
supabase db push
```

This runs every file in `supabase/migrations/` in order:

| File | What it adds |
|------|----------------|
| `0001_init.sql` | Core tables: profiles, jobs, movers, RLS |
| `0002_fix_mover_profiles_update_recursion.sql` | Mover profile policy fix |
| `0003_oauth_signup.sql` | OAuth signup support |
| `0004_sms_notifications.sql` | SMS opt-in on profiles |
| `0005_chat.sql` | In-job chat |
| `0006_referrals.sql` | `referral_code`, `account_credit` on profiles |
| `0007_peak_config.sql` | Peak pricing config |
| `0008_platform_features.sql` | `saved_addresses`, `notifications`, promos, `paid_at` |
| `0009_requester_confirm_booking.sql` | Draft → open without edge function |

## Deploy edge functions (optional)

Booking works **without** `confirm-payment` (jobs are created as `open` directly). Deploy functions for email receipts, promo counting, and mover workflows:

```bash
supabase functions deploy calculate-price confirm-payment claim-job complete-job notify-job-claimed notify-job-completed send-email send-push send-sms --project-ref idrjqczlvfvatgdwfxei
```

Set secrets:

```bash
supabase secrets set GOOGLE_MAPS_KEY=your_google_maps_key --project-ref idrjqczlvfvatgdwfxei
supabase secrets set PUBLIC_APP_URL=http://localhost:5173 --project-ref idrjqczlvfvatgdwfxei
```

## Local `.env`

```env
VITE_SUPABASE_URL=https://idrjqczlvfvatgdwfxei.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
VITE_VAPID_PUBLIC_KEY=your_vapid_key
```

No Stripe keys are required.

## Google Maps console setup

In [Google Cloud Console](https://console.cloud.google.com/):

1. Enable **Maps JavaScript API**
2. Enable **Places API**
3. Restrict the API key to your domains (`localhost`, production URL)

Address autocomplete warnings in dev are often from React Strict Mode double-mounting; they are harmless if addresses still work.

## Verify migrations applied

In Supabase Dashboard → **Table Editor**, confirm these exist:

- `saved_addresses`
- `notifications`
- `promo_codes`
- `profiles` columns: `referral_code`, `account_credit`
- `jobs` columns: `paid_at`, `payment_method`, `promo_code`

Or run in SQL Editor:

```sql
select column_name from information_schema.columns
where table_name = 'saved_addresses';
```

## After migrating

1. Hard-refresh the app: **Ctrl+Shift+R** on `http://localhost:5173`
2. Restart dev server: `npm run dev`
3. Test: Book → Confirm & book → job appears in Orders

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `saved_addresses` 404 | Run `supabase db push` (migration 0008) |
| `account_credit.toFixed` crash | Run migration 0006; app now defaults to `$0.00` if missing |
| `confirm-payment` CORS | Ignore if booking works; or deploy the function |
| Job insert `PGRST204` | Run migrations 0006 + 0008 |
| Address autocomplete empty | Check `VITE_GOOGLE_MAPS_KEY` and Places API enabled |
