import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findExhibitionsByUser } from "@/lib/store";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");

  const exhibitions = findExhibitionsByUser(session.id);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-700">
            你好，{session.email?.split("@")[0] || "策展人"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">你的数字记忆展厅</p>
        </div>
        <Link
          href="/import"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium text-sm shadow-md shadow-purple-200/50 hover:shadow-lg hover:shadow-purple-300/50 transition-all hover:scale-105"
        >
          + 导入新内容
        </Link>
      </div>

      {exhibitions.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-xl font-semibold text-zinc-500 mb-2">还没有展览</h2>
          <p className="text-zinc-400 mb-6">导入照片或 QQ 空间内容，AI 会帮你策展</p>
          <Link
            href="/import"
            className="inline-flex items-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            开始导入
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exhibitions.map((exhibition) => (
            <Link
              key={exhibition.id}
              href={`/exhibition/${exhibition.id}`}
              className="group block bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/80 shadow-sm hover:shadow-lg hover:shadow-purple-100/50 transition-all hover:scale-[1.02]"
            >
              <div className="relative h-48 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
                {exhibition.coverImage ? (
                  <img src={exhibition.coverImage} alt={exhibition.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">
                      {exhibition.theme === "food"
                        ? "🍰"
                        : exhibition.theme === "travel"
                          ? "✈️"
                          : exhibition.theme === "emotion"
                            ? "💭"
                            : exhibition.theme === "music"
                              ? "🎵"
                              : "✨"}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-xs font-medium text-zinc-500">
                  {exhibition.id} 件展品
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-zinc-700 group-hover:text-purple-500 transition-colors">
                  {exhibition.title}
                </h3>
                <p className="text-sm text-zinc-400 mt-1.5 line-clamp-2">
                  {exhibition.description || "等待展开..."}
                </p>
                <p className="text-xs text-zinc-300 mt-3">
                  {new Date(exhibition.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
