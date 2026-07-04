# Run Supabase migrations against the linked project.
# Usage:
#   .\scripts\run-migrations.ps1 -AccessToken "sbp_..."
#   .\scripts\run-migrations.ps1 -DbPassword "your-db-password"
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."; .\scripts\run-migrations.ps1

param(
  [string]$AccessToken,
  [string]$DbPassword
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if ($AccessToken) {
  npx supabase login --token $AccessToken
}

if (-not $DbPassword -and $env:SUPABASE_DB_PASSWORD) {
  $DbPassword = $env:SUPABASE_DB_PASSWORD
}

$pushArgs = @("db", "push", "--linked", "--yes")
if ($DbPassword) {
  $pushArgs += @("--password", $DbPassword)
}

Write-Host "Pushing migrations to linked project..." -ForegroundColor Cyan
npx supabase @pushArgs

if ($LASTEXITCODE -eq 0) {
  Write-Host "Migrations applied successfully." -ForegroundColor Green
} else {
  Write-Host "Migration failed. If not logged in, run: npx supabase login" -ForegroundColor Red
  Write-Host "Or paste scripts/pending-migrations-safe.sql into Supabase SQL Editor." -ForegroundColor Yellow
  exit $LASTEXITCODE
}
