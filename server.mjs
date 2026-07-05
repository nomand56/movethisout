/**
 * Production static server for Railway (and other PaaS).
 * Serves Vite build output with SPA fallback + security headers.
 */
import { createServer } from 'http'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, extname, normalize } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, 'dist')
const PORT = Number(process.env.PORT) || 3000

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self)')
}

function send(res, status, body, contentType, cacheControl) {
  securityHeaders(res)
  res.statusCode = status
  if (contentType) res.setHeader('Content-Type', contentType)
  if (cacheControl) res.setHeader('Cache-Control', cacheControl)
  res.end(body)
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const file = join(DIST, normalized)
  if (!file.startsWith(DIST)) return null
  return file
}

function serveFile(res, filePath) {
  const ext = extname(filePath)
  const type = MIME_TYPES[ext] ?? 'application/octet-stream'
  const isHashedAsset = /-[a-zA-Z0-9]{8,}\.(js|css)$/.test(filePath)
  const cache = isHashedAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate'
  const body = readFileSync(filePath)
  send(res, 200, body, type, cache)
}

createServer((req, res) => {
  const url = req.url ?? '/'

  if (url === '/health' || url === '/healthz') {
    return send(res, 200, 'ok', 'text/plain', 'no-store')
  }

  let filePath = safePath(url === '/' ? '/index.html' : url)

  if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
    return serveFile(res, filePath)
  }

  const indexPath = join(DIST, 'index.html')
  if (existsSync(indexPath)) {
    return serveFile(res, indexPath)
  }

  send(res, 503, 'App not built. Run npm run build first.', 'text/plain', 'no-store')
}).listen(PORT, '0.0.0.0', () => {
  console.log(`MoveThisOut listening on 0.0.0.0:${PORT}`)
})
