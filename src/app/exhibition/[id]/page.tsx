import { getSession } from "@/lib/auth-helpers";
import { redirect, notFound } from "next/navigation";
import { findExhibitionById, findExhibitionPosts, getMarginNotes } from "@/lib/store";
import ShareButton from "./ShareButton";
import Link from "next/link";
import { IconArrowLeft, IconGallery } from "@/lib/icons";
import MangaReader from "@/components/gallery/MangaReader";

export default async function ExhibitionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session?.id) redirect("/login");
  const { id } = await params;
  const exhibition = findExhibitionById(id); if (!exhibition || exhibition.userId !== session.id) notFound();
  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const marginNotes = getMarginNotes(session.id) ?? undefined;
  const exhibits = exhibitionPosts.map(ep => ep.post).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition-all mb-6"><IconArrowLeft size={16} />返回回忆录</Link>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1"><div className="w-10 h-10 rounded-md border-[3px] border-[var(--ink)] bg-[var(--sun)] flex items-center justify-center shadow-[2px_2px_0_var(--ink)]"><IconGallery className="text-[#17130e]" size={20} /></div><h1 className="text-2xl font-black">{exhibition.title}</h1></div>
          <p className="opacity-70 max-w-xl leading-relaxed mt-3 font-bold text-sm">{exhibition.description}</p>
          <div className="flex items-center gap-3 mt-3 text-sm"><span className="manga-tag">{exhibits.length} 张回忆</span><span className="opacity-50 font-bold text-xs">{new Date(exhibition.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span></div>
        </div>
        <div className="flex gap-2 shrink-0"><ShareButton shareToken={exhibition.shareToken} exhibitionId={exhibition.id} /></div>
      </div>
      {exhibits.length > 0 ? <MangaReader exhibits={exhibits} title={exhibition.title} description={exhibition.description} marginNotes={marginNotes} /> : (
        <div className="text-center py-24 glass-card"><IconGallery className="opacity-30 mx-auto mb-4" size={40} /><p className="opacity-60 mb-4 font-bold">这一本还是空的</p><Link href="/import" className="manga-btn manga-btn-accent">去收录回忆</Link></div>
      )}
    </div>
  );
}
