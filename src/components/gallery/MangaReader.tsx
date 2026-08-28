"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

// 只声明阅读器真正用到的字段,与 store 的 PostRecord 结构兼容
interface Exhibit {
  id: string;
  mediaUrls: string;
  contentText?: string | null;
  aiDescription?: string | null;
  postedAt?: Date | string | null;
}

interface MangaReaderProps {
  exhibits: Exhibit[];
  title: string;
  description?: string | null;
}

interface PhotoItem {
  url: string;
  caption: string;
  date: string;
}

type Page =
  | { kind: "cover"; coverUrl?: string }
  | { kind: "photos"; items: PhotoItem[] }
  | { kind: "back"; count: number; range: string };

function formatDay(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

// 每页 1/2/3 张循环,像分镜的节奏:大格 → 对页 → 三格
const PAGE_RHYTHM = [1, 2, 3];

function buildPages(exhibits: Exhibit[]): { items: PhotoItem[]; pages: Page[] } {
  const items: PhotoItem[] = [];
  for (const ex of exhibits) {
    let urls: string[] = [];
    try {
      urls = JSON.parse(ex.mediaUrls) as string[];
    } catch { /* 老数据可能有坏 JSON */ }
    const caption = ex.contentText || ex.aiDescription || "";
    const date = formatDay(ex.postedAt);
    for (const url of urls) items.push({ url, caption, date });
  }

  const pages: Page[] = [{ kind: "cover", coverUrl: items[0]?.url }];
  let i = 0;
  let r = 0;
  while (i < items.length) {
    const take = Math.min(PAGE_RHYTHM[r % PAGE_RHYTHM.length], items.length - i);
    pages.push({ kind: "photos", items: items.slice(i, i + take) });
    i += take;
    r++;
  }
  const dates = items.map((p) => p.date).filter(Boolean);
  const range = dates.length ? `${dates[dates.length - 1]} — ${dates[0]}` : "";
  pages.push({ kind: "back", count: items.length, range });
  return { items, pages };
}

export default function MangaReader({ exhibits, title, description }: MangaReaderProps) {
  const { pages } = useMemo(() => buildPages(exhibits), [exhibits]);
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);

  const turn = useCallback(
    (dir: "next" | "prev") => {
      setPage((p) => {
        const target = dir === "next" ? p + 1 : p - 1;
        if (target < 0 || target >= pages.length) return p;
        setTurning(dir);
        setTimeout(() => setTurning(null), 240);
        return target;
      });
    },
    [pages.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") turn("next");
      if (e.key === "ArrowLeft") turn("prev");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  const current = pages[page];

  return (
    <div className="select-none">
      {/* 书体:右缘堆叠出书页厚度 */}
      <div
        className="relative mx-auto max-w-3xl aspect-[4/3] sm:aspect-[3/2] border-[3px] border-[var(--ink)] rounded-lg bg-[var(--paper)] overflow-hidden"
        style={{
          boxShadow:
            "3px 3px 0 var(--paper), 4px 4px 0 var(--ink), 7px 7px 0 var(--paper), 8px 8px 0 var(--ink)",
        }}
      >
        {/* 页面内容 */}
        <div
          key={page}
          className="absolute inset-0 p-5 sm:p-8 motion-safe:animate-[pageIn_0.24s_ease-out]"
          style={{
            transformOrigin: turning === "prev" ? "right center" : "left center",
          }}
        >
          {current.kind === "cover" && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-5">
              <span className="manga-tag manga-tag-accent rotate-[-3deg]">单行本</span>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight max-w-md" style={{ textWrap: "balance" }}>
                {title}
              </h2>
              {current.coverUrl && (
                <div className="manga-photo w-40 sm:w-52 aspect-square rotate-[1.5deg]">
                  <img src={current.coverUrl} alt="" />
                </div>
              )}
              {description && (
                <p className="text-xs sm:text-sm opacity-70 max-w-sm leading-relaxed font-bold">
                  {description}
                </p>
              )}
            </div>
          )}

          {current.kind === "photos" && (
            <div className={`h-full grid gap-4 ${current.items.length === 1 ? "grid-cols-1" : current.items.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"}`}>
              {current.items.map((item, i) => (
                <figure
                  key={i}
                  className={`relative flex flex-col min-h-0 ${current.items.length === 3 && i === 0 ? "row-span-2" : ""}`}
                >
                  <div className={`manga-photo flex-1 min-h-0 ${i % 2 === 0 ? "rotate-[-0.6deg]" : "rotate-[0.6deg]"}`}>
                    <img src={item.url} alt={item.caption || "回忆照片"} className="h-full" loading="lazy" />
                  </div>
                  {item.date && (
                    <span className="absolute -top-2 -left-2 manga-tag !text-[0.65rem]">{item.date}</span>
                  )}
                  {item.caption && (
                    <figcaption className="mt-2 text-[0.7rem] sm:text-xs font-bold opacity-75 line-clamp-2 leading-snug px-1">
                      {item.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {current.kind === "back" && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <span className="manga-sfx text-6xl sm:text-7xl">完</span>
              <p className="text-sm font-bold opacity-70">
                本卷收录 {current.count} 张回忆
              </p>
              {current.range && <p className="text-xs font-bold opacity-50">{current.range}</p>}
              <span className="manga-tag manga-tag-sky mt-2">下回连载,未完待续</span>
            </div>
          )}
        </div>

        {/* 左右点击翻页热区 */}
        <button
          onClick={() => turn("prev")}
          disabled={page === 0}
          className="absolute inset-y-0 left-0 w-1/5 cursor-w-resize disabled:cursor-default"
          aria-label="上一页"
        />
        <button
          onClick={() => turn("next")}
          disabled={page === pages.length - 1}
          className="absolute inset-y-0 right-0 w-1/5 cursor-e-resize disabled:cursor-default"
          aria-label="下一页"
        />
      </div>

      {/* 页码与翻页 */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => turn("prev")} disabled={page === 0} className="manga-btn manga-btn-ghost !px-4 !py-1.5 !text-xs">
          ← 上一页
        </button>
        <span className="text-sm font-black tabular-nums">
          P.{page + 1} <span className="opacity-40">/ {pages.length}</span>
        </span>
        <button onClick={() => turn("next")} disabled={page === pages.length - 1} className="manga-btn manga-btn-ghost !px-4 !py-1.5 !text-xs">
          下一页 →
        </button>
      </div>

    </div>
  );
}
