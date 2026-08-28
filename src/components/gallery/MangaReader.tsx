"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { paginate, chapterColor, type Photo, type Chapter, type PhotoPageData, type TextPageData } from "./layout-engine";

// 只声明阅读器真正用到的字段,与 store 的 PostRecord 结构兼容
interface Exhibit {
  id: string;
  mediaUrls: string;
  contentText?: string | null;
  aiDescription?: string | null;
  postedAt?: Date | string | null;
  batchId?: string | null;
  dominantColor?: string | null;
  aspectRatio?: number | null;
  interest?: number | null;
}

interface MangaReaderProps {
  exhibits: Exhibit[];
  title: string;
  description?: string | null;
}

function formatDay(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

type Page =
  | { kind: "cover"; cover?: Photo; color?: string }
  | ({ kind: "photos" } & PhotoPageData)
  | TextPageData
  | { kind: "back"; count: number; range: string; chapters: number; notes: number };

/** 按上传批次分话 —— 没有时间戳时,"一起传的"就是"一件事" */
function buildChapters(exhibits: Exhibit[]): Chapter[] {
  const groups = new Map<string, Photo[]>();
  const order: string[] = [];

  for (const ex of exhibits) {
    let urls: string[] = [];
    try {
      urls = JSON.parse(ex.mediaUrls) as string[];
    } catch { /* 老数据可能有坏 JSON */ }
    // 没有 batchId 的老数据各自成组,不会和新数据混在一起
    const key = ex.batchId || `solo:${ex.id}`;
    if (!groups.has(key)) { groups.set(key, []); order.push(key); }
    const caption = ex.contentText || ex.aiDescription || "";
    if (urls.length === 0) {
      // 纯文字回忆:没有图,整页留给这段话
      if (caption) {
        groups.get(key)!.push({ textOnly: true, caption, date: formatDay(ex.postedAt), ratio: 1, interest: 0 });
      }
      continue;
    }
    for (const url of urls) {
      groups.get(key)!.push({
        url,
        caption,
        date: formatDay(ex.postedAt),
        color: ex.dominantColor || undefined,
        ratio: ex.aspectRatio || 4 / 3,
        interest: ex.interest ?? 0.5,
      });
    }
  }

  return order
    .map((key) => groups.get(key)!)
    .filter((photos) => photos.length > 0)
    .map((photos, i) => ({ no: i + 1, photos, color: chapterColor(photos) }));
}

export default function MangaReader({ exhibits, title, description }: MangaReaderProps) {
  const pages = useMemo<Page[]>(() => {
    const chapters = buildChapters(exhibits);
    const all = chapters.flatMap((c) => c.photos);
    const pics = all.filter((p) => !p.textOnly);
    const cover = pics.length
      ? pics.reduce((best, p) => (p.interest > best.interest ? p : best), pics[0])
      : undefined;
    const dates = all.map((p) => p.date).filter(Boolean);

    return [
      { kind: "cover", cover, color: cover?.color },
      ...paginate(chapters).map((p) => ("kind" in p ? p : { kind: "photos" as const, ...p })),
      {
        kind: "back" as const,
        count: pics.length,
        notes: all.length - pics.length,
        chapters: chapters.length,
        range: dates.length ? `${dates[dates.length - 1]} — ${dates[0]}` : "",
      },
    ];
  }, [exhibits]);

  const [page, setPage] = useState(0);

  const turn = useCallback(
    (dir: "next" | "prev") => {
      setPage((p) => {
        const t = dir === "next" ? p + 1 : p - 1;
        return t < 0 || t >= pages.length ? p : t;
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
  const tint = "color" in current ? current.color : undefined;

  return (
    <div className="select-none">
      <div
        className="relative mx-auto max-w-3xl aspect-[4/3] sm:aspect-[3/2] border-[3px] border-[var(--ink)] rounded-lg bg-[var(--paper)] overflow-hidden transition-colors duration-500"
        style={{
          boxShadow: "3px 3px 0 var(--paper), 4px 4px 0 var(--ink), 7px 7px 0 var(--paper), 8px 8px 0 var(--ink)",
          // 该话主色淡淡地染在纸上,一本书因此有色彩节奏
          backgroundImage: tint
            ? `linear-gradient(color-mix(in srgb, ${tint} 12%, transparent), color-mix(in srgb, ${tint} 4%, transparent))`
            : undefined,
        }}
      >
        <div key={page} className="absolute inset-0 p-4 sm:p-7 motion-safe:animate-[pageIn_0.24s_ease-out]">
          {current.kind === "cover" && <CoverPage title={title} description={description} cover={current.cover} />}
          {current.kind === "photos" && <PhotoPage page={current} />}
          {current.kind === "text" && <TextPage page={current} />}
          {current.kind === "back" && <BackPage {...current} />}
        </div>

        <button onClick={() => turn("prev")} disabled={page === 0} className="absolute inset-y-0 left-0 w-[15%] cursor-w-resize disabled:cursor-default" aria-label="上一页" />
        <button onClick={() => turn("next")} disabled={page === pages.length - 1} className="absolute inset-y-0 right-0 w-[15%] cursor-e-resize disabled:cursor-default" aria-label="下一页" />
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => turn("prev")} disabled={page === 0} className="manga-btn manga-btn-ghost !px-4 !py-1.5 !text-xs">← 上一页</button>
        <span className="text-sm font-black tabular-nums">
          P.{page + 1} <span className="opacity-40">/ {pages.length}</span>
        </span>
        <button onClick={() => turn("next")} disabled={page === pages.length - 1} className="manga-btn manga-btn-ghost !px-4 !py-1.5 !text-xs">下一页 →</button>
      </div>
    </div>
  );
}

/* ---------------- 页面类型 ---------------- */

function CoverPage({ title, description, cover }: { title: string; description?: string | null; cover?: Photo }) {
  return (
    <div className="h-full grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] gap-5 items-center">
      <div className="relative h-full min-h-0 hidden sm:block">
        {cover && (
          <div className="manga-photo h-full rotate-[-1.2deg]">
            <img src={cover.url} alt="" className="h-full" />
          </div>
        )}
        <span className="absolute -bottom-3 -right-3 manga-sfx text-3xl">咔嚓</span>
      </div>
      <div className="flex flex-col justify-center gap-4 text-center sm:text-left">
        <span className="manga-tag manga-tag-accent self-center sm:self-start rotate-[-3deg]">单行本</span>
        <h2 className="text-3xl sm:text-4xl font-black leading-[1.15]" style={{ textWrap: "balance" }}>{title}</h2>
        <div className="h-[3px] bg-[var(--ink)] w-16 self-center sm:self-start" />
        {description && <p className="text-xs sm:text-sm opacity-70 leading-relaxed font-bold">{description}</p>}
      </div>
    </div>
  );
}

function PhotoPage({ page }: { page: PhotoPageData }) {
  const { layout, items, chapter, sfx, focus } = page;
  return (
    <div className="h-full relative">
      <span className="absolute -top-1 right-0 z-10 text-[0.65rem] font-black opacity-35 tracking-widest">
        第 {chapter} 话
      </span>

      <div className="h-full grid gap-3 sm:gap-4" style={{ gridTemplateColumns: layout.cols, gridTemplateRows: layout.rows }}>
        {items.map((item, i) => {
          const cell = layout.cells[i];
          const tilt = i % 3 === 0 ? "-0.7deg" : i % 3 === 1 ? "0.8deg" : "-0.3deg";
          return (
            <figure key={i} className="relative min-h-0 min-w-0" style={{ gridArea: cell.area }}>
              <div
                className={`manga-photo manga-photo-fit h-full w-full ${focus && cell.hero ? "focus-lines" : ""}`}
                style={{
                  transform: `rotate(${tilt})`,
                  // 图片主色垫底:留白处不是灰块,而是与画面同色的相纸底
                  backgroundColor: item.color ? `color-mix(in srgb, ${item.color} 18%, var(--paper))` : undefined,
                }}
              >
                <img src={item.url} alt={item.caption || "回忆"} loading="lazy" />
              </div>

              {item.date && (
                <span className="absolute -top-2 -left-2 manga-tag !text-[0.62rem] rotate-[-4deg]">{item.date}</span>
              )}

              {item.caption && cell.hero && (
                <figcaption className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-[70%] bg-[var(--paper)] border-[3px] border-[var(--ink)] rounded-lg px-3 py-1.5 text-[0.7rem] sm:text-xs font-bold leading-snug line-clamp-2 shadow-[3px_3px_0_var(--ink)]">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {sfx && (
        <span className={`manga-sfx ${sfx.style} absolute top-[36%] -right-1 text-4xl sm:text-5xl pointer-events-none z-10`}>
          {sfx.word}
        </span>
      )}
    </div>
  );
}

function TextPage({ page }: { page: TextPageData }) {
  const { text, chapter, variant } = page;

  return (
    <div className="h-full relative overflow-hidden">
      <span className="absolute -top-1 right-0 z-20 text-[0.65rem] font-black opacity-35 tracking-widest">
        第 {chapter} 话
      </span>

      {/* 扉页:短句靠排版立住 —— 竖排大字、网点半幅、墨条压边,不套花哨的框 */}
      {variant === "title" && (
        <div className="h-full flex items-stretch">
          {/* 左半:网点色块 */}
          <div className="relative w-[38%] shrink-0 tone-dots opacity-40 border-r-[3px] border-[var(--ink)]" />
          {/* 右半:竖排标题 */}
          <div className="flex-1 flex items-center justify-center px-6">
            <p
              className="font-black leading-[1.35] text-3xl sm:text-4xl"
              style={{ writingMode: "vertical-rl", textOrientation: "upright", letterSpacing: "0.12em", maxHeight: "82%" }}
            >
              {text}
            </p>
          </div>
          {/* 压在骑缝上的墨条 */}
          <div className="absolute left-[38%] top-8 -translate-x-1/2 w-3 h-16 bg-[var(--accent)] border-[3px] border-[var(--ink)]" />
        </div>
      )}

      {/* 旁白:手写体横排,像作者在页边写的话 */}
      {variant === "narration" && (
        <div className="h-full flex items-center justify-center px-4">
          <div className="absolute inset-x-10 inset-y-12 tone-dots opacity-15 rounded pointer-events-none" />
          <div className="relative max-w-lg">
            <div className="h-[3px] bg-[var(--ink)] w-14 mb-5" />
            <p className="handwriting text-lg sm:text-2xl font-bold leading-[2] whitespace-pre-wrap">
              {text}
            </p>
            <div className="h-[3px] bg-[var(--ink)] w-14 mt-5 ml-auto" />
          </div>
        </div>
      )}

      {/* 呐喊:只有真带感叹号的短句才走这里 */}
      {variant === "shout" && (
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 focus-lines opacity-70" />
          <p className="manga-sfx manga-sfx-loud relative text-4xl sm:text-6xl text-center px-8 leading-tight">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}

function BackPage({ count, range, chapters, notes }: { count: number; range: string; chapters: number; notes: number }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 speed-lines rounded">
      <span className="manga-sfx text-6xl sm:text-8xl">完</span>
      <p className="text-sm font-black">全 {chapters} 话 · {count} 张回忆{notes > 0 ? ` · ${notes} 段手记` : ""}</p>
      {range && <p className="text-xs font-bold opacity-50">{range}</p>}
      <span className="manga-tag manga-tag-sky mt-1 rotate-[-2deg]">未完待续</span>
    </div>
  );
}
