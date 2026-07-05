/**
 * Ensures required VITE_* env vars exist on Railway/CI builds.
 * Local dev can rely on .env file (Vite loads it before this script runs in build).
 */
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID)
const isCi = Boolean(process.env.CI)

if (!isRailway && !isCi) {
  process.exit(0)
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const recommended = ['VITE_GOOGLE_MAPS_KEY']

const missing = required.filter((k) => !process.env[k]?.trim())
if (missing.length) {
  console.error('\n❌ Railway build failed: missing environment variables:\n')
  for (const key of missing) console.error(`   - ${key}`)
  console.error('\nAdd them in Railway → your service → Variables, then redeploy.\n')
  process.exit(1)
}

const missingRec = recommended.filter((k) => !process.env[k]?.trim())
if (missingRec.length) {
  console.warn('\n⚠️  Optional variables not set (app will have limited features):')
  for (const key of missingRec) console.warn(`   - ${key}`)
}

console.log('✓ Build environment OK')
