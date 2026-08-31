import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import {
  findExhibitionsByUser,
  getExhibitionPostCounts,
  getExhibitionCovers,
  findUserById,
  findPostsByUser,
} from "@/lib/store";
import Link from "next/link";
import { IconPlus, IconGallery, IconMapPin } from "@/lib/icons";
import BindButton from "@/components/BindButton";
import { mediaSrc } from "@/lib/media";

/**
 * 主界面 = 这本书的目次扉页。
 *
 * 改版前这里是「文字为主 + 照片作 56px 缩略图」——一个回忆录产品,
 * 把用户的照片压成了列表右边的小方块,而屏幕上最占地方的是空刊头和重复的日期。
 * 那是文件管理器的信息结构,不是回忆录的。
 *
 * 现在反过来:每一话是一条真正的分镜,格宽 ∝ 照片宽高比 ——
 * 竖图不裁、横图不撑,和阅读器 layout-engine 是同一套算法。
 * 日期地点退成旁白框,手记退成对白框。照片是主角。
 */

interface Shot {
  url: string;
  ratio: number;
  interest: number;
  color?: string;
}

interface Episode {
  day: string;
  /** 同一天有好几话时,时刻才是区分它们的东西 */
  clock: string;
  shots: Shot[];
  texts: string[];
  location?: string;
  color?: string;
}

/** 极端比例会把一条分镜拉垮 —— 全景图和长截图都夹到可用区间内 */
const clampRatio = (r: number) => Math.min(Math.max(r || 4 / 3, 0.52), 2.4);

// 分组:优先按上传批次(一起传的就是一件事),老数据无批次时退回按天
function groupPosts(posts: ReturnType<typeof findPostsByUser>): Episode[] {
  const groups = new Map<string, Episode>();
  for (const post of posts) {
    const when = new Date(post.postedAt || post.createdAt);
    const day = when.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    const clock = when.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    const key = post.batchId || `day:${day}`;
    if (!groups.has(key)) groups.set(key, { day, clock, shots: [], texts: [] });
    const entry = groups.get(key)!;
    try {
      for (const url of JSON.parse(post.mediaUrls) as string[]) {
        entry.shots.push({
          url,
          ratio: clampRatio(post.aspectRatio ?? 4 / 3),
          interest: post.interest ?? 0.5,
          color: post.dominantColor,
        });
      }
    } catch { /* 老数据里可能有非法 JSON,跳过 */ }
    if (post.contentText) entry.texts.push(post.contentText);
    if (post.location && !entry.location) entry.location = post.location;
    if (post.dominantColor && !entry.color) entry.color = post.dominantColor;
  }
  return [...groups.values()];
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");

  const user = findUserById(session.id);
  const userName = user?.name || session.email?.split("@")[0] || "旅人";
  const exhibitions = findExhibitionsByUser(session.id);
  const counts = getExhibitionPostCounts(exhibitions.map((e) => e.id));
  const covers = getExhibitionCovers(exhibitions.map((e) => e.id));
  const posts = findPostsByUser(session.id);
  const unbound = findPostsByUser(session.id, { isProcessed: false });
  const timeline = groupPosts(posts);
  const photoCount = posts.filter((p) => p.contentType !== "text").length;
  const noteCount = posts.length - photoCount;

  const empty = posts.length === 0 && exhibitions.length === 0;

  // 表紙用的主角照:全部照片里视觉兴趣度最高的那张,而不是「最近一话的第一张」。
  // 旧写法在最近一话是纯手记时直接不渲染,刊头就空掉三分之二。
  const allShots = timeline.flatMap((t) => t.shots);
  const cover = allShots.length
    ? allShots.reduce((best, s) => (s.interest > best.interest ? s : best), allShots[0])
    : undefined;

  const places = [...new Set(timeline.map((t) => t.location).filter(Boolean))];
  const latest = timeline[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {empty ? <EmptyState /> : (
        <>
          {/* ════ 表紙:标题与主角格并排,照片顶到刊头内缘 ════ */}
          <section className="masthead mb-12 overflow-hidden">
            <div className="grid sm:grid-cols-[1fr_minmax(0,17rem)]">
              <div className="p-6 sm:p-8 min-w-0 flex flex-col justify-center order-2 sm:order-1">
                <span className="manga-tag manga-tag-accent rotate-[-3deg] inline-block self-start mb-4">
                  连载中
                </span>
                <h1 className="display text-4xl sm:text-5xl leading-[1.08] mb-4" style={{ textWrap: "balance" }}>
                  {userName} 的回忆录
                </h1>
                {latest && (
                  <p className="text-sm font-black mb-1 tabular-nums">
                    最近一话 · {latest.day}
                    {latest.location ? ` · ${latest.location}` : ""}
                  </p>
                )}
                <p className="text-xs font-bold opacity-50 tabular-nums">
                  全 {timeline.length} 话 · {photoCount} 张照片
                  {noteCount > 0 ? ` · ${noteCount} 段手记` : ""}
                  {places.length > 0
                    ? ` · 去过 ${places.slice(0, 2).join("、")}${places.length > 2 ? " 等地" : ""}`
                    : ""}
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                  {unbound.length > 0 && (
                    <span className="fx-breathe inline-block">
                      <BindButton postCount={unbound.length} />
                    </span>
                  )}
                  <Link href="/import" className="manga-btn manga-btn-ghost">
                    <IconPlus size={16} />收录新回忆
                  </Link>
                </div>
              </div>

              {/* 主角格:有照片就上照片,没有就上 ベタ ——
                  这一块永远不留白,空着的刊头比什么都不放更糟 */}
              <div className="order-1 sm:order-2 relative min-h-[13rem] sm:min-h-0 border-b-[3px] sm:border-b-0 sm:border-l-[3px] border-[var(--ink)] overflow-hidden">
                {cover ? (
                  <div className="fx-kenburns absolute inset-0">
                    <img src={mediaSrc(cover.url)} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[var(--ink)] flex flex-col items-center justify-center gap-1">
                    <span className="display text-5xl text-[var(--paper)] leading-none tabular-nums">
                      {String(timeline.length).padStart(2, "0")}
                    </span>
                    <span className="text-[0.6rem] font-black tracking-[0.35em] text-[var(--paper)] opacity-70">
                      話
                    </span>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 manga-tag !text-[0.62rem]">
                  第 {timeline.length} 话
                </span>
              </div>
            </div>
          </section>

          {/* ════ 书架 ════ */}
          {exhibitions.length > 0 && (
            <section className="mb-14">
              <div className="manga-heading mb-5">
                <h2 className="display text-xl">书架</h2>
                <span className="manga-tag">{exhibitions.length} 卷</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exhibitions.map((ex, i) => {
                  const count = counts[ex.id] || 0;
                  const vol = exhibitions.length - i;
                  const cov = covers[ex.id];
                  return (
                    <Link key={ex.id} href={`/exhibition/${ex.id}`} className="volume group">
                      <span className="volume-no">第 {vol} 卷</span>
                      <div className="pl-6">
                        <div className="relative h-36 border-b-[3px] border-[var(--ink)] bg-[color-mix(in_srgb,var(--sky)_22%,var(--paper))] flex items-center justify-center overflow-hidden">
                          {cov ? (
                            <img src={mediaSrc(cov)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <IconGallery className="opacity-25" size={36} />
                          )}
                          <span className="absolute top-2.5 right-2.5 manga-tag !text-[0.6rem]">{count} 条</span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-black leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                            {ex.title}
                          </h3>
                          <p className="text-xs opacity-55 mt-1.5 line-clamp-2 leading-relaxed font-bold">
                            {ex.description || "等待展开……"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ════ 目次:一话一条分镜 ════ */}
          {timeline.length > 0 && (
            <section>
              <div className="manga-heading mb-6">
                <h2 className="display text-xl">目次</h2>
                <span className="manga-tag manga-tag-sky">全 {timeline.length} 话</span>
              </div>
              <div className="flex flex-col gap-10">
                {timeline.map((entry, i) => (
                  <EpisodeStrip key={i} entry={entry} no={timeline.length - i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- 一话 = 一条分镜 ---------------- */

/** 收口用的 ベタ 格,按一个偏窄的比例参与排版 */
const TAIL_RATIO = 0.58;

/**
 * 一段最少要"宽"到什么程度。
 * 只有一张竖图时 Σr≈0.6,若还硬撑满宽,行高会等于 1.6 个屏宽 —— 一张照片吃掉两屏。
 * 所以 Σr 不足时不拉满宽度,而是按比例缩窄,行高因此恒定。
 */
const MIN_SPAN = 2.2;

/**
 * 等高分镜的正确算法(justified 行,和 layout-engine 同一套):
 *
 * 一段里图片等高并排,设宽高比为 r1..rn、段高 h,则段宽 W = h·Σr,
 * 反过来 **h = W / Σr** —— 段高是算出来的,不是拍脑袋定的。
 *
 * ⚠️ 之前写成「固定行高 + flex: ratio」是错的:那样格宽只是按比例分配剩余宽度,
 * 与 h·r 对不上,object-cover 照样裁图,"竖图不裁"就成了空话。
 * 现在把 Σr 交给容器的 aspect-ratio,格子的实际比例才真的等于图片比例。
 */
function Strip({
  shots,
  max,
  className = "",
}: {
  shots: Shot[];
  max: number;
  className?: string;
}) {
  const shown = shots.slice(0, max);
  const rest = shots.length - shown.length;
  const span = shown.reduce((a, s) => a + s.ratio, 0) + (rest > 0 ? TAIL_RATIO : 0);
  const width = span < MIN_SPAN ? `${(span / MIN_SPAN) * 100}%` : "100%";

  return (
    <div
      className={`flex gap-1.5 sm:gap-2 ${className}`}
      // 封顶:一段全是竖图时 Σr 很小,算出来的段高能到半屏,一话就吃掉整个视野。
      // 撞到上限时才会有轻微的中心裁切 —— 这是有意的取舍,不是算法失效。
      style={{ width, aspectRatio: String(span), maxHeight: "20rem" }}
    >
      {shown.map((s, j) => (
        <figure key={j} className="manga-panel relative min-w-0 overflow-hidden" style={{ flex: s.ratio }}>
          <img src={mediaSrc(s.url)} alt="" loading="lazy" className="w-full h-full object-cover" />
        </figure>
      ))}
      {rest > 0 && (
        <div
          className="manga-panel panel-ink flex flex-col items-center justify-center"
          style={{ flex: TAIL_RATIO }}
        >
          <span className="display text-2xl sm:text-3xl text-[var(--paper)] leading-none tabular-nums">
            +{rest}
          </span>
          <span className="text-[0.5rem] font-black tracking-widest text-[var(--paper)] opacity-60 mt-1">
            張
          </span>
        </div>
      )}
    </div>
  );
}

function EpisodeStrip({ entry, no }: { entry: Episode; no: number }) {
  const note = entry.texts.join(" / ");
  const tint = entry.color;

  return (
    <article className="group">
      {/* 话头:大话数 + 旁白框。日期地点是旁白,不是标题 */}
      <div className="flex items-end gap-3 mb-2.5">
        <span
          className="display text-4xl sm:text-5xl leading-[0.8] tabular-nums shrink-0"
          style={{ color: tint || "var(--accent)" }}
        >
          {String(no).padStart(2, "0")}
        </span>
        <span className="text-[0.55rem] font-black tracking-[0.25em] opacity-45 pb-1 shrink-0">話</span>
        <span className="ml-1 inline-flex items-center gap-1.5 bg-[var(--paper)] border-[3px] border-[var(--ink)] px-2.5 py-1 text-[0.68rem] sm:text-xs font-black min-w-0">
          <span className="tabular-nums truncate">{entry.day} {entry.clock}</span>
          {entry.location && (
            <span className="inline-flex items-center gap-1 opacity-60 shrink-0">
              <IconMapPin size={11} />{entry.location}
            </span>
          )}
        </span>
        <span className="ml-auto text-xs font-black opacity-40 tabular-nums shrink-0 pb-1">
          {entry.shots.length > 0 ? `${entry.shots.length} 张` : "手记"}
        </span>
      </div>

      {entry.shots.length > 0 ? (
        <>
          {/* 手机放 3 格、桌面放 5 格 —— 手机上塞五格,每格只剩六十来像素,
              又退回成改版前那种缩略图了。同一组图渲两遍,URL 相同,浏览器只取一次 */}
          <Strip shots={entry.shots} max={3} className="sm:hidden" />
          <Strip shots={entry.shots} max={5} className="hidden sm:flex" />

          {/* 用户原话压在分镜下沿,像格底的对白框 */}
          {note && (
            <p className="handwriting -mt-4 relative z-10 ml-4 sm:ml-8 mr-auto max-w-2xl bg-[var(--paper)] border-[3px] border-[var(--ink)] shadow-[3px_3px_0_var(--ink)] px-3 py-1.5 text-sm font-bold line-clamp-2 leading-snug">
              {note}
            </p>
          )}
        </>
      ) : (
        /* 纯手记的一话:一页稿纸,不是一行空列表。
           宽度跟着字走 —— 一个横贯整屏的空框里躺着两个字,那才是真难看。
           左缘的装订线 + 红标记跟阅读器的旁白页是同一套语汇,不是新造的。 */
        <div className="manga-panel relative w-fit max-w-3xl px-5 py-4 sm:px-7 sm:py-5">
          <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-[3px] bg-[var(--ink)] opacity-20" />
          <div className="absolute left-[7px] sm:left-[11px] top-4 w-2 h-2 bg-[var(--accent)] border-2 border-[var(--ink)]" />
          <p className="handwriting pl-4 sm:pl-6 text-base sm:text-lg font-bold leading-[1.85] line-clamp-3">
            {note || "（这一话还没写下什么）"}
          </p>
        </div>
      )}
    </article>
  );
}

function EmptyState() {
  return (
    <div className="py-16 sm:py-24">
      <div className="masthead max-w-lg mx-auto speed-lines fx-speed">
        <div className="p-8 sm:p-12 text-center">
          <span className="manga-tag manga-tag-sky rotate-[-3deg] inline-block mb-5">第 0 话</span>
          <h1 className="title-logo text-4xl sm:text-5xl leading-tight mb-5">故事还没开始</h1>
          <p className="handwriting text-base opacity-70 font-bold mb-8 leading-relaxed">
            把最近拍的照片传上来，<br />你的第一话就画好了。
            <br />
            <span className="text-sm opacity-70">截图也算 —— 它也是回忆的一种。</span>
          </p>
          <Link href="/import" className="manga-btn manga-btn-accent">
            <IconPlus size={16} />画下第一格
          </Link>
        </div>
      </div>
    </div>
  );
}
