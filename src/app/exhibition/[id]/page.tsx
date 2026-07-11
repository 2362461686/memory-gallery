import { getSession } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { findExhibitionById, findExhibitionPosts, findPostsByUser } from "@/lib/store";
import CurateButton from "./CurateButton";
import ShareButton from "./ShareButton";
import Link from "next/link";
import { IconArrowLeft, IconGallery } from "@/lib/icons";

// Lazy-load heavy 3D component
import dynamic from "next/dynamic";
const AnimeGallery = dynamic(
  () => import("@/components/gallery/AnimeGallery"),
  { ssr: false, loading: () => <GalleryLoading /> }
);

function GalleryLoading() {
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-zinc-200/60 bg-gradient-to-b from-[#1a1025] to-[#0d1525] flex items-center justify-center">
      <div className="text-center text-white/40">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mx-auto mb-4" />
        <p className="text-sm">加载 3D 画廊中...</p>
      </div>
    </div>
  );
}

const themeColors: Record<string, string> = {
  food: "text-orange-500",
  travel: "text-blue-500",
  emotion: "text-purple-500",
  music: "text-green-500",
  life: "text-pink-500",
};

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

  const themeColor = themeColors[exhibition.theme] || "text-zinc-500";

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-6"
      >
        <IconArrowLeft size={16} />
        返回展厅
      </Link>

      {/* Exhibition header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center ${themeColor}`}>
              <IconGallery size={20} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {exhibition.title}
            </h1>
          </div>
          <p className="text-zinc-500 max-w-xl leading-relaxed mt-3">
            {exhibition.description}
          </p>
          <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
            <span>{exhibits.length} 件展品</span>
            <span className="text-zinc-200">|</span>
            <span>
              {new Date(exhibition.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {unprocessedPosts.length > 0 && (
            <CurateButton postCount={unprocessedPosts.length} />
          )}
          <ShareButton shareToken={exhibition.shareToken} />
        </div>
      </div>

      {/* 3D Gallery */}
      {exhibits.length > 0 ? (
        <AnimeGallery exhibits={exhibits} />
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-zinc-200/60">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <IconGallery className="text-zinc-300" size={28} />
          </div>
          <p className="text-zinc-500 mb-4">还没有展品</p>
          <Link
            href="/import"
            className="text-sm text-zinc-900 font-medium hover:underline"
          >
            去导入内容
          </Link>
        </div>
      )}
    </div>
  );
}
