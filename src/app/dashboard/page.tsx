import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser, getExhibitionPostCounts, findUserById, findPostsByUser } from "@/lib/store";
import Link from "next/link";
import { IconPlus, IconGallery, IconMapPin, IconCalendar } from "@/lib/icons";

// 按"日子"分组:回忆录的分镜单位是一天
function groupPostsByDay(posts: ReturnType<typeof findPostsByUser>) {
  const days = new Map<string, { photos: string[]; texts: string[]; location?: string }>();
  for (const post of posts) {
    const day = new Date(post.postedAt || post.createdAt).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!days.has(day)) days.set(day, { photos: [], texts: [] });
    const entry = days.get(day)!;
    try {
      entry.photos.push(...(JSON.parse(post.mediaUrls) as string[]));
    } catch { /* 老数据里可能有非法 JSON,跳过 */ }
    if (post.contentText) entry.texts.push(post.contentText);
    if (post.location && !entry.location) entry.location = post.location;
  }
  return [...days.entries()];
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");
  const user = findUserById(session.id);
  const userName = user?.name || session.email?.split("@")[0] || "旅人";
  const exhibitions = findExhibitionsByUser(session.id);
  const counts = getExhibitionPostCounts(exhibitions.map((e) => e.id));
  const posts = findPostsByUser(session.id);
  const timeline = groupPostsByDay(posts);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* 页眉 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-black">{userName} 的回忆录</h1>
          <p className="text-sm opacity-60 mt-1 font-bold">已连载 {timeline.length} 天 · {posts.length} 张回忆</p>
        </div>
        <Link href="/import" className="manga-btn manga-btn-accent">
          <IconPlus size={16} />收录新回忆
        </Link>
      </div>

      {posts.length === 0 && exhibitions.length === 0 ? (
        /* 空状态:第 0 话 */
        <div className="text-center py-20">
          <div className="glass-card inline-block px-12 py-10 rotate-[-0.5deg]">
            <span className="manga-tag manga-tag-sky mb-4 inline-block">第 0 话</span>
            <h2 className="text-lg font-black mb-2">故事还没开始</h2>
            <p className="text-sm opacity-60 mb-6 max-w-xs mx-auto font-bold">把最近拍的照片传上来,你的第一话就画好了</p>
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
                        <span className="absolute top-3 right-3 manga-tag">{count} 张</span>
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
                <span className="manga-tag manga-tag-sky">{timeline.length} 天</span>
              </div>
              <div className="relative pl-6 border-l-[3px] border-[var(--ink)] space-y-8">
                {timeline.map(([day, entry], i) => (
                  <article key={day} className="relative">
                    {/* 时间轴节点 */}
                    <span className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[var(--accent)] border-[3px] border-[var(--ink)]" />
                    <div className={`glass-card p-5 ${i % 2 === 1 ? "rotate-[0.3deg]" : "rotate-[-0.3deg]"}`}>
                      <header className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="manga-tag manga-tag-accent"><IconCalendar size={12} />{day}</span>
                        {entry.location && (
                          <span className="manga-tag manga-tag-sky"><IconMapPin size={12} />{entry.location}</span>
                        )}
                        <span className="text-xs opacity-50 font-bold">{entry.photos.length} 张</span>
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
