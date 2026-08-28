"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconPlus, IconX } from "@/lib/icons";

export default function SettingsPage() {
  const [notes, setNotes] = useState<string[]>([]);
  const [builtin, setBuiltin] = useState<string[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/margin-notes")
      .then((r) => r.json())
      .then((d) => {
        if (d.notes) {
          setNotes(d.notes);
          setBuiltin(d.builtin || []);
          setIsCustom(!!d.isCustom);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const MAX_NOTES = 60;
  const MAX_LEN = 40;

  function add() {
    const text = draft.trim();
    if (!text) return;
    if (notes.length >= MAX_NOTES) {
      setMessage(`最多 ${MAX_NOTES} 条 —— 先删掉几条再加`);
      return;
    }
    if (text.length > MAX_LEN) {
      setMessage(`一条最多 ${MAX_LEN} 字,页脚放不下更长的`);
      return;
    }
    setNotes((n) => [...n, text]);
    setDraft("");
    setMessage("");
  }

  function remove(i: number) {
    setNotes((n) => n.filter((_, idx) => idx !== i));
    setMessage("");
  }

  function update(i: number, text: string) {
    setNotes((n) => n.map((v, idx) => (idx === i ? text : v)));
    setMessage("");
  }

  async function save(next?: string[]) {
    const payload = next ?? notes;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/margin-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setIsCustom(d.isCustom);
      if (!d.isCustom) setNotes(builtin);
      setMessage(d.isCustom ? "存好了 —— 下次翻回忆集就是你写的了" : "已恢复内置那 18 条");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition-all mb-6"
      >
        <IconArrowLeft size={16} />返回回忆录
      </Link>

      <div className="manga-heading mb-2">
        <h1 className="text-2xl font-black">页边吐槽</h1>
      </div>
      <p className="text-sm opacity-60 mb-2 font-bold">
        回忆集每隔一页,页脚会冒出一行小字 —— 就是漫画里作者在页边写的那种碎碎念。
      </p>
      <p className="text-xs opacity-45 mb-8 font-bold">
        梗是有保质期的。这些话你随时可以改成自己的。全删光就恢复成内置那套。
      </p>

      {message && (
        <div className="mb-6 p-4 glass rounded-lg text-sm font-bold">{message}</div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="manga-tag manga-tag-sky">
            {notes.length} / {MAX_NOTES} 条{isCustom ? " · 自定义" : " · 内置"}
          </span>
          {isCustom && (
            <button
              onClick={() => save([])}
              disabled={saving}
              className="text-xs font-bold opacity-55 hover:opacity-100 hover:text-[var(--accent)] transition-all underline"
            >
              恢复内置
            </button>
          )}
        </div>

        {/* 新增 */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="写一句你自己的,比如「这张我修了三遍」"
            maxLength={MAX_LEN}
            className="flex-1 min-w-0 px-3 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
          />
          <button onClick={add} disabled={!draft.trim()} className="manga-btn !px-4 !py-2.5 shrink-0 justify-center">
            <IconPlus size={16} /><span className="sm:hidden">添加</span>
          </button>
        </div>

        {/* 列表 */}
        {!loaded ? (
          <p className="text-sm opacity-50 font-bold py-6 text-center">读取中…</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((note, i) => (
              <li key={i} className="flex items-center gap-2 group">
                <span className="inline-block w-2.5 h-2.5 bg-[var(--accent)] border-2 border-[var(--ink)] shrink-0" />
                <input
                  value={note}
                  onChange={(e) => update(i, e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-transparent border-b-2 border-transparent hover:border-[var(--ink)] focus:border-[var(--accent)] text-sm font-bold focus:outline-none transition-colors"
                />
                <button
                  onClick={() => remove(i)}
                  className="w-8 h-8 sm:w-7 sm:h-7 rounded border-2 border-[var(--ink)] bg-[var(--paper)] flex items-center justify-center opacity-60 sm:opacity-40 sm:group-hover:opacity-100 hover:bg-[var(--accent)] hover:text-[#fffdf7] active:bg-[var(--accent)] transition-all shrink-0"
                  aria-label="删掉这条"
                >
                  <IconX size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {loaded && notes.length === 0 && (
          <p className="text-sm opacity-50 font-bold py-6 text-center">
            一条都没有了 —— 保存后会自动用回内置的 18 条。
          </p>
        )}

        <button onClick={() => save()} disabled={saving} className="manga-btn manga-btn-accent w-full mt-6">
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
