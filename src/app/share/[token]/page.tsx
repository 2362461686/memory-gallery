import { findExhibitionByShareToken, findExhibitionPosts } from "@/lib/store";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IconGallery } from "@/lib/icons";

interface SharePageProps { params: Promise<{ token: string }>; }

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params; const ex = findExhibitionByShareToken(token);
  if (!ex) return { title: "展览未找到" };
  return { title: `${ex.title} - Memory Gallery`, description: ex.description || "", openGraph: { title: ex.title, description: ex.description || "", images: ex.coverImage ? [ex.coverImage] : [] } };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const exhibition = findExhibitionByShareToken(token); if (!exhibition) notFound();
  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const exhibits = exhibitionPosts.map(ep => ep.post).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-center py-16 px-6 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4"><IconGallery className="text-indigo-400" size={24} /></div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">{exhibition.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">{exhibition.description}</p>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10 flex-1">
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {exhibits.map(post => {
            if (!post) return null; let urls: string[] = [], tags: string[] = [];
            try { urls = JSON.parse(post.mediaUrls || "[]"); tags = JSON.parse(post.aiTags || "[]"); } catch {}
            return (
              <div key={post.id} className="break-inside-avoid glass-card">
                {urls[0] && (<div className="relative"><img src={urls[0]} alt={post.aiDescription || post.contentText || "展品图片"} className="w-full" loading="lazy" />{post.aiCategory && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass text-xs font-medium">{post.aiCategory}</span>}</div>)}
                <div className="p-4">{post.contentText && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{post.contentText}</p>}{tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map((tag: string) => <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs">{tag}</span>)}</div>}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-center py-8 text-sm text-slate-300 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-700/60"><p>Created with <span className="text-indigo-400 font-medium">Memory Gallery</span></p></div>
    </div>
  );
}
