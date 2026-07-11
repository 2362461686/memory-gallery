import { getSession } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { findExhibitionById, findExhibitionPosts, findPostsByUser } from "@/lib/store";
import CurateButton from "./CurateButton";
import ShareButton from "./ShareButton";
import Link from "next/link";
import { IconArrowLeft, IconGallery } from "@/lib/icons";
import dynamic from "next/dynamic";
const AnimeGallery = dynamic(() => import("@/components/gallery/AnimeGallery"), { ssr: false, loading: () => <GalleryLoading /> });

function GalleryLoading() {
  return (
    <div className="relative w-full h-[600px] rounded-3xl overflow-hidden glass bg-gradient-to-b from-[#1a1025] to-[#0d1525] flex items-center justify-center">
      <div className="text-center text-white/40"><div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/60 animate-spin mx-auto mb-4" /><p className="text-sm">加载 3D 画廊中...</p></div>
    </div>
  );
}

export default async function ExhibitionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session?.id) redirect("/login");
  const { id } = await params;
  const exhibition = findExhibitionById(id); if (!exhibition || exhibition.userId !== session.id) notFound();
  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const exhibits = exhibitionPosts.map(ep => ep.post).filter(Boolean);
  const unprocessedPosts = findPostsByUser(session.id, { isProcessed: false });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mb-6"><IconArrowLeft size={16} />返回展厅</Link>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1"><div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><IconGallery className="text-indigo-500 dark:text-indigo-400" size={20} /></div><h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{exhibition.title}</h1></div>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mt-3">{exhibition.description}</p>
          <div className="flex items-center gap-3 mt-3 text-sm text-slate-400 dark:text-slate-500"><span>{exhibits.length} 件展品</span><span className="text-slate-200 dark:text-slate-700">|</span><span>{new Date(exhibition.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span></div>
        </div>
        <div className="flex gap-2 shrink-0">{unprocessedPosts.length > 0 && <CurateButton postCount={unprocessedPosts.length} />}<ShareButton shareToken={exhibition.shareToken} /></div>
      </div>
      {exhibits.length > 0 ? <AnimeGallery exhibits={exhibits} /> : (
        <div className="text-center py-24 glass rounded-3xl"><div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4"><IconGallery className="text-slate-300 dark:text-slate-600" size={28} /></div><p className="text-slate-500 dark:text-slate-400 mb-4">还没有展品</p><Link href="/import" className="text-sm text-indigo-500 dark:text-indigo-400 font-medium hover:underline">去导入内容</Link></div>
      )}
    </div>
  );
}
