"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { paginate, chapterColor, NEXT_EPISODE, MARGIN_NOTES as BUILTIN_MARGIN_NOTES, type Photo, type Chapter, type PhotoPageData, type TextPageData } from "./layout-engine";
import { MangaMark, pickMark } from "./manga-marks";

// 只声明阅读器真正用到的字段,与 store 的 PostRecord 结构兼容
interface Exhibit {
  id: string;
  mediaUrls: string;
  contentText?: string | null;
  aiDescription?: string | null;
  postedAt?: Date | string | null;
  location?: string | null;
  batchId?: string | null;
  dominantColor?: string | null;
  aspectRatio?: number | null;
  interest?: number | null;
}

interface MangaReaderProps {
  exhibits: Exhibit[];
  title: string;
  description?: string | null;
  /** 用户自定义的页边吐槽,不传则用内置 */
  marginNotes?: string[];
}

function formatDay(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

type Page =
  | { kind: "cover"; cover?: Photo; color?: string; marginNote?: string }
  | ({ kind: "photos" } & PhotoPageData)
  | TextPageData
  | { kind: "back"; count: number; range: string; chapters: number; notes: number; marginNote?: string };

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
        groups.get(key)!.push({ textOnly: true, caption, date: formatDay(ex.postedAt), place: ex.location || undefined, ratio: 1, interest: 0 });
      }
      continue;
    }
    for (const url of urls) {
      groups.get(key)!.push({
        url,
        caption,
        date: formatDay(ex.postedAt),
        place: ex.location || undefined,
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

export default function MangaReader({ exhibits, title, description, marginNotes }: MangaReaderProps) {
  const pages = useMemo<Page[]>(() => {
    const chapters = buildChapters(exhibits);
    // 封面/封底也带一句欄外 —— 否则首屏永远看不到这个设计
    // marginNotes 传了空数组 = 用户主动关闭;undefined = 没配置过,用内置
    const off = marginNotes !== undefined && marginNotes.length === 0;
    const pool = marginNotes?.length ? marginNotes : BUILTIN_MARGIN_NOTES;
    const noteAt = (i: number) => (off ? undefined : pool[i % pool.length]);
    const all = chapters.flatMap((c) => c.photos);
    const pics = all.filter((p) => !p.textOnly);
    const cover = pics.length
      ? pics.reduce((best, p) => (p.interest > best.interest ? p : best), pics[0])
      : undefined;
    const dates = all.map((p) => p.date).filter(Boolean);

    return [
      { kind: "cover", cover, color: cover?.color, marginNote: noteAt(0) },
      ...paginate(chapters, marginNotes ?? BUILTIN_MARGIN_NOTES).map((p) => ("kind" in p ? p : { kind: "photos" as const, ...p })),
      {
        kind: "back" as const,
        count: pics.length,
        notes: all.length - pics.length,
        chapters: chapters.length,
        range: dates.length ? `${dates[dates.length - 1]} — ${dates[0]}` : "",
        marginNote: noteAt(1),
      },
    ];
  }, [exhibits, marginNotes]);

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
        <div key={page} className="absolute inset-x-0 top-0 bottom-8 sm:bottom-9 pt-4 px-4 sm:pt-6 sm:px-6 motion-safe:animate-[pageIn_0.24s_ease-out]">
          {current.kind === "cover" && <CoverPage title={title} description={description} cover={current.cover} />}
          {current.kind === "photos" && <PhotoPage page={current} />}
          {current.kind === "text" && <TextPage page={current} />}
          {current.kind === "back" && <BackPage {...current} />}
        </div>

        {/* 欄外:书脚带做成实心墨条,白字反白 —— 像单行本页脚那条印刷带,不是灰色小字 */}
        {"marginNote" in current && current.marginNote ? (
          <div className="absolute bottom-0 inset-x-0 h-8 sm:h-9 bg-[var(--ink)] flex items-center gap-2 px-3 sm:px-5 z-30 pointer-events-none">
            <span className="shrink-0 px-1.5 py-[1px] bg-[var(--sun)] border-2 border-[var(--paper)] text-[0.55rem] font-black text-[#17130e] tracking-wider">
              欄外
            </span>
            <span className="truncate text-[0.68rem] sm:text-[0.78rem] font-bold text-[var(--paper)] handwriting">
              {current.marginNote}
            </span>
            <span className="ml-auto shrink-0 text-[0.6rem] font-black text-[var(--paper)] opacity-50 tabular-nums">
              {page + 1}
            </span>
          </div>
        ) : null}

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
  const { tiers, chapter, sfx, focus } = page;

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
                    className={`manga-panel h-full w-full ${
                      focus && panel.hero ? "focus-lines" : ""
                    } ${bleed ? "manga-panel-bleed" : ""}`}
                    style={{
                      backgroundColor: photo.color
                        ? `color-mix(in srgb, ${photo.color} 16%, var(--paper))`
                        : undefined,
                    }}
                  >
                    <img
                      src={photo.url}
                      alt={
                        [photo.caption, photo.date, photo.place].filter(Boolean).join("、") ||
                        "一张没有文字说明的回忆照片"
                      }
                      loading="lazy"
                    />
                  </div>

                  {markTarget?.ti === ti && markTarget?.pi === pi && (
                    <MangaMark
                      kind={markTarget.kind}
                      className="absolute -top-3 -left-3 w-8 h-8 sm:w-10 sm:h-10 z-30 drop-shadow-[2px_2px_0_var(--paper)]"
                    />
                  )}

                  {/* 旁白框:漫画里交代时间地点的方框,压在格子左上角。
                      用户填过什么就显示什么 —— 这是真实回忆,比随机吐槽重要 */}
                  {(photo.date || photo.place) && (
                    <span className="absolute top-0 left-0 z-20 bg-[var(--paper)] border-r-[3px] border-b-[3px] border-[var(--ink)] px-2 py-[3px] text-[0.58rem] sm:text-[0.65rem] font-black leading-tight max-w-[80%] truncate">
                      {[photo.date, photo.place].filter(Boolean).join(" · ")}
                    </span>
                  )}

                  {/* 用户原话:对白框,压在格底 */}
                  {photo.caption && (
                    <figcaption className="absolute bottom-2 right-2 max-w-[80%] z-20 bg-[var(--paper)] border-[3px] border-[var(--ink)] px-2.5 py-1.5 text-[0.65rem] sm:text-xs font-bold leading-snug line-clamp-2 shadow-[3px_3px_0_var(--ink)]">
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

    </div>
  );
}

function TextPage({ page }: { page: TextPageData }) {
  const { text, chapter, variant, part, meta } = page;

  return (
    <div className="h-full relative overflow-hidden">
      <span className="absolute -top-1 right-0 z-20 text-[0.65rem] font-black opacity-35 tracking-widest">
        第 {chapter} 话
      </span>

      {/* 中扉:左窄带压网点作重心,文字区留纯净纸面 —— 字不压在点上 */}
      {variant === "tobira" && (
        <div className="h-full relative flex">
          {/* 左侧窄带:实色 + 网点,只占三分之一,不侵入文字 */}
          <div className="relative w-[30%] sm:w-[26%] shrink-0 border-r-[3px] border-[var(--ink)] overflow-hidden">
            <div className="absolute inset-0 tone-dots opacity-35" />
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[var(--accent)] border-t-[3px] border-[var(--ink)]" />
            {/* 大话数压在色块上 */}
            <div className="absolute left-0 right-0 bottom-3 flex flex-col items-center">
              <span className="text-[3.4rem] sm:text-[4.6rem] font-black leading-[0.85] text-[var(--paper)] [-webkit-text-stroke:2px_var(--ink)]">
                {chapter}
              </span>
              <span className="text-[0.6rem] font-black tracking-[0.4em] text-[var(--paper)] mt-0.5">
                第 話
              </span>
              {meta && (
                <span className="mt-2 text-[0.55rem] font-black text-[var(--paper)] opacity-75 px-1 text-center leading-tight">
                  {meta}
                </span>
              )}
            </div>
          </div>

          {/* 右侧:纯纸面,竖排标题居中 */}
          <div className="flex-1 flex items-center justify-center px-4">
            <p
              className="font-black leading-[1.35]"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
                letterSpacing: "0.16em",
                maxHeight: "84%",
                fontSize: text.length <= 8 ? "2.8rem" : text.length <= 12 ? "2.2rem" : "1.8rem",
              }}
            >
              {text}
            </p>
          </div>
        </div>
      )}

      {/* 旁白:干净纸面上的手写稿,装饰只在左缘 —— 不在字底下铺网点 */}
      {variant === "narration" && (
        <div className="h-full flex items-center justify-center px-3 sm:px-8">
          {/* 左缘:装订线 + 红标记,像稿纸 */}
          <div className="absolute left-3 sm:left-6 top-8 bottom-8 w-[3px] bg-[var(--ink)] opacity-25" />
          <div className="absolute left-[9px] sm:left-[18px] top-10 w-2.5 h-2.5 bg-[var(--accent)] border-2 border-[var(--ink)]" />

          <div className="relative max-w-xl w-full pl-5 sm:pl-8">
            <p
              className="handwriting font-bold whitespace-pre-wrap overflow-y-auto"
              style={{
                fontSize: text.length <= 60 ? "1.6rem" : text.length <= 120 ? "1.3rem" : "1.1rem",
                lineHeight: text.length <= 60 ? 2.1 : text.length <= 120 ? 2 : 1.95,
                maxHeight: "58vh",
              }}
            >
              {text}
            </p>
            <div className="flex items-center justify-between mt-5 gap-3">
              {meta ? (
                <span className="text-[0.62rem] font-black opacity-55 truncate">{meta}</span>
              ) : (
                <div className="h-[3px] bg-[var(--ink)] w-12" />
              )}
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
