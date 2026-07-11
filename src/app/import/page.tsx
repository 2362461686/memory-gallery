"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconUpload, IconMessageCircle, IconImage } from "@/lib/icons";

type ImportTab = "upload" | "qzone";
const glassInput = "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm text-slate-600 dark:text-slate-300 font-mono";
const btnPrimary = "w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/25";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ImportTab>("upload");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [cookieStr, setCookieStr] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []); if (selected.length === 0) return;
    setFiles(p => [...p, ...selected]); setPreviews(p => [...p, ...selected.map(f => URL.createObjectURL(f))]);
  }
  function removeFile(idx: number) { URL.revokeObjectURL(previews[idx]); setFiles(p => p.filter((_,i) => i !== idx)); setPreviews(p => p.filter((_,i) => i !== idx)); }
  async function handleUpload() {
    if (files.length === 0) return; setLoading(true); setError(""); const fd = new FormData(); files.forEach(f => fd.append("files", f));
    try { const res = await fetch("/api/upload", { method: "POST", body: fd }); const d = await res.json(); if (!res.ok) throw new Error(d.error); router.push("/dashboard"); } catch (err) { setError(err instanceof Error ? err.message : "上传失败"); } finally { setLoading(false); }
  }
  async function handleQzoneImport() {
    if (!cookieStr.trim()) return; setLoading(true); setError("");
    try { const res = await fetch("/api/import/qzone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cookie: cookieStr }) }); const d = await res.json(); if (!res.ok) throw new Error(d.error); router.push("/dashboard"); } catch (err) { setError(err instanceof Error ? err.message : "导入失败"); } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">导入内容</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">导入照片或社交内容，AI 会帮你策展</p>
      <div className="flex gap-1 mb-8 glass rounded-xl p-1">
        {[ { key: "upload" as const, Icon: IconImage, label: "上传照片", desc: "手机相册" }, { key: "qzone" as const, Icon: IconMessageCircle, label: "QQ 空间", desc: "Cookie 导入" } ].map(({ key, Icon, label, desc }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 flex items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            <Icon size={18} /><div className="text-left"><div className="text-sm font-medium">{label}</div><div className="text-xs opacity-60">{desc}</div></div>
          </button>
        ))}
      </div>
      {error && <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}
      {message && <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">{message}</div>}
      {tab === "upload" && (
        <div className="glass-card p-6">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3"><IconUpload className="text-slate-400" size={24} /></div>
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-1">点击选择照片</p><p className="text-sm text-slate-400">支持 JPG、PNG、HEIC，可多选</p>
          </div>
          {previews.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">已选择 {files.length} 张照片</p>
              <div className="grid grid-cols-4 gap-2">{previews.map((url, i) => (<div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 group"><img src={url} alt="" className="w-full h-full object-cover" /><button onClick={e => { e.stopPropagation(); removeFile(i); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button></div>))}</div>
              <button onClick={handleUpload} disabled={loading} className={`mt-6 ${btnPrimary}`}>{loading ? "上传中..." : `上传 ${files.length} 张照片`}</button>
            </div>
          )}
        </div>
      )}
      {tab === "qzone" && (
        <div className="glass-card p-6">
          <div className="mb-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
            <p className="font-medium mb-1">如何获取 Cookie？</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs opacity-80"><li>用电脑浏览器打开 qzone.qq.com 并登录</li><li>按 F12 打开开发者工具</li><li>进入 Application &rarr; Cookies &rarr; qzone.qq.com</li><li>复制所有 Cookie 内容粘贴到下方</li></ol>
          </div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">QQ 空间 Cookie</label>
          <textarea value={cookieStr} onChange={e => setCookieStr(e.target.value)} rows={6} className={glassInput} placeholder="将复制的 Cookie 粘贴到这里..." />
          <button onClick={handleQzoneImport} disabled={loading || !cookieStr.trim()} className={`mt-4 ${btnPrimary}`}>{loading ? "导入中..." : "从 QQ 空间导入"}</button>
        </div>
      )}
    </div>
  );
}
