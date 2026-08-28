"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { paginate, chapterColor, NEXT_EPISODE, type Photo, type Chapter, type PhotoPageData, type TextPageData } from "./layout-engine";
import { MangaMark, pickMark } from "./manga-marks";

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
        <div key={page} className="absolute inset-0 pt-4 px-4 pb-8 sm:pt-7 sm:px-7 sm:pb-9 motion-safe:animate-[pageIn_0.24s_ease-out]">
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
  const { tiers, chapter, sfx, focus, marginNote } = page;

  // 整页最多一个表情符号,给主角格 —— 满页符号就成贴纸了。
  // 渲染前先定好贴在哪一格,避免在渲染过程里改状态。
  const markTarget = (() => {
    for (let ti = 0; ti < tiers.length; ti++) {
      for (let pi = 0; pi < tiers[ti].items.length; pi++) {
        const { photo, panel } = tiers[ti].items[pi];
        if (!panel.hero) continue;
        const kind = pickMark(photo.interest, photo.ratio);
        if (kind) return { ti, pi, kind };
      }
    }
    return null;
  })();

  return (
    <div className="h-full relative">
      {/* 书眉压在右上 —— 漫画动线的入口就在这一角 */}
      <span className="absolute -top-2 right-0 z-30 text-[0.65rem] font-black opacity-35 tracking-widest">
        第 {chapter} 话
      </span>

      {/* 段间距 5-7mm(宽),格间距 2-4mm(窄) —— 疏密之差就是节奏 */}
      <div className="h-full flex flex-col gap-[7px] sm:gap-[10px]">
        {tiers.map((tier, ti) => (
          <div
            key={ti}
            // row-reverse:每段从右往左读,还原漫画动线
            className="flex flex-row-reverse gap-[4px] sm:gap-[6px] min-h-0"
            style={{ flex: tier.h }}
          >
            {tier.items.map(({ photo, panel }, pi) => {
              const bleed = panel.bleed;
              // 出血:主角格顶到页边,不留白边
              const bleedStyle: React.CSSProperties = {
                marginTop: bleed === "top" || bleed === "full" ? "-1.75rem" : undefined,
                marginRight: bleed === "right" || bleed === "full" ? "-1.75rem" : undefined,
                marginLeft: bleed === "left" || bleed === "full" ? "-1.75rem" : undefined,
                marginBottom: bleed === "bottom" || bleed === "full" ? "-1.75rem" : undefined,
              };

              return (
                <figure
                  key={pi}
                  className="relative min-h-0 min-w-0"
                  style={{ flex: panel.w, ...bleedStyle }}
                >
                  <div
                    className={`manga-panel manga-photo-fit h-full w-full ${
                      focus && panel.hero ? "focus-lines" : ""
                    } ${bleed ? "manga-panel-bleed" : ""}`}
                    style={{
                      backgroundColor: photo.color
                        ? `color-mix(in srgb, ${photo.color} 16%, var(--paper))`
                        : undefined,
                    }}
                  >
                    <img src={photo.url} alt={photo.caption || "回忆"} loading="lazy" />
                  </div>

                  {markTarget?.ti === ti && markTarget?.pi === pi && (
                    <MangaMark
                      kind={markTarget.kind}
                      className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 z-30 drop-shadow-[2px_2px_0_var(--paper)]"
                    />
                  )}

                  {photo.date && panel.hero && (
                    <span className="absolute top-2 right-2 z-20 manga-tag !text-[0.6rem]">
                      {photo.date}
                    </span>
                  )}

                  {photo.caption && panel.hero && (
                    <figcaption className="absolute bottom-2 right-2 max-w-[75%] z-20 bg-[var(--paper)] border-[3px] border-[var(--ink)] px-3 py-1.5 text-[0.7rem] sm:text-xs font-bold leading-snug line-clamp-2 shadow-[3px_3px_0_var(--ink)]">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        ))}
      </div>

      {sfx && (
        <span
          className={`manga-sfx ${sfx.style} absolute bottom-[16%] left-2 text-4xl sm:text-5xl pointer-events-none z-30`}
        >
          {sfx.word}
        </span>
      )}

      {marginNote && <MarginNote text={marginNote} />}
    </div>
  );
}

/** 欄外:漫画页边那行作者碎碎念 */
function MarginNote({ text }: { text: string }) {
  return (
    <span className="absolute -bottom-6 left-0 right-0 z-30 text-[0.6rem] sm:text-[0.68rem] font-bold opacity-55 flex items-center gap-1.5 pointer-events-none">
      <span className="inline-block w-2.5 h-2.5 bg-[var(--accent)] border-2 border-[var(--ink)] shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}

function TextPage({ page }: { page: TextPageData }) {
  const { text, chapter, variant, part, marginNote } = page;

  return (
    <div className="h-full relative overflow-hidden">
      <span className="absolute -top-1 right-0 z-20 text-[0.65rem] font-black opacity-35 tracking-widest">
        第 {chapter} 话
      </span>

      {/* 中扉:漫画的章节扉页规格 —— 大话数居左下、竖排标题居右、网点压底 */}
      {variant === "tobira" && (
        <div className="h-full relative overflow-hidden">
          {/* 网点斜带,从左下切上来 */}
          <div
            className="absolute inset-0 tone-dots opacity-30"
            style={{ clipPath: "polygon(0 42%, 100% 8%, 100% 100%, 0 100%)" }}
          />
          {/* 分隔墨线 */}
          <div
            className="absolute inset-0 border-t-[3px] border-[var(--ink)]"
            style={{ clipPath: "polygon(0 42%, 100% 8%, 100% 10%, 0 44%)" }}
          />

          {/* 竖排标题:右上进入,占据整个右侧 */}
          <div className="absolute top-0 right-2 bottom-0 flex items-center">
            <p
              className="font-black leading-[1.3]"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
                letterSpacing: "0.14em",
                maxHeight: "88%",
                fontSize: text.length <= 8 ? "3rem" : text.length <= 12 ? "2.4rem" : "1.9rem",
              }}
            >
              {text}
            </p>
          </div>

          {/* 大话数:左下,压在网点上,漫画扉页的标准位置 */}
          <div className="absolute left-1 bottom-2 flex items-end gap-2">
            <span className="text-[5rem] sm:text-[7rem] font-black leading-[0.8] text-[var(--accent)] [-webkit-text-stroke:2px_var(--ink)]">
              {chapter}
            </span>
            <span className="text-xs font-black tracking-[0.3em] mb-3 opacity-60">话</span>
          </div>
        </div>
      )}

      {/* 旁白:手写体横排,像作者在页边写的话。字号随篇幅收放,长文自动续页 */}
      {variant === "narration" && (
        <div className="h-full flex items-center justify-center px-2 sm:px-4">
          <div className="absolute inset-x-10 inset-y-12 tone-dots opacity-15 rounded pointer-events-none" />
          <div className="relative max-w-xl w-full">
            <div className="h-[3px] bg-[var(--ink)] w-14 mb-4" />
            <p
              className="handwriting font-bold whitespace-pre-wrap overflow-y-auto"
              style={{
                // 短则大字,长则收小,始终把整页填得体面
                fontSize: text.length <= 60 ? "1.5rem" : text.length <= 120 ? "1.25rem" : "1.05rem",
                lineHeight: text.length <= 60 ? 2 : text.length <= 120 ? 1.9 : 1.8,
                maxHeight: "62vh",
              }}
            >
              {text}
            </p>
            <div className="flex items-center justify-between mt-4">
              <div className="h-[3px] bg-[var(--ink)] w-14" />
              {part && (
                <span className="text-[0.65rem] font-black opacity-45 tracking-widest tabular-nums">
                  {part.index} / {part.total}
                  {part.index < part.total ? " ▸" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {marginNote && <MarginNote text={marginNote} />}

      {/* 呐喊:只有真带感叹号的短句才走这里 */}
      {variant === "shout" && (
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 focus-lines opacity-70" />
          <p className="manga-sfx manga-sfx-loud relative text-center px-8 leading-tight" style={{ fontSize: text.length <= 6 ? "4rem" : text.length <= 12 ? "3rem" : "2.2rem" }}>
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
      <p className="text-[0.7rem] font-bold opacity-50 mt-2 handwriting text-base">
        {NEXT_EPISODE[chapters % NEXT_EPISODE.length]}
      </p>
    </div>
  );
}
