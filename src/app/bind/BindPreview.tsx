"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconSparkles } from "@/lib/icons";

export interface BindItem {
  id: string;
  url?: string;
  isText: boolean;
  text: string;
  date: string;
  place: string;
}

export default function BindPreview({ items }: { items: BindItem[] }) {
  const router = useRouter();
  // 默认全选,顺序即当前顺序 —— 用户只需要调整,不必从零开始挑
  const [order, setOrder] = useState<string[]>(items.map((i) => i.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.id)));
  const [coverId, setCoverId] = useState<string>(
    items.find((i) => !i.isText)?.id ?? items[0].id
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const chosen = order.filter((id) => selected.has(id));
  const photoCount = chosen.filter((id) => !byId.get(id)!.isText).length;
  const noteCount = chosen.length - photoCount;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function move(id: string, dir: -1 | 1) {
    setOrder((o) => {
      const i = o.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function bind() {
    if (chosen.length === 0) {
      setError("至少选一条");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/exhibitions/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIds: chosen,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          coverPostId: selected.has(coverId) ? coverId : chosen[0],
          useAi,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      router.push(`/exhibition/${d.exhibition.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "装订失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="p-4 border-[3px] border-[var(--accent)] rounded-md text-sm font-bold">
          {error}
        </div>
      )}

      {/* 这一卷的信息 */}
      <section className="glass-card p-5">
        <div className="manga-heading mb-4">
          <h2 className="text-base font-black">这一卷叫什么</h2>
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="留空就自动起名"
          maxLength={40}
          className="w-full px-3 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="卷首语(可选)"
          rows={2}
          maxLength={200}
          className="mt-3 w-full px-3 py-2.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-md text-sm font-bold resize-none placeholder:opacity-40 placeholder:font-normal focus:outline-none focus:shadow-[3px_3px_0_var(--accent)] transition-shadow"
        />
        <label className="flex items-center gap-2.5 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useAi}
            onChange={(e) => setUseAi(e.target.checked)}
            disabled={!!title.trim()}
            className="w-5 h-5 accent-[var(--accent)] cursor-pointer disabled:opacity-40"
          />
          <span className="text-xs font-bold opacity-70">
            {title.trim() ? "已自己写了标题,不再让 AI 起名" : "让 AI 帮忙起名和写卷首语"}
          </span>
        </label>
      </section>

      {/* 选内容 + 排序 */}
      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="manga-heading">
            <h2 className="text-base font-black">收哪些</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="manga-tag manga-tag-sky">
              {photoCount} 张照片{noteCount > 0 ? ` · ${noteCount} 段手记` : ""}
            </span>
            <button
              onClick={() =>
                setSelected(
                  selected.size === items.length ? new Set() : new Set(items.map((i) => i.id))
                )
              }
              className="text-xs font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] underline transition-all"
            >
              {selected.size === items.length ? "全不选" : "全选"}
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {order.map((id, idx) => {
            const item = byId.get(id)!;
            const on = selected.has(id);
            return (
              <li
                key={id}
                className={`flex items-center gap-3 p-2 border-[3px] rounded-md transition-all ${
                  on ? "border-[var(--ink)] bg-[var(--paper)]" : "border-[var(--ink)]/25 opacity-45"
                }`}
              >
                {/* 选中 */}
                <button
                  onClick={() => toggle(id)}
                  aria-label={on ? "不收这条" : "收进这一卷"}
                  className={`w-7 h-7 shrink-0 border-[3px] border-[var(--ink)] rounded flex items-center justify-center transition-colors ${
                    on ? "bg-[var(--accent)] text-[#fffdf7]" : "bg-[var(--paper)]"
                  }`}
                >
                  {on && <IconCheck size={14} />}
                </button>

                {/* 缩略 */}
                <div className="w-14 h-14 shrink-0 border-[3px] border-[var(--ink)] rounded overflow-hidden bg-[var(--paper)] flex items-center justify-center">
                  {item.isText ? (
                    <span className="text-[0.6rem] font-black opacity-60 px-1 text-center leading-tight line-clamp-3">
                      {item.text.slice(0, 18) || "手记"}
                    </span>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">
                    {item.isText ? item.text || "(空手记)" : item.text || "未命名照片"}
                  </p>
                  <p className="text-[0.68rem] opacity-55 font-bold truncate mt-0.5">
                    {[item.date, item.place].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {/* 封面 */}
                {!item.isText && on && (
                  <button
                    onClick={() => setCoverId(id)}
                    className={`shrink-0 px-2 py-1 text-[0.62rem] font-black border-2 border-[var(--ink)] rounded transition-colors ${
                      coverId === id
                        ? "bg-[var(--sun)] text-[#17130e]"
                        : "bg-[var(--paper)] opacity-55 hover:opacity-100"
                    }`}
                  >
                    {coverId === id ? "封面" : "设封面"}
                  </button>
                )}

                {/* 排序 */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(id, -1)}
                    disabled={idx === 0}
                    aria-label="上移"
                    className="w-7 h-6 border-2 border-[var(--ink)] rounded-t bg-[var(--paper)] text-[0.6rem] font-black disabled:opacity-25 hover:bg-[var(--sun)] transition-colors"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(id, 1)}
                    disabled={idx === order.length - 1}
                    aria-label="下移"
                    className="w-7 h-6 border-2 border-[var(--ink)] rounded-b bg-[var(--paper)] text-[0.6rem] font-black disabled:opacity-25 hover:bg-[var(--sun)] transition-colors"
                  >
                    ▼
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 确认 */}
      <div className="sticky bottom-4 glass p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-black">
          这一卷收 {chosen.length} 条
          {chosen.length === 1 && (
            <span className="block text-xs font-bold opacity-55 mt-0.5">
              只有一条也可以成册,或者再去收录几条更像一话
            </span>
          )}
        </span>
        <button
          onClick={bind}
          disabled={saving || chosen.length === 0}
          className="manga-btn manga-btn-accent"
        >
          <IconSparkles size={16} />
          {saving ? "装订中…" : "确认装订"}
        </button>
      </div>
    </div>
  );
}
