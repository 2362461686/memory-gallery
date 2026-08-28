/**
 * 分镜排版引擎 —— 按日式漫画的实际制版规范重写
 *
 * 依据:
 * 1. 页面由 2-3 个「段」(tier)竖向堆叠,每段横向切 1-3 格、格宽不等 —— 漫画最基本的骨架
 * 2. 格间距 2-4mm、段间距 5-7mm:窄=节奏快,宽=留白喘息
 * 3. 每页 4-8 格且要有戏剧性大小反差;满版单格只留给最重要的一刻
 * 4. 阅读动线右上入、左下出 —— 每段内部从右往左读
 * 5. 主角格出血(顶到页边)才有冲击力
 */

export interface Photo {
  url?: string;
  textOnly?: boolean;
  caption: string;
  date: string;
  /** 用户交代的地点 —— 之前完全没进阅读页,等于把用户填的信息丢了 */
  place?: string;
  color?: string;
  ratio: number;    // w/h
  interest: number; // 0-1
}

type Orientation = "portrait" | "landscape" | "square";

function orient(ratio: number): Orientation {
  if (ratio < 0.85) return "portrait";
  if (ratio > 1.2) return "landscape";
  return "square";
}

/* ---------- 段式版式:格子比例跟着图片走 ---------- */

/**
 * 关键算法(justified 行布局,自动相册排版的通行做法):
 *
 * 一段里放若干张图,让它们**等高**并排。设图片宽高比为 r1..rn,段高为 h,
 * 则段总宽 = h·(r1+…+rn)。反过来:给定页宽 W,段高 h = W / Σr。
 * 也就是说 —— **段高由这段放了什么图决定**,不是我拍脑袋定的权重。
 *
 * 这样每个格子的比例天然等于图片比例:既不用裁(不丢画面),
 * 也不会留空白边(不散架)。竖图多的段自然高,横图多的段自然矮,
 * 页面节奏就是这么出来的,不需要硬凑。
 */

export interface Panel {
  /** 横向 flex 权重 = 图片宽高比 */
  w: number;
  hero?: boolean;
  bleed?: "right" | "left" | "top" | "bottom" | "full";
}

export interface Tier {
  /** 纵向 flex 权重,由本段图片比例算出 */
  h: number;
  panels: Panel[];
}

type Orientation2 = Orientation;

/** 每段放几张:漫画一页 3-6 格,大小要有反差 —— 用「一段几张」制造反差,而不是硬掰权重 */
function rowPlan(count: number, pageIndex: number): number[] {
  if (count <= 1) return [1];
  if (count === 2) return pageIndex % 2 === 0 ? [1, 1] : [2];
  if (count === 3) return pageIndex % 2 === 0 ? [1, 2] : [2, 1];
  if (count === 4) return pageIndex % 3 === 0 ? [1, 3] : pageIndex % 3 === 1 ? [2, 2] : [1, 2, 1];
  if (count === 5) return pageIndex % 2 === 0 ? [2, 3] : [1, 2, 2];
  return pageIndex % 2 === 0 ? [3, 3] : [2, 2, 2];
}

/** 把一页的图按行计划切成段,段高由该段图片比例算出 */
function buildTiers(group: Photo[], pageIndex: number): { tiers: Tier[]; order: Photo[] } {
  const plan = rowPlan(group.length, pageIndex);
  const order = [...group];
  const tiers: Tier[] = [];
  let k = 0;

  // 先按计划分行,再算每行的相对高度
  const rows: Photo[][] = [];
  for (const n of plan) {
    const row = order.slice(k, k + n);
    if (row.length) rows.push(row);
    k += n;
  }
  // 剩余的图并进最后一行,一张都不丢
  if (k < order.length && rows.length) rows[rows.length - 1].push(...order.slice(k));

  // 段高 ∝ 1 / Σ(该段图片宽高比) —— 竖图多的段自然高
  const inverse = rows.map((row) => 1 / row.reduce((sum, p) => sum + clampRatio(p.ratio), 0));

  rows.forEach((row, ri) => {
    tiers.push({
      h: inverse[ri],
      panels: row.map((p, pi) => ({
        w: clampRatio(p.ratio),
        // 主角格:整页第一张(已按兴趣度排到最前)且该段不止一格时给它出血
        hero: ri === 0 && pi === 0,
        bleed: ri === 0 && pi === 0 ? (row.length === 1 ? "top" : "right") : undefined,
      })),
    });
  });

  return { tiers, order: rows.flat() };
}

/** 极端比例会把版面拉垮,收进合理区间 */
function clampRatio(r: number): number {
  if (!Number.isFinite(r) || r <= 0) return 4 / 3;
  return Math.min(2.4, Math.max(0.45, r));
}

/* ---------- 分页节奏 ---------- */

/** 每页放几张:漫画一页 3-6 格,关键是有起伏 —— 密集页之后给一张满版喘息 */
function pageSizes(total: number): number[] {
  const sizes: number[] = [];
  let left = total;
  let i = 0;
  while (left > 0) {
    let take: number;
    if (left <= 6) take = left;
    else if (i % 5 === 2) take = 1;
    else if (i % 5 === 4) take = 6;
    else take = [4, 5, 3, 5][i % 4];
    sizes.push(Math.min(take, left));
    left -= Math.min(take, left);
    i++;
  }
  return sizes;
}

/* ---------- 输出结构 ---------- */

export interface PlacedPanel {
  photo: Photo;
  panel: Panel;
}

export interface PlacedTier {
  h: number;
  items: PlacedPanel[];
}

export interface PhotoPageData {
  template: string;
  tiers: PlacedTier[];
  chapter: number;
  color?: string;
  sfx?: { word: string; style: string };
  focus?: boolean;
  /** 页边作者吐槽 */
  marginNote?: string;
}

export interface TextPageData {
  kind: "text";
  text: string;
  /** 这段话写于何时何地 —— 用户交代过就显示 */
  meta?: string;
  chapter: number;
  color?: string;
  variant: "tobira" | "narration" | "shout";
  /** 长文分页时的页序,单页为 undefined */
  part?: { index: number; total: number };
  marginNote?: string;
}

/** 一页旁白的容量上限:超过就分页,不截断 */
const NARRATION_PAGE_CHARS = 240;

/**
 * 长文切页:优先在段落处断开,其次在句末,最后才硬断。
 * 用户想写多长写多长 —— 排版负责把它排下,不负责限制他。
 */
function splitNarration(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= NARRATION_PAGE_CHARS) return [trimmed];

  // 切成最小不可分单元:先自然段,段内再按句末标点
  const units: string[] = [];
  for (const para of trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    if (para.length <= NARRATION_PAGE_CHARS) {
      units.push(para);
      continue;
    }
    for (const sentence of para.match(/[^。!?!?;;\n]+[。!?!?;;]?/g) || [para]) {
      // 单句仍超长(没标点的长串):硬切,一个字都不丢
      for (let i = 0; i < sentence.length; i += NARRATION_PAGE_CHARS) {
        units.push(sentence.slice(i, i + NARRATION_PAGE_CHARS));
      }
    }
  }

  // 贪心装页
  const pages: string[] = [];
  let buf = "";
  for (const unit of units) {
    if (!buf) {
      buf = unit;
    } else if (buf.length + unit.length + 2 <= NARRATION_PAGE_CHARS) {
      buf += `\n\n${unit}`;
    } else {
      pages.push(buf);
      buf = unit;
    }
  }
  if (buf) pages.push(buf);
  return pages;
}

export interface Chapter {
  no: number;
  photos: Photo[];
  color?: string;
}

/** 拟声词库:词 + 表现风格 */
export const SFX_POOL = [
  { word: "咔嚓", style: "" },
  { word: "哗——", style: "manga-sfx-soft" },
  { word: "叮", style: "manga-sfx-soft" },
  { word: "砰!", style: "manga-sfx-loud" },
  { word: "唰", style: "" },
  { word: "嗡——", style: "manga-sfx-hollow" },
  { word: "嗒", style: "manga-sfx-soft" },
  { word: "轰!!", style: "manga-sfx-loud" },
  { word: "呼——", style: "manga-sfx-hollow" },
  { word: "啪", style: "" },
  { word: "沙沙", style: "manga-sfx-soft" },
  { word: "咚", style: "manga-sfx-loud" },
] as const;

/**
 * 欄外吐槽:漫画页边那行作者碎碎念,是梗的正确归宿。
 * 分镜格里保持干净,俏皮话都收在这条窄边上 —— 想看的会看,不看也不碍事。
 */
export const MARGIN_NOTES = [
  "这张的活人感,拉满了",
  "谷子可以断,回忆不能断",
  "存图一时爽,一直存图一直爽",
  "翻到这页的你,今天也辛苦了",
  "画面很好,可惜当时没吃饱",
  "此处应有 BGM",
  "编辑说这张要放大,我照做了",
  "情绪价值,由这一格提供",
  "作者本人当时并不知道会被存进回忆录",
  "这一格,我磨了很久",
  "如果这页让你破防了,那就对了",
  "下次一定拍横的",
  "敬当时的自己一杯",
  "本页无台词,请自行脑补",
  "痛,但值得留着",
  "截图也是回忆的一种,别嫌弃它",
  "翻页的手,请轻一点",
  "第 N 次翻到这里了吧",
] as const;

/** 封底的下回预告,漫画惯例 */
export const NEXT_EPISODE = [
  "下一话:还没发生的那些日子",
  "下一话:你还没拍下的那张照片",
  "下一话:未定 —— 因为还没过完",
  "下一话:等你回来继续画",
] as const;

/** 文字页形态:先看语气再看长度,呐喊只留给真正在喊的句子 */
function pickTextVariant(text: string): "tobira" | "narration" | "shout" {
  const t = text.trim();
  if (/[!!]/.test(t) && t.length <= 16) return "shout";
  if (t.length <= 16) return "tobira";
  return "narration";
}

/** 把若干「话」排成书页 */
export function paginate(
  chapters: Chapter[],
  /** 用户自定义的页边吐槽;传空则用内置那套 */
  marginNotes: readonly string[] = MARGIN_NOTES
): (PhotoPageData | TextPageData)[] {
  const notes = marginNotes.length ? marginNotes : MARGIN_NOTES;
  const pages: (PhotoPageData | TextPageData)[] = [];
  let counter = 0;

  for (const chapter of chapters) {
    for (const note of chapter.photos.filter((p) => p.textOnly)) {
      const variant = pickTextVariant(note.caption);
      // 旁白可能很长 —— 切成多页连排,写多少都排得下
      const parts = variant === "narration" ? splitNarration(note.caption) : [note.caption.trim()];
      parts.forEach((text, i) => {
        pages.push({
          kind: "text",
          text,
          meta: [note.date, note.place].filter(Boolean).join(" · ") || undefined,
          chapter: chapter.no,
          color: chapter.color,
          variant,
          part: parts.length > 1 ? { index: i + 1, total: parts.length } : undefined,
          marginNote: i === parts.length - 1 ? notes[(chapter.no + i) % notes.length] : undefined,
        });
      });
    }

    const pics = chapter.photos.filter((p) => !p.textOnly);
    let cursor = 0;
    let pageIdx = 0;

    for (const size of pageSizes(pics.length)) {
      const group = pics.slice(cursor, cursor + size);
      cursor += size;

      // 兴趣度最高的那张提到最前,它会落进主角格;截图大片纯色自动沉底
      const sorted = [...group];
      if (sorted.length > 1) {
        const bestIdx = sorted.reduce((b, p, i) => (p.interest > sorted[b].interest ? i : b), 0);
        const [best] = sorted.splice(bestIdx, 1);
        sorted.unshift(best);
      }

      const built = buildTiers(sorted, pageIdx);
      const tiers: PlacedTier[] = [];
      let k = 0;
      for (const tier of built.tiers) {
        const items: PlacedPanel[] = tier.panels.map((panel) => ({ photo: built.order[k++], panel }));
        if (items.length) tiers.push({ h: tier.h, items });
      }

      pages.push({
        template: `${tiers.map((t) => t.items.length).join("-")}`,
        tiers,
        chapter: chapter.no,
        color: chapter.color,
        sfx: counter % 3 === 1 ? SFX_POOL[counter % SFX_POOL.length] : undefined,
        focus: counter % 5 === 3,
        // 每两页一条页边吐槽,不是每页都有 —— 话密了就不好笑了
        marginNote: counter % 2 === 0 ? notes[counter % notes.length] : undefined,
      });
      pageIdx++;
      counter++;
    }
  }
  return pages;
}

/** 一话的色调:取这话里兴趣度最高那张的主色 */
export function chapterColor(photos: Photo[]): string | undefined {
  const withColor = photos.filter((p) => p.color);
  if (!withColor.length) return undefined;
  return withColor.reduce((best, p) => (p.interest > best.interest ? p : best), withColor[0]).color;
}
