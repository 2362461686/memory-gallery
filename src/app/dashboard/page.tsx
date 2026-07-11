import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser, getExhibitionPostCounts, findUserById } from "@/lib/store";
import Link from "next/link";
import { IconLayout, IconPlus, IconGallery } from "@/lib/icons";

const themeGradients: Record<string, string> = {
  food: "from-orange-100 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10",
  travel: "from-blue-100 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10",
  emotion: "from-purple-100 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10",
  music: "from-green-100 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10",
  life: "from-pink-100 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/10",
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">你好，{userName}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <IconLayout className="text-slate-400" size={14} />你的数字记忆展厅
          </p>
        </div>
        <Link href="/import" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
          <IconPlus size={16} />导入新内容
        </Link>
      </div>
      {exhibitions.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <IconGallery className="text-slate-300 dark:text-slate-600" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2">还没有展览</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 max-w-xs mx-auto">导入照片或 QQ 空间内容，AI 会帮你策展</p>
          <Link href="/import" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25">
            <IconPlus size={16} />开始导入
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exhibitions.map((exhibition) => {
            const count = counts[exhibition.id] || 0;
            const gradient = themeGradients[exhibition.theme] || "from-slate-100 to-slate-50 dark:from-slate-800/30 dark:to-slate-800/10";
            return (
              <Link key={exhibition.id} href={`/exhibition/${exhibition.id}`} className="glass-card group">
                <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  {exhibition.coverImage ? (
                    <img src={exhibition.coverImage} alt={exhibition.title} className="w-full h-full object-cover" />
                  ) : (
                    <IconGallery className="text-slate-300 dark:text-slate-600" size={40} />
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass text-xs font-medium text-slate-600 dark:text-slate-300">{count} 件展品</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">{exhibition.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{exhibition.description || "等待展开..."}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">{new Date(exhibition.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
