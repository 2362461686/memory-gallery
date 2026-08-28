/**
 * 分镜排版引擎
 *
 * 思路来自自动相册排版的通行做法(BRIC / Automosaic 一类):
 * 版式不是写死的网格,而是按每张图的实际宽高比选择 —— 竖图给竖格、横图给横格,
 * 谁都不会被裁变形。主角格由"视觉兴趣度"决定,不是取第一张。
 *
 * 这样即使照片没有任何拍摄时间、地点信息(比如截图),版面依然有节奏。
 */

export interface Photo {
  /** 纯文字回忆没有图 */
  url?: string;
  /** 纯文字页:整页只放这段话 */
  textOnly?: boolean;
  caption: string;
  date: string;
  color?: string;
  ratio: number;   // w/h,缺省按 4:3
  interest: number; // 0-1
}

export type Cell = { area: string; hero?: boolean };
export type Layout = { name: string; cols: string; rows: string; cells: Cell[] };

type Orientation = "portrait" | "landscape" | "square";

function orient(ratio: number): Orientation {
  if (ratio < 0.85) return "portrait";
  if (ratio > 1.2) return "landscape";
  return "square";
}

/* ---------- 版式库:按"这一组图的构成"挑,不是按顺序轮转 ---------- */

const L = {
  full: { name: "满版", cols: "1fr", rows: "1fr", cells: [{ area: "1/1/2/2", hero: true }] },

  // 两张横图 → 上下叠
  stackH: { name: "上下", cols: "1fr", rows: "1.4fr 1fr", cells: [{ area: "1/1/2/2", hero: true }, { area: "2/1/3/2" }] },
  // 两张竖图 → 左右并
  sideV: { name: "并排", cols: "1fr 1fr", rows: "1fr", cells: [{ area: "1/1/2/2", hero: true }, { area: "1/2/2/3" }] },
  // 混合两张 → 大小对比
  duoMix: { name: "主副", cols: "1.5fr 1fr", rows: "1fr", cells: [{ area: "1/1/2/2", hero: true }, { area: "1/2/2/3" }] },

  // 三张,主图是竖的 → 左立柱
  columnV: { name: "立柱", cols: "1.3fr 1fr", rows: "1fr 1fr", cells: [{ area: "1/1/3/2", hero: true }, { area: "1/2/2/3" }, { area: "2/2/3/3" }] },
  // 三张,主图是横的 → 上通栏
  bannerH: { name: "通栏", cols: "1fr 1fr", rows: "1.45fr 1fr", cells: [{ area: "1/1/2/3", hero: true }, { area: "2/1/3/2" }, { area: "2/2/3/3" }] },
  // 三张竖图 → 三联竖切
  tripleV: { name: "三联", cols: "1fr 1fr 1fr", rows: "1fr", cells: [{ area: "1/1/2/2", hero: true }, { area: "1/2/2/3" }, { area: "1/3/2/4" }] },

  // 四张,主图横 → 上通栏 + 下三格
  quadBanner: { name: "通栏三格", cols: "1fr 1fr 1fr", rows: "1.5fr 1fr", cells: [{ area: "1/1/2/4", hero: true }, { area: "2/1/3/2" }, { area: "2/2/3/3" }, { area: "2/3/3/4" }] },
  // 四张,主图竖 → 左立柱 + 右三格
  quadColumn: { name: "立柱三格", cols: "1.25fr 1fr", rows: "1fr 1fr 1fr", cells: [{ area: "1/1/4/2", hero: true }, { area: "1/2/2/3" }, { area: "2/2/3/3" }, { area: "3/2/4/3" }] },
  // 四张混杂 → 田字带放大
  quadGrid: { name: "田字", cols: "1.3fr 1fr", rows: "1.3fr 1fr", cells: [{ area: "1/1/2/2", hero: true }, { area: "1/2/2/3" }, { area: "2/1/3/2" }, { area: "2/2/3/3" }] },
} satisfies Record<string, Layout>;

/** 按这一组图的朝向构成,挑最不糟蹋图片的版式 */
function pickLayout(group: Photo[]): Layout {
  const n = group.length;
  const heroOrient = orient(group[0].ratio);
  const allPortrait = group.every((p) => orient(p.ratio) === "portrait");

  if (n === 1) return L.full;
  if (n === 2) {
    if (allPortrait) return L.sideV;
    if (group.every((p) => orient(p.ratio) === "landscape")) return L.stackH;
    return L.duoMix;
  }
  if (n === 3) {
    if (allPortrait) return L.tripleV;
    return heroOrient === "portrait" ? L.columnV : L.bannerH;
  }
  if (allPortrait) return L.quadColumn;
  return heroOrient === "portrait" ? L.quadColumn : heroOrient === "landscape" ? L.quadBanner : L.quadGrid;
}

/** 每页放几张:竖图占地小可以多放,横图少放,让版面疏密有致 */
function pageSize(remaining: Photo[], index: number): number {
  if (remaining.length <= 4) return remaining.length;
  const portraits = remaining.slice(0, 4).filter((p) => orient(p.ratio) === "portrait").length;
  // 节奏:偶尔来一张满版单图当喘息,避免通篇密集
  if (index % 4 === 2) return 1;
  if (portraits >= 3) return 4;
  return index % 2 === 0 ? 3 : 2;
}

export interface Chapter {
  no: number;
  photos: Photo[];
  color?: string;
}

export interface PhotoPageData {
  layout: Layout;
  items: Photo[];
  chapter: number;
  color?: string;
  sfx?: { word: string; style: string };
  /** 主角格加集中线,整本里稀疏出现,用于强调 */
  focus?: boolean;
}

export interface TextPageData {
  kind: "text";
  text: string;
  chapter: number;
  color?: string;
  /** 气泡形态:独白用云朵,短句用呐喊框,其余用手写旁白 */
  variant: "thought" | "shout" | "narration";
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
 * 把若干"话"排成书页。
 * 每一话内部:兴趣度最高的图升为主角格,其余按原顺序跟随。
 */
export function paginate(chapters: Chapter[]): (PhotoPageData | TextPageData)[] {
  const pages: (PhotoPageData | TextPageData)[] = [];
  let sfxCounter = 0;

  for (const chapter of chapters) {
    // 纯文字回忆各自独占一页
    for (const note of chapter.photos.filter((p) => p.textOnly)) {
      pages.push({
        kind: "text",
        text: note.caption,
        chapter: chapter.no,
        color: chapter.color,
        variant: note.caption.length <= 12 ? "shout" : note.caption.length <= 60 ? "thought" : "narration",
      });
    }

    let rest = chapter.photos.filter((p) => !p.textOnly);
    let idx = 0;

    while (rest.length > 0) {
      const take = pageSize(rest, idx);
      const group = rest.slice(0, take);
      rest = rest.slice(take);

      // 主角格给这一页里最"有内容"的那张 —— 截图大片纯色会自动沉底
      const heroIdx = group.reduce((best, p, i) => (p.interest > group[best].interest ? i : best), 0);
      if (heroIdx > 0) {
        const [hero] = group.splice(heroIdx, 1);
        group.unshift(hero);
      }

      pages.push({
        layout: pickLayout(group),
        items: group,
        chapter: chapter.no,
        color: chapter.color,
        // 拟声词稀疏投放:满页都是就成噪音
        sfx: sfxCounter % 3 === 1 ? SFX_POOL[sfxCounter % SFX_POOL.length] : undefined,
        // 集中线更稀疏,每 5 页一次强调
        focus: sfxCounter % 5 === 3,
      });
      idx++;
      sfxCounter++;
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
