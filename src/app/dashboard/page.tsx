import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser, getExhibitionPostCounts, findUserById } from "@/lib/store";
import Link from "next/link";
import { IconLayout, IconPlus, IconGallery } from "@/lib/icons";

const themeIcons: Record<string, React.ReactNode> = {
  food: <IconGallery className="text-orange-400" size={40} />,
  travel: <IconGallery className="text-blue-400" size={40} />,
  emotion: <IconGallery className="text-purple-400" size={40} />,
  music: <IconGallery className="text-green-400" size={40} />,
  life: <IconGallery className="text-pink-400" size={40} />,
};

const themeGradients: Record<string, string> = {
  food: "from-orange-50 to-amber-50",
  travel: "from-blue-50 to-cyan-50",
  emotion: "from-purple-50 to-pink-50",
  music: "from-green-50 to-emerald-50",
  life: "from-pink-50 to-rose-50",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");

  const user = findUserById(session.id);
  const userName = user?.name || session.email?.split("@")[0] || "策展人";

  const exhibitions = findExhibitionsByUser(session.id);
  const counts = getExhibitionPostCounts(exhibitions.map((e) => e.id));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">你好，{userName}</h1>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
            <IconLayout className="text-zinc-400" size={14} />
            你的数字记忆展厅
          </p>
        </div>
        <Link
          href="/import"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <IconPlus size={16} />
          导入新内容
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-5">
            <IconGallery className="text-zinc-300" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-zinc-500 mb-2">还没有展览</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-xs mx-auto">
            导入照片或 QQ 空间内容，AI 会帮你策展
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <IconPlus size={16} />
            开始导入
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exhibitions.map((exhibition) => {
            const count = counts[exhibition.id] || 0;
            const gradient = themeGradients[exhibition.theme] || "from-zinc-50 to-zinc-50";
            return (
              <Link
                key={exhibition.id}
                href={`/exhibition/${exhibition.id}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-zinc-200/60 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
              >
                <div
                  className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                >
                  {exhibition.coverImage ? (
                    <img
                      src={exhibition.coverImage}
                      alt={exhibition.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    themeIcons[exhibition.theme] || (
                      <IconGallery className="text-zinc-300" size={40} />
                    )
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 text-xs font-medium text-zinc-500 shadow-sm">
                    {count} 件展品
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-800 group-hover:text-zinc-900 transition-colors truncate">
                    {exhibition.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {exhibition.description || "等待展开..."}
                  </p>
                  <p className="text-xs text-zinc-300 mt-3">
                    {new Date(exhibition.createdAt).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
