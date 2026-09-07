import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

const DEFAULT_DB = {
  mods: [
    {
      id: "example-horror",
      slug: "the-whispering-void",
      name: "The Whispering Void",
      summary: "Example horror mod - replace with your first entity. Free download, optional donation.",
      description: "Paranormal entity that whispers when alone underground. Placeholder - replace jar when real mod ready.",
      author: "Your Studio",
      icon: "/placeholder-icon.png",
      versions: [
        {
          version: "1.0.0",
          mcVersion: "1.21.1",
          loader: "neoforge",
          filename: "the-whispering-void-1.0.0.jar",
          size: 0,
          uploadedAt: new Date().toISOString(),
          changelog: "Initial example release"
        }
      ],
      downloads: 0
    }
  ]
};

async function loadDB(env) {
  try {
    const raw = await env.MODS_KV.get('mods.json', 'json');
    if (!raw) {
      await env.MODS_KV.put('mods.json', JSON.stringify(DEFAULT_DB));
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    return raw;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
}

async function saveDB(env, data) {
  await env.MODS_KV.put('mods.json', JSON.stringify(data));
}

app.use('/*', cors({ origin: '*', allowMethods: ['GET','POST','OPTIONS'] }));

app.get('/', (c) => c.json({
  name: 'HorrorModSite Backend (Workers KV - Never Sleeps)',
  status: 'ok - stays forever until YOU delete it, no card needed',
  storage: 'Workers KV (free, 25MB per jar limit - use R2 later for larger jars)',
  endpoints: ['/api/health','/api/mods','/api/mods/:slug','/api/donate','/files/:filename'],
  frontend: 'https://your-site.vercel.app'
}));

app.get('/api/health', (c) => c.json({ status: 'ok', storage: 'KV', alwaysOn: true, limit: '25MB per file' }));

app.get('/api/mods', async (c) => {
  const db = await loadDB(c.env);
  const host = new URL(c.req.url).origin;
  return c.json(db.mods.map(m => ({
    ...m,
    versions: m.versions.map(v => ({
      ...v,
      downloadUrl: `${host}/files/${v.filename}`
    }))
  })));
});

app.get('/api/mods/:slug', async (c) => {
  const db = await loadDB(c.env);
  const mod = db.mods.find(m => m.slug === c.req.param('slug'));
  if (!mod) return c.json({ error: 'Mod not found' }, 404);
  const host = new URL(c.req.url).origin;
  return c.json({
    ...mod,
    versions: mod.versions.map(v => ({
      ...v,
      downloadUrl: `${host}/files/${v.filename}`
    }))
  });
});

app.post('/api/mods/:slug/download', async (c) => {
  const db = await loadDB(c.env);
  const mod = db.mods.find(m => m.slug === c.req.param('slug'));
  if (!mod) return c.json({ error: 'Mod not found' }, 404);
  mod.downloads = (mod.downloads || 0) + 1;
  await saveDB(c.env, db);
  return c.json({ downloads: mod.downloads });
});

app.get('/api/donate', (c) => {
  return c.json({
    pixKey: c.env.PIX_KEY || "SEU-PIX-AQUI",
    pixName: c.env.PIX_NAME || "Nome do seu pai",
    paypalUrl: c.env.PAYPAL_URL || "https://paypal.me/seulink",
    message: "Mods são gratuitos. Sua doação ajuda minha família e mantém novos mods vindo. Escolha o valor que puder.",
    suggestedAmounts: [2, 5, 10, 20, 50]
  });
});

// Serve .jar from KV - worker/src/index.js:85
app.get('/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  if (!filename.endsWith('.jar')) return c.json({ error: 'Not found' }, 404);
  const data = await c.env.MODS_KV.get(`jar:${filename}`, 'arrayBuffer');
  if (!data) return c.json({ error: 'File not found. Upload via POST /api/admin/mods/:slug/upload' }, 404);
  
  return new Response(data, {
    headers: {
      'Content-Type': 'application/java-archive',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600'
    }
  });
});

// Admin upload - NOTE: Workers KV limit 25MB per value, so jar must be <25MB. For larger, add R2 later.
app.post('/api/admin/mods/:slug/upload', async (c) => {
  const token = c.req.query('token') || c.req.header('x-admin-token');
  if (c.env.ADMIN_TOKEN && token !== c.env.ADMIN_TOKEN) {
    return c.json({ error: 'Invalid admin token' }, 401);
  }

  const slug = c.req.param('slug');
  const db = await loadDB(c.env);
  const mod = db.mods.find(m => m.slug === slug);
  if (!mod) return c.json({ error: 'Mod not found' }, 404);

  const form = await c.req.parseBody();
  const file = form['file'];
  if (!file || typeof file === 'string') return c.json({ error: 'No file uploaded (field name must be file)' }, 400);
  if (!file.name.endsWith('.jar')) return c.json({ error: 'Only .jar allowed' }, 400);

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const buffer = await file.arrayBuffer();
  
  if (buffer.byteLength > 25 * 1024 * 1024) {
    return c.json({ error: 'Jar too large for KV (25MB limit). Enable R2 for larger files: change wrangler.toml to R2 bucket' }, 413);
  }

  await c.env.MODS_KV.put(`jar:${filename}`, buffer);

  const version = form['version'] || "1.0.0";
  const mcVersion = form['mcVersion'] || "1.21.1";
  const loader = form['loader'] || "neoforge";
  const changelog = form['changelog'] || "";

  mod.versions.unshift({
    version,
    mcVersion,
    loader,
    filename,
    size: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
    changelog
  });

  await saveDB(c.env, db);
  return c.json({ ok: true, filename, size: buffer.byteLength, note: "KV stored - stays forever, no card needed" });
});

export default app;
