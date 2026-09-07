"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [mods, setMods] = useState([]);
  const [donate, setDonate] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/mods`).then(r=>r.json()).then(setMods).catch(()=>{});
    fetch(`${API}/api/donate`).then(r=>r.json()).then(setDonate).catch(()=>{});
  }, []);

  const handleDownload = async (mod) => {
    try { await fetch(`${API}/api/mods/${mod.slug}/download`, { method: "POST" }); } catch {}
    const ver = mod.versions[0];
    if (!ver) return;
    // worker returns absolute URL (https://.../files/xxx.jar), local backend returns /files/xxx.jar
    const url = ver.downloadUrl.startsWith('http') ? ver.downloadUrl : `${API}${ver.downloadUrl}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-black/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">HORROR MODS <span className="text-red-500">STUDIO</span></h1>
          <span className="text-xs text-zinc-400">Mods gratuitos • Apoio voluntário via Pix/PayPal</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Donate banner - frontend/src/app/page.js */}
        {donate && (
          <div className="mb-10 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-6 flex flex-col md:flex-row gap-6 justify-between">
            <div>
              <h2 className="font-semibold text-lg">Apoie meu trabalho 🎮</h2>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">{donate.message}</p>
              <p className="text-xs text-zinc-500 mt-2">Pix: {donate.pixKey} ({donate.pixName}) • <a href={donate.paypalUrl} target="_blank" className="underline">PayPal: {donate.paypalUrl}</a></p>
              <p className="text-xs text-zinc-600 mt-1">Todo valor é voluntário. Você escolhe quanto enviar. Mods sempre gratuitos.</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <p className="text-xs font-medium text-zinc-300">Escolha o valor (R$)</p>
              <div className="flex flex-wrap gap-2">
                {donate.suggestedAmounts.map(v=>(
                  <a key={v} href={donate.paypalUrl} target="_blank" className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200">R$ {v}</a>
                ))}
                <a href={donate.paypalUrl} target="_blank" className="px-4 py-2 rounded-full border border-zinc-700 text-sm hover:bg-zinc-900">Outro valor</a>
              </div>
              <p className="text-xs text-zinc-500">Pix: use a chave acima no seu banco. PayPal: escolha o valor lá.</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-semibold">Mods Disponíveis</h2>
          <span className="text-xs text-zinc-500">{mods.length} mod(s) • downloads gratuitos mundialmente via CDN</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {mods.map(mod=>(
            <div key={mod.slug} className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <h3 className="font-bold text-lg">{mod.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{mod.summary}</p>
                <p className="text-xs text-zinc-500 mt-3 line-clamp-3">{mod.description}</p>
                <div className="flex gap-2 mt-4 text-xs">
                  <span className="px-2 py-1 rounded bg-zinc-800">{mod.versions[0]?.mcVersion || "-"}</span>
                  <span className="px-2 py-1 rounded bg-zinc-800">{mod.versions[0]?.loader || "-"}</span>
                  <span className="px-2 py-1 rounded bg-zinc-800">{mod.downloads} downloads</span>
                </div>
                {mod.versions[0] && <p className="text-xs text-zinc-600 mt-2">v{mod.versions[0].version} • {new Date(mod.versions[0].uploadedAt).toLocaleDateString()}</p>}
              </div>
              <div className="p-4 bg-black/40 border-t border-zinc-800 flex gap-3">
                <button onClick={()=>handleDownload(mod)} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-sm transition">⬇ Baixar Grátis .jar</button>
                <a href={donate?.paypalUrl || "#"} target="_blank" className="px-5 py-3 rounded-xl border border-zinc-700 text-sm hover:bg-zinc-800">Donate</a>
              </div>
            </div>
          ))}
          {mods.length===0 && <p className="text-zinc-500 col-span-2">Carregando mods... se não aparecer, inicie o backend: npm run dev em /backend</p>}
        </div>

        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="font-semibold">Como publicar mundialmente (grátis)</h3>
          <ol className="text-sm text-zinc-400 list-decimal pl-5 mt-2 space-y-1">
            <li>Backend já é seu próprio - sem comunidade. Hospede free no Render/Fly/Cloudflare Workers</li>
            <li>Troque STORAGE_TYPE para R2 e aponte CDN_BASE_URL para seu R2 bucket gratuito para downloads globais rápidos</li>
            <li>Frontend Next.js hospede free no Vercel (vercel --prod) - aponte NEXT_PUBLIC_API_URL para seu backend</li>
            <li>Upload de .jar via: POST /api/admin/mods/:slug/upload?token=SEU_TOKEN com multipart file</li>
          </ol>
          <p className="text-xs text-zinc-600 mt-3">Configure .env no backend com PIX_KEY, PIX_NAME, PAYPAL_URL e ADMIN_TOKEN antes de deploy.</p>
        </div>
      </main>
    </div>
  );
}
