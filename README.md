# HorrorModSite - Your own mod distribution (Node + Next)
No community backends - fully your own.

## Structure
- backend/ - Fastify Node API, local storage now, R2 CDN ready for worldwide
- frontend/ - Next.js React, free on Vercel, shows free download + Pix/PayPal voluntary donations

## Local run
1. Backend:
   cd backend
   npm install
   cp .env.example .env  # edit PIX_KEY etc
   npm run dev  -> http://localhost:3001

2. Frontend:
   cd frontend
   npm install
   npm run dev  -> http://localhost:3000

## Deploy free
- Backend: Render Free / Fly.io / Railway - set env vars PIX_KEY, PIX_NAME, PAYPAL_URL, ADMIN_TOKEN, STORAGE_TYPE
- For worldwide CDN: create Cloudflare R2 free bucket, set STORAGE_TYPE=r2 and CDN_BASE_URL
- Frontend: Vercel free - set NEXT_PUBLIC_API_URL to backend URL

## Admin upload
POST /api/admin/mods/:slug/upload?token=ADMIN_TOKEN
multipart: file (.jar), version, mcVersion, loader, changelog

## EULA compliant
Mods are FREE, donations voluntary via Pix/PayPal links only.
