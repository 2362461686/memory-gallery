import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser, getExhibitionPostCounts, findUserById, findPostsByUser } from "@/lib/store";
import Link from "next/link";
import { IconPlus, IconGallery, IconMapPin } from "@/lib/icons";
import BindButton from "@/components/BindButton";

interface Episode {
  label: string;
  photos: string[];
  texts: string[];
  location?: string;
  color?: string;
}

// 分组:优先按上传批次(一起传的就是一件事),老数据无批次时退回按天
function groupPosts(posts: ReturnType<typeof findPostsByUser>): Episode[] {
  const groups = new Map<string, Episode>();
  for (const post of posts) {
    const day = new Date(post.postedAt || post.createdAt).toLocaleDateString("zh-CN", {
      year: "numeric", month: "long", day: "numeric",
    });
    const key = post.batchId || `day:${day}`;
    if (!groups.has(key)) groups.set(key, { label: day, photos: [], texts: [] });
    const entry = groups.get(key)!;
    try {
      entry.photos.push(...(JSON.parse(post.mediaUrls) as string[]));
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
  const posts = findPostsByUser(session.id);
  const unbound = findPostsByUser(session.id, { isProcessed: false });
  const timeline = groupPosts(posts);
  const photoCount = posts.filter((p) => p.contentType !== "text").length;
  const noteCount = posts.length - photoCount;

  const latest = timeline[0];
  const empty = posts.length === 0 && exhibitions.length === 0;

  // 具体地说事,而不是报统计数字
  const places = [...new Set(timeline.map((t) => t.location).filter(Boolean))];
  const lead = latest
    ? `最近一话 · ${latest.label}${latest.location ? ` · ${latest.location}` : ""}`
    : "";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {empty ? <EmptyState /> : (
        <>
          {/* 刊头:一进来先立住场面 */}
          <section className="masthead mb-10">
            <div className="grid sm:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8 min-w-0">
                <span className="manga-tag manga-tag-accent rotate-[-3deg] inline-block mb-4">连载中</span>
                <h1 className="text-3xl sm:text-4xl font-black leading-[1.1] mb-3" style={{ textWrap: "balance" }}>
                  {userName} 的回忆录
                </h1>
                {lead && (
                  <p className="handwriting text-base sm:text-lg font-bold opacity-75 mb-1">{lead}</p>
                )}
                <p className="text-xs font-bold opacity-50 tabular-nums">
                  全 {timeline.length} 话 · {photoCount} 张照片
                  {noteCount > 0 ? ` · ${noteCount} 段手记` : ""}
                  {places.length > 0 ? ` · 去过 ${places.slice(0, 2).join("、")}${places.length > 2 ? " 等地" : ""}` : ""}
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

              {/* 右侧:最近一话的封面照压边,像期刊封面 */}
              {latest?.photos[0] && (
                <div className="fx-kenburns hidden sm:block relative w-52 border-l-[3px] border-[var(--ink)] overflow-hidden">
                  <img src={latest.photos[0]} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 manga-tag !text-[0.62rem]">
                    第 {timeline.length} 话
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* 书架 */}
          {exhibitions.length > 0 && (
            <section className="mb-12">
              <div className="manga-heading mb-5">
                <h2 className="text-lg font-black">书架</h2>
                <span className="manga-tag">{exhibitions.length} 卷</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exhibitions.map((ex, i) => {
                  const count = counts[ex.id] || 0;
                  const vol = exhibitions.length - i;
                  return (
                    <Link key={ex.id} href={`/exhibition/${ex.id}`} className="volume group">
                      <span className="volume-no">第 {vol} 卷</span>
                      <div className="pl-6">
                        <div className="relative h-36 border-b-[3px] border-[var(--ink)] bg-[color-mix(in_srgb,var(--sky)_22%,var(--paper))] flex items-center justify-center overflow-hidden">
                          {ex.coverImage ? (
                            <img src={ex.coverImage} alt="" className="w-full h-full object-cover" />
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

          {/* 连载目录:像单行本的目录页,不是卡片列表 */}
          {timeline.length > 0 && (
            <section>
              <div className="manga-heading mb-1">
                <h2 className="text-lg font-black">目录</h2>
                <span className="manga-tag manga-tag-sky">全 {timeline.length} 话</span>
              </div>
              <div className="border-t-[3px] border-[var(--ink)] mt-4">
                {timeline.map((entry, i) => {
                  const no = timeline.length - i;
                  return (
                    <article key={i} className="toc-row">
                      <div className="flex items-start gap-4">
                        {/* 话数:目录页的主角 */}
                        <div className="shrink-0 w-14 text-center">
                          <div
                            className="text-2xl sm:text-3xl font-black leading-none tabular-nums"
                            style={{ color: entry.color || "var(--accent)" }}
                          >
                            {String(no).padStart(2, "0")}
                          </div>
                          <div className="text-[0.55rem] font-black tracking-[0.2em] opacity-45 mt-1">話</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h3 className="font-black text-sm sm:text-base">{entry.label}</h3>
                            {entry.location && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold opacity-55">
                                <IconMapPin size={11} />{entry.location}
                              </span>
                            )}
                            <span className="text-xs font-bold opacity-40 tabular-nums ml-auto">
                              {entry.photos.length > 0 ? `${entry.photos.length} 张` : "手记"}
                            </span>
                          </div>

                          {entry.texts.length > 0 && (
                            <p className="handwriting text-sm opacity-70 mt-1.5 line-clamp-1 font-bold">
                              {entry.texts.join(" / ")}
                            </p>
                          )}

                          {entry.photos.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-hidden">
                              {entry.photos.slice(0, 6).map((url, j) => (
                                <div
                                  key={j}
                                  className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 border-[3px] border-[var(--ink)] rounded-sm overflow-hidden"
                                >
                                  <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {entry.photos.length > 6 && (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 border-[3px] border-dashed border-[var(--ink)] rounded-sm flex items-center justify-center text-xs font-black opacity-50 tabular-nums">
                                  +{entry.photos.length - 6}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 sm:py-24">
      <div className="masthead max-w-lg mx-auto speed-lines fx-speed">
        <div className="p-8 sm:p-12 text-center">
          <span className="manga-tag manga-tag-sky rotate-[-3deg] inline-block mb-5">第 0 话</span>
          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">故事还没开始</h1>
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
