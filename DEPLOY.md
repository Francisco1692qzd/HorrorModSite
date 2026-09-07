# Deploy HorrorModSite worldwide (free) - GitHub -> Vercel + Render

## 1. Push to GitHub
```powershell
cd C:\Users\Francisco\Downloads\GameProjects\HorrorModSite
git init
git add .
git commit -m "initial: horror mod site - own backend"
# create empty repo on github.com named HorrorModSite (do NOT init with README)
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/HorrorModSite.git
git push -u origin main
```

## 2. Backend -> Render (free, 24/7, no PC needed)
1. Go to render.com -> New -> Blueprint -> Connect your GitHub repo
2. It will read `render.yaml` automatically and create `horrormodsite-backend`
3. In Render dashboard -> Environment -> set:
   - PIX_KEY = sua chave pix
   - PIX_NAME = nome do seu pai
   - PAYPAL_URL = https://paypal.me/seulink
   - ADMIN_TOKEN = crie uma senha forte
   - STORAGE_TYPE = local (later switch to r2)
4. Deploy -> get URL like `https://horrormodsite-backend.onrender.com`
   Test: `https://...onrender.com/api/health` should return {"status":"ok"}

## 3. Frontend -> Vercel (free, worldwide CDN)
1. Go to vercel.com -> Add New Project -> Import HorrorModSite
2. IMPORTANT: Set Root Directory to `frontend`
3. Add Environment Variable:
   - NEXT_PUBLIC_API_URL = https://horrormodsite-backend.onrender.com
   (use your actual Render URL)
4. Deploy -> get URL like `https://horrormodsite.vercel.app` -> This is your public site for everyone

## 4. Worldwide fast .jar downloads (optional but recommended)
- Create free Cloudflare R2 bucket (10GB free) -> get public URL
- In Render, change STORAGE_TYPE=r2 and CDN_BASE_URL=https://your-bucket.r2.dev
- Frontend will then download jars via Cloudflare global CDN

## 5. How to publish new mod version worldwide
```powershell
curl -X POST "https://horrormodsite-backend.onrender.com/api/admin/mods/the-whispering-void/upload?token=SEU_ADMIN_TOKEN" -F file=@seu-mod.jar -F version=1.0.1 -F mcVersion=1.21.1 -F loader=neoforge -F changelog="new entity"
```
Then everyone sees it on https://horrormodsite.vercel.app instantly.

No need to keep your PC on after deploy.
