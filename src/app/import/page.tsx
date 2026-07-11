"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconUpload, IconMessageCircle, IconImage } from "@/lib/icons";

type ImportTab = "upload" | "qzone";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ImportTab>("upload");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Photo upload state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // QQ Space state
  const [cookieStr, setCookieStr] = useState("");

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setLoading(true);
    setError("");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">导入内容</h1>
      <p className="text-sm text-zinc-500 mb-8">导入照片或社交内容，AI 会帮你策展</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-zinc-100 rounded-xl p-1">
        {[
          { key: "upload" as const, Icon: IconImage, label: "上传照片", desc: "手机相册" },
          { key: "qzone" as const, Icon: IconMessageCircle, label: "QQ 空间", desc: "Cookie 导入" },
        ].map(({ key, Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-white shadow-sm text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Icon size={18} />
            <div className="text-left">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-zinc-400">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
          {message}
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm">
          <div
            className="border-2 border-dashed border-zinc-300 rounded-xl p-10 text-center hover:border-zinc-400 hover:bg-zinc-50/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <IconUpload className="text-zinc-400" size={24} />
            </div>
            <p className="text-zinc-600 font-medium mb-1">点击选择照片</p>
            <p className="text-sm text-zinc-400">支持 JPG、PNG、HEIC，可多选</p>
          </div>

          {previews.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-zinc-500 mb-3">
                已选择 {files.length} 张照片
              </p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-6 w-full py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? "上传中..." : `上传 ${files.length} 张照片`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QQ Space tab */}
      {tab === "qzone" && (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm">
          <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <p className="font-medium mb-1">如何获取 Cookie？</p>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-600 text-xs">
              <li>用电脑浏览器打开 qzone.qq.com 并登录</li>
              <li>按 F12 打开开发者工具</li>
              <li>进入 Application &rarr; Cookies &rarr; qzone.qq.com</li>
              <li>复制所有 Cookie 内容粘贴到下方</li>
            </ol>
          </div>

          <label className="block text-sm font-medium text-zinc-700 mb-2">
            QQ 空间 Cookie
          </label>
          <textarea
            value={cookieStr}
            onChange={(e) => setCookieStr(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent resize-none text-sm text-zinc-600 font-mono"
            placeholder="将复制的 Cookie 粘贴到这里..."
          />

          <button
            onClick={handleQzoneImport}
            disabled={loading || !cookieStr.trim()}
            className="mt-4 w-full py-3 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? "导入中..." : "从 QQ 空间导入"}
          </button>
        </div>
      )}
    </div>
  );
}
