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

/* ---------- 段式版式 ---------- */

export interface Panel {
  /** 同段内的相对宽度 */
  w: number;
  hero?: boolean;
  /** 出血:顶到页面边缘不留白边 */
  bleed?: "right" | "left" | "top" | "bottom" | "full";
}

export interface Tier {
  /** 段与段之间的相对高度 */
  h: number;
  panels: Panel[];
}

export interface Template {
  name: string;
  tiers: Tier[];
  fits: Orientation[];
}

/** 版式库:每个都是真实漫画常见的段式结构 */
const TEMPLATES: Template[] = [
  {
    name: "大扉",
    fits: ["landscape", "portrait", "square"],
    tiers: [{ h: 1, panels: [{ w: 1, hero: true, bleed: "full" }] }],
  },
  {
    name: "二格·上重",
    fits: ["landscape", "square"],
    tiers: [
      { h: 1.8, panels: [{ w: 1, hero: true, bleed: "top" }] },
      { h: 1, panels: [{ w: 1 }] },
    ],
  },
  {
    name: "二格·右重",
    fits: ["portrait"],
    tiers: [{ h: 1, panels: [{ w: 1 }, { w: 1.5, hero: true, bleed: "right" }] }],
  },
  {
    name: "上通栏·下二",
    fits: ["landscape", "square"],
    tiers: [
      { h: 1.75, panels: [{ w: 1, hero: true, bleed: "top" }] },
      { h: 1, panels: [{ w: 1.35 }, { w: 1 }] },
    ],
  },
  {
    name: "三格·竖切",
    fits: ["portrait"],
    tiers: [{ h: 1, panels: [{ w: 1 }, { w: 1 }, { w: 1.45, hero: true, bleed: "right" }] }],
  },
  {
    name: "起承转合",
    fits: ["landscape", "square"],
    tiers: [
      { h: 1.5, panels: [{ w: 1, hero: true, bleed: "top" }] },
      { h: 1, panels: [{ w: 1 }, { w: 1.3 }] },
      { h: 0.85, panels: [{ w: 1 }] },
    ],
  },
  {
    name: "三段·右重",
    fits: ["portrait"],
    tiers: [
      { h: 1, panels: [{ w: 1 }, { w: 1.6, hero: true, bleed: "right" }] },
      { h: 1.25, panels: [{ w: 1 }] },
      { h: 0.9, panels: [{ w: 1 }] },
    ],
  },
  {
    name: "五格·上重",
    fits: ["landscape", "square"],
    tiers: [
      { h: 1.6, panels: [{ w: 1.7, hero: true, bleed: "right" }, { w: 1 }] },
      { h: 1, panels: [{ w: 1 }, { w: 1.2 }] },
      { h: 0.8, panels: [{ w: 1 }] },
    ],
  },
  {
    name: "五格·竖切",
    fits: ["portrait"],
    tiers: [
      { h: 1.7, panels: [{ w: 1 }, { w: 1 }, { w: 1.4, hero: true, bleed: "right" }] },
      { h: 1, panels: [{ w: 1.3 }, { w: 1 }] },
    ],
  },
  {
    name: "六格·日常",
    fits: ["square", "landscape", "portrait"],
    tiers: [
      { h: 1.35, panels: [{ w: 1 }, { w: 1.5, hero: true, bleed: "right" }] },
      { h: 1, panels: [{ w: 1 }, { w: 1 }, { w: 1 }] },
      { h: 0.95, panels: [{ w: 1.4 }] },
    ],
  },
];

function panelCount(t: Template): number {
  return t.tiers.reduce((n, tier) => n + tier.panels.length, 0);
}

function dominantOrientation(group: Photo[]): Orientation {
  const counts = { portrait: 0, landscape: 0, square: 0 };
  for (const p of group) counts[orient(p.ratio)]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Orientation;
}

/** 挑版式:格数必须匹配,再按这组图的朝向倾向选 */
function pickTemplate(group: Photo[], pageIndex: number): Template {
  const n = group.length;
  if (n === 1) return TEMPLATES[0];

  const dominant = dominantOrientation(group);
  const exact = TEMPLATES.filter((t) => panelCount(t) === n);
  const pool = exact.length ? exact : TEMPLATES.filter((t) => panelCount(t) <= n);
  if (pool.length === 0) return TEMPLATES[0];

  const fitted = pool.filter((t) => t.fits.includes(dominant));
  const finalPool = fitted.length ? fitted : pool;
  return finalPool[pageIndex % finalPool.length];
}

/* ---------- 分页节奏 ---------- */

/** 每页格数:漫画一页 4-8 格,日常题材偏 3-5;关键是有起伏,密集页后给满版喘息 */
function pageSizes(total: number): number[] {
  const sizes: number[] = [];
  let left = total;
  let i = 0;
  while (left > 0) {
    let take: number;
    if (left <= 6) {
      take = left;
    } else if (i % 5 === 2) {
      take = 1;
    } else if (i % 5 === 4) {
      take = 6;
    } else {
      take = [4, 5, 3, 5][i % 4];
    }
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

      const template = pickTemplate(group, pageIdx);
      const slots = template.tiers.flatMap((t) => t.panels);

      // 主角格拿这一页里最"有内容"的那张:截图大片纯色会自动沉底
      const heroSlot = slots.findIndex((p) => p.hero);
      const sorted = [...group];
      if (heroSlot >= 0 && sorted.length > 1) {
        const bestIdx = sorted.reduce((b, p, i) => (p.interest > sorted[b].interest ? i : b), 0);
        const [best] = sorted.splice(bestIdx, 1);
        sorted.splice(Math.min(heroSlot, sorted.length), 0, best);
      }

      const tiers: PlacedTier[] = [];
      let k = 0;
      for (const tier of template.tiers) {
        const items: PlacedPanel[] = [];
        for (const panel of tier.panels) {
          if (k < sorted.length) items.push({ photo: sorted[k++], panel });
        }
        if (items.length) tiers.push({ h: tier.h, items });
      }

      pages.push({
        template: template.name,
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
