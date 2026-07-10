import { getSession } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { findExhibitionById, findExhibitionPosts, findPostsByUser } from "@/lib/store";
import CurateButton from "./CurateButton";
import ShareButton from "./ShareButton";
import Link from "next/link";

export default async function ExhibitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/login");

  const { id } = await params;

  const exhibition = findExhibitionById(id);
  if (!exhibition || exhibition.userId !== session.id) {
    notFound();
  }

  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const exhibits = exhibitionPosts.map((ep) => ep.post).filter(Boolean);

  // Check if user has unprocessed posts
  const unprocessedPosts = findPostsByUser(session.id, { isProcessed: false });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link href="/dashboard" className="inline-flex items-center text-sm text-zinc-400 hover:text-purple-500 transition-colors mb-6">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回展厅
      </Link>

      {/* Exhibition header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              {exhibition.title}
            </h1>
          </div>
          <p className="text-zinc-500 max-w-xl leading-relaxed mt-3">
            {exhibition.description}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
            <span>{exhibits.length} 件展品</span>
            <span>·</span>
            <span>{new Date(exhibition.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {unprocessedPosts.length > 0 && <CurateButton postCount={unprocessedPosts.length} />}
          <ShareButton shareToken={exhibition.shareToken} />
        </div>
      </div>

      {/* 3D Gallery */}
      {exhibits.length > 0 ? (
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-pink-500/20 shadow-2xl shadow-purple-900/30 bg-gradient-to-b from-[#1a1025] to-[#0d1525] flex items-center justify-center">
          <div className="text-center text-white/60">
            <p className="text-4xl mb-4">🎨</p>
            <p className="text-xl font-medium mb-2">3D 画廊加载中...</p>
            <p className="text-sm">请在浏览器中查看沉浸式展览体验</p>
            <p className="text-xs text-white/30 mt-4">{exhibits.length} 件展品已就绪</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white/40 rounded-2xl border border-white/60">
          <div className="text-5xl mb-4">🎨</div>
          <p className="text-zinc-400 mb-4">还没有展品</p>
          <Link href="/import" className="text-purple-500 hover:underline text-sm">去导入内容</Link>
        </div>
      )}
    </div>
  );
}
