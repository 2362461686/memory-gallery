"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconUpload } from "@/lib/icons";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((p) => [...p, ...selected]);
    setPreviews((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setFiles((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setLoading(true); setError(""); setMessage("");
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      const failNote = d.failed?.length
        ? `,${d.failed.length} 张失败(${d.failed.map((f: { name: string; reason: string }) => `${f.name}: ${f.reason}`).join("、")})`
        : "";
      setMessage(`咔嚓!收下了 ${d.count} 张回忆${failNote},即将跳转…`);
      setTimeout(() => router.push("/dashboard"), d.failed?.length ? 3000 : 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="manga-heading mb-2">
        <h1 className="text-2xl font-black">收录新回忆</h1>
      </div>
      <p className="text-sm opacity-60 mb-8 font-bold">这些天拍下的照片,传上来就是新的一话</p>

      {error && (
        <div className="mb-6 speech-bubble border-[var(--accent)] text-sm font-bold" style={{ borderColor: "var(--accent)" }}>
          {error}
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 glass rounded-lg text-sm font-bold">
          <span className="manga-sfx manga-sfx-pop mr-2">✓</span>
          {message}
        </div>
      )}

      <div className="glass-card p-6">
        <div
          className="border-[3px] border-dashed border-[var(--ink)] rounded-xl p-10 text-center cursor-pointer hover:bg-[color-mix(in_srgb,var(--sun)_18%,transparent)] transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*,.heic,.heif" onChange={handleFileSelect} className="hidden" />
          <div className="w-14 h-14 rounded-md border-[3px] border-[var(--ink)] bg-[var(--sun)] flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_var(--ink)]">
            <IconUpload className="text-[#17130e]" size={26} />
          </div>
          <p className="font-black mb-1">点击选择照片</p>
          <p className="text-xs opacity-60 font-bold">JPG / PNG / GIF / WebP / HEIC(自动转 JPG),单张 20MB 内,可多选</p>
        </div>

        {previews.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-bold mb-3">
              <span className="manga-tag manga-tag-sky mr-2">{files.length} 张</span>
              待收录
            </p>
            <div className="grid grid-cols-4 gap-3">
              {previews.map((url, i) => (
                <div key={i} className={`relative aspect-square manga-photo group ${i % 3 === 1 ? "rotate-[1.2deg]" : i % 3 === 2 ? "rotate-[-1deg]" : ""}`}>
                  <img src={url} alt="" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--accent)] border-2 border-[var(--ink)] text-[#fffdf7] text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0_var(--ink)]"
                    aria-label="移除这张照片"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleUpload} disabled={loading} className="manga-btn manga-btn-accent w-full mt-6">
              {loading ? "收录中…" : `收录这 ${files.length} 张回忆`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
