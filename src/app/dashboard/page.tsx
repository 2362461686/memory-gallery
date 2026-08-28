import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser, getExhibitionPostCounts, findUserById, findPostsByUser } from "@/lib/store";
import Link from "next/link";
import { IconPlus, IconGallery, IconMapPin, IconCalendar } from "@/lib/icons";
import BindButton from "@/components/BindButton";

// 分组:优先按上传批次(一起传的就是一件事),老数据无批次时退回按天
function groupPosts(posts: ReturnType<typeof findPostsByUser>) {
  const groups = new Map<string, { label: string; photos: string[]; texts: string[]; location?: string; color?: string }>();
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* 页眉 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-black">{userName} 的回忆录</h1>
          <p className="text-sm opacity-60 mt-1 font-bold">已连载 {timeline.length} 话 · {photoCount} 张照片{noteCount > 0 ? ` · ${noteCount} 段手记` : ""}</p>
        </div>
        <div className="flex gap-3">
          {unbound.length > 0 && <BindButton postCount={unbound.length} />}
          <Link href="/import" className="manga-btn manga-btn-ghost">
            <IconPlus size={16} />收录新回忆
          </Link>
        </div>
      </div>

      {posts.length === 0 && exhibitions.length === 0 ? (
        /* 空状态:第 0 话 */
        <div className="text-center py-20">
          <div className="glass-card inline-block px-12 py-10 rotate-[-0.5deg]">
            <span className="manga-tag manga-tag-sky mb-4 inline-block">第 0 话</span>
            <h2 className="text-lg font-black mb-2">故事还没开始</h2>
            <p className="text-sm opacity-60 mb-6 max-w-xs mx-auto font-bold">把最近拍的照片传上来,你的第一话就画好了。<br/>截图也算 —— 它也是回忆的一种。</p>
            <Link href="/import" className="manga-btn manga-btn-accent">
              <IconPlus size={16} />画下第一格
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 回忆集书架 */}
          {exhibitions.length > 0 && (
            <section className="mb-12">
              <div className="manga-heading mb-5">
                <h2 className="text-lg font-black">回忆集</h2>
                <span className="manga-tag">{exhibitions.length} 本</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exhibitions.map((exhibition, i) => {
                  const count = counts[exhibition.id] || 0;
                  return (
                    <Link key={exhibition.id} href={`/exhibition/${exhibition.id}`} className={`glass-card group ${i % 2 === 1 ? "md:rotate-[0.4deg]" : "md:rotate-[-0.4deg]"}`}>
                      <div className="relative h-40 border-b-[3px] border-[var(--ink)] bg-[color-mix(in_srgb,var(--sky)_25%,var(--paper))] flex items-center justify-center overflow-hidden">
                        {exhibition.coverImage ? (
                          <img src={exhibition.coverImage} alt={exhibition.title} className="w-full h-full object-cover" />
                        ) : (
                          <IconGallery className="opacity-30" size={40} />
                        )}
                        <span className="absolute top-3 right-3 manga-tag">{count} 条</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-black truncate group-hover:text-[var(--accent)] transition-colors">{exhibition.title}</h3>
                        <p className="text-xs opacity-60 mt-1.5 line-clamp-2 leading-relaxed font-bold">{exhibition.description || "等待展开…"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* 时间线:一天一格分镜 */}
          {timeline.length > 0 && (
            <section>
              <div className="manga-heading mb-5">
                <h2 className="text-lg font-black">时间线</h2>
                <span className="manga-tag manga-tag-sky">{timeline.length} 话</span>
              </div>
              <div className="relative pl-6 border-l-[3px] border-[var(--ink)] space-y-8">
                {timeline.map((entry, i) => (
                  <article key={i} className="relative">
                    {/* 时间轴节点 */}
                    <span className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-[3px] border-[var(--ink)]" style={{ background: entry.color || "var(--accent)" }} />
                    <div className={`glass-card p-5 ${i % 2 === 1 ? "rotate-[0.3deg]" : "rotate-[-0.3deg]"}`}>
                      <header className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="manga-tag manga-tag-sky"><IconCalendar size={12} />第 {timeline.length - i} 话 · {entry.label}</span>
                        {entry.location && (
                          <span className="manga-tag manga-tag-sky"><IconMapPin size={12} />{entry.location}</span>
                        )}
                        <span className="text-xs opacity-50 font-bold">{entry.photos.length > 0 ? `${entry.photos.length} 张` : "手记"}</span>
                      </header>
                      {entry.texts.length > 0 && (
                        <p className="text-sm opacity-80 mb-3 line-clamp-2 leading-relaxed font-bold">{entry.texts.join(" / ")}</p>
                      )}
                      {entry.photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {entry.photos.slice(0, 5).map((url, j) => (
                            <div key={j} className={`aspect-square manga-photo ${j % 2 === 1 ? "rotate-[1deg]" : "rotate-[-0.8deg]"}`}>
                              <img src={url} alt="" loading="lazy" />
                            </div>
                          ))}
                          {entry.photos.length > 5 && (
                            <div className="aspect-square flex items-center justify-center border-[3px] border-dashed border-[var(--ink)] rounded-md text-sm font-black opacity-60">
                              +{entry.photos.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
