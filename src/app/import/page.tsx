"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconUpload, IconMessageCircle, IconImage } from "@/lib/icons";

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"photo" | "text">("photo");
  const [noteText, setNoteText] = useState("");

  async function handleNote() {
    if (!noteText.trim()) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText, date, place }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessage("记下了,即将跳转…");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally { setLoading(false); }
  }

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
    if (date) fd.append("date", date);
    if (place) fd.append("place", place);
    if (note) fd.append("note", note);
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
      <p className="text-sm opacity-60 mb-6 font-bold">照片、或者只是一段话 —— 都是新的一话</p>

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

      {/* 照片 / 手记 切换 */}
      <div className="flex gap-2 mb-6">
        {([["photo", IconImage, "传照片"], ["text", IconMessageCircle, "写一段"]] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 border-[3px] border-[var(--ink)] rounded-lg font-black text-sm transition-all ${
              tab === key
                ? "bg-[var(--ink)] text-[var(--paper)] shadow-[4px_4px_0_var(--accent)]"
                : "bg-[var(--paper)] shadow-[3px_3px_0_var(--ink)] hover:-translate-y-0.5"
            }`}
          >
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <div className="glass-card p-6">
          <p className="text-sm font-black mb-1">没有照片的那天,也值得记一页</p>
          <p className="text-xs opacity-55 font-bold mb-4">短句排成竖排大字扉页,长一点的做成手写旁白页;带感叹号的短句会变成呐喊。</p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={6}
            maxLength={500}
            placeholder="例:今天什么都没发生,但下班路上的晚霞很好看。"
            className="w-full px-4 py-3 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-lg text-sm font-bold leading-relaxed resize-none placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs opacity-45 font-bold tabular-nums">{noteText.length} / 500</span>
            <span className="text-xs opacity-45 font-bold">
              {/[!!]/.test(noteText) && noteText.trim().length <= 16
                ? "→ 呐喊"
                : noteText.trim().length <= 16
                  ? "→ 竖排扉页"
                  : "→ 手写旁白"}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow" />
            <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="在哪(可选)" className="px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow" />
          </div>
          <button onClick={handleNote} disabled={loading || !noteText.trim()} className="manga-btn manga-btn-accent w-full mt-5">
            {loading ? "记录中…" : "记下这一页"}
          </button>
        </div>
      ) : (
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
            {/* 可选:想给这批照片留句话就展开,不填照样成册 */}
            <details className="mt-6 pt-6 border-t-[3px] border-dashed border-[var(--ink)] group">
              <summary className="text-sm font-black cursor-pointer list-none flex items-center gap-2 select-none">
                <span className="inline-flex items-center justify-center w-5 h-5 border-2 border-[var(--ink)] rounded text-xs group-open:rotate-45 transition-transform">
                  +
                </span>
                想给这批照片留句话?<span className="opacity-50 font-bold">(可选)</span>
              </summary>
              <p className="text-xs opacity-55 font-bold mt-2 mb-4">
                不填也没关系——照片自带拍摄信息会自动读取,读不到就按收录顺序排进连载。
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold opacity-70">日期</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold opacity-70">在哪</span>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="例:青岛 · 栈桥"
                    className="mt-1 w-full px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                  />
                </label>
              </div>
              <label className="block mt-3">
                <span className="text-xs font-bold opacity-70">一句话</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例:下午翘班去看海,风很大"
                  className="mt-1 w-full px-3 py-2 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
                />
              </label>
            </details>

            <button onClick={handleUpload} disabled={loading} className="manga-btn manga-btn-accent w-full mt-6">
              {loading ? "收录中…" : `收录这 ${files.length} 张回忆`}
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
