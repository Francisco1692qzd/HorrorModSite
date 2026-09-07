# Deploy Always-On Forever (Free) - Cloudflare Workers + R2

This backend NEVER SLEEPS - stays online until YOU delete it. Not like Render.

## 1. Push to GitHub (if not done)
```powershell
cd C:\Users\Francisco\Downloads\GameProjects\HorrorModSite
git add .
git commit -m "add always-on worker backend"
git push
```

## 2. Create Cloudflare account (free) + R2 bucket
1. dash.cloudflare.com -> R2 -> Create Bucket -> `horrormodsite-mods`
2. Keep defaults, free 10GB.

## 3. Deploy Worker backend
```powershell
cd worker
npm install
npx wrangler login
npx wrangler deploy
```
Get URL like `https://horrormodsite-backend.seu-subdominio.workers.dev`

Set secrets (your dad info, stays private):
```powershell
npx wrangler secret put PIX_KEY
npx wrangler secret put PIX_NAME
npx wrangler secret put PAYPAL_URL
npx wrangler secret put ADMIN_TOKEN
```

Test: https://horrormodsite-backend.seu-subdominio.workers.dev/api/health -> {"status":"ok","storage":"R2","alwaysOn":true}

## 4. Frontend -> Vercel
Same as before, but set:
NEXT_PUBLIC_API_URL = https://horrormodsite-backend.seu-subdominio.workers.dev

Vercel -> Import repo -> Root Directory = frontend -> add env var -> Deploy
Frontend stays forever too (Vercel never sleeps).

## 5. Upload .jar worldwide (same API, new URL)
```powershell
curl -X POST "https://horrormodsite-backend.seu-subdominio.workers.dev/api/admin/mods/the-whispering-void/upload?token=SEU_TOKEN" -F file=@seu-mod.jar -F version=1.0.1
```

Result: Backend + Frontend both stay forever, worldwide CDN, free, never sleep.
To take down: dash.cloudflare.com -> Workers -> Delete, Vercel -> Delete Project.
