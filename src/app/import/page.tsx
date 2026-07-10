"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type ImportTab = "upload" | "qzone";

export default function ImportPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ImportTab>("upload");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Photo upload state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // QQ Space state
  const [cookieStr, setCookieStr] = useState("");
  const [qzoneResult, setQzoneResult] = useState<{
    postCount: number;
    photoCount: number;
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`成功导入 ${data.count} 张照片！`);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleQzoneImport() {
    if (!cookieStr.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/import/qzone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookieStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQzoneResult(data);
      setMessage(`成功从 QQ 空间导入 ${data.postCount} 条动态！`);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-700 mb-2">导入内容</h1>
      <p className="text-sm text-zinc-400 mb-8">
        导入照片或社交内容，AI 会帮你策展
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white/50 rounded-xl p-1">
        {[
          { key: "upload" as const, label: "📸 上传照片", desc: "手机相册" },
          { key: "qzone" as const, label: "🔗 QQ 空间", desc: "Cookie 导入" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white shadow-sm text-purple-500"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t.label}
            <span className="block text-xs font-normal opacity-60">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">
          {message}
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-sm">
          <div className="border-2 border-dashed border-purple-200 rounded-xl p-10 text-center hover:border-purple-300 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-zinc-500 font-medium mb-1">点击选择照片</p>
              <p className="text-sm text-zinc-300">支持 JPG、PNG、HEIC，可多选</p>
            </label>
          </div>

          {previews.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-zinc-500 mb-3">已选择 {files.length} 张照片</p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-zinc-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "上传中..." : `上传 ${files.length} 张照片`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QQ Space tab */}
      {tab === "qzone" && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/80 shadow-sm">
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <p className="font-medium mb-1">如何获取 Cookie？</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-600">
              <li>用电脑浏览器打开 qzone.qq.com 并登录</li>
              <li>按 F12 打开开发者工具</li>
              <li>进入 Application (应用程序) → Cookies → qzone.qq.com</li>
              <li>复制所有 Cookie 内容粘贴到下方</li>
            </ol>
          </div>

          <label className="block text-sm font-medium text-zinc-600 mb-2">
            QQ 空间 Cookie
          </label>
          <textarea
            value={cookieStr}
            onChange={(e) => setCookieStr(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none text-sm text-zinc-600 font-mono"
            placeholder="将复制的 Cookie 粘贴到这里..."
          />

          <button
            onClick={handleQzoneImport}
            disabled={loading || !cookieStr.trim()}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "导入中..." : "从 QQ 空间导入"}
          </button>

          {qzoneResult && (
            <div className="mt-4 p-4 rounded-xl bg-green-50 text-green-700 text-sm">
              导入成功！共 {qzoneResult.postCount} 条动态
            </div>
          )}
        </div>
      )}
    </div>
  );
}
