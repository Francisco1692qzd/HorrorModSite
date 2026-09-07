import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import multipart from '@fastify/multipart';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { UPLOAD_DIR } from './storage.js';
import { loadDB, saveDB } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB max jar

// Serve uploaded jars as static files under /files
await app.register(fastifyStatic, {
  root: UPLOAD_DIR,
  prefix: '/files/',
  decorateReply: false
});

// Root - friendly info page
app.get('/', async () => ({
  name: 'HorrorModSite Backend',
  status: 'ok',
  storage: process.env.STORAGE_TYPE || 'local',
  frontend: 'http://localhost:3000',
  endpoints: ['/api/health', '/api/mods', '/api/mods/:slug', '/api/donate', '/files/:filename']
}));

// Health
app.get('/api/health', async () => ({ status: 'ok', storage: process.env.STORAGE_TYPE || 'local' }));

// List all mods - backend/src/server.js:22
app.get('/api/mods', async () => {
  const db = loadDB();
  // Return without file buffer, add downloadUrl
  return db.mods.map(m => ({
    ...m,
    versions: m.versions.map(v => ({
      ...v,
      downloadUrl: `/files/${v.filename}`
    }))
  }));
});

// Get single mod by slug
app.get('/api/mods/:slug', async (req, reply) => {
  const db = loadDB();
  const mod = db.mods.find(m => m.slug === req.params.slug);
  if (!mod) return reply.code(404).send({ error: 'Mod not found' });
  return {
    ...mod,
    versions: mod.versions.map(v => ({
      ...v,
      downloadUrl: `/files/${v.filename}`
    }))
  };
});

// Increment download counter (call when frontend starts download)
app.post('/api/mods/:slug/download', async (req, reply) => {
  const db = loadDB();
  const mod = db.mods.find(m => m.slug === req.params.slug);
  if (!mod) return reply.code(404).send({ error: 'Mod not found' });
  mod.downloads = (mod.downloads || 0) + 1;
  saveDB(db);
  return { downloads: mod.downloads };
});

// Donation config - frontend reads this to show Pix/PayPal. No payment processing on server, just links.
app.get('/api/donate', async () => {
  return {
    // Replace with your dad's real Pix key and PayPal link
    pixKey: process.env.PIX_KEY || "SEU-PIX-AQUI (ex: 123.456.789-00 ou chave aleatória)",
    pixName: process.env.PIX_NAME || "Nome do seu pai",
    paypalUrl: process.env.PAYPAL_URL || "https://paypal.me/seulink",
    message: "Mods são gratuitos. Sua doação ajuda minha família e mantém novos mods vindo. Escolha o valor que puder.",
    suggestedAmounts: [2, 5, 10, 20, 50]
  };
});

// ADMIN: Upload new version (protect this with ADMIN_TOKEN in production)
// POST /api/admin/mods/:slug/upload ?token=xxx  with multipart: file + version + mcVersion + loader + changelog
app.post('/api/admin/mods/:slug/upload', async (req, reply) => {
  const token = req.query.token || req.headers['x-admin-token'];
  if (process.env.ADMIN_TOKEN && token !== process.env.ADMIN_TOKEN) {
    return reply.code(401).send({ error: 'Invalid admin token' });
  }

  const db = loadDB();
  const mod = db.mods.find(m => m.slug === req.params.slug);
  if (!mod) return reply.code(404).send({ error: 'Mod not found' });

  const data = await req.file();
  if (!data) return reply.code(400).send({ error: 'No file uploaded' });
  if (!data.filename.endsWith('.jar')) return reply.code(400).send({ error: 'Only .jar allowed' });

  const buffer = await data.toBuffer();
  const filename = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filepath, buffer);

  // Add version entry - expects fields in multipart
  const version = data.fields?.version?.value || "1.0.0";
  const mcVersion = data.fields?.mcVersion?.value || "1.21.1";
  const loader = data.fields?.loader?.value || "neoforge";
  const changelog = data.fields?.changelog?.value || "";

  mod.versions.unshift({
    version,
    mcVersion,
    loader,
    filename,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    changelog
  });

  saveDB(db);
  return { ok: true, filename, size: buffer.length };
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Uploads dir: ${UPLOAD_DIR}`);
});
