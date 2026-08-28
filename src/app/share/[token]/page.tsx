import { findExhibitionByShareToken, findExhibitionPosts, getMarginNotes } from "@/lib/store";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import MangaReader from "@/components/gallery/MangaReader";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const ex = findExhibitionByShareToken(token);
  if (!ex) return { title: "这本回忆集不存在" };
  return {
    title: `${ex.title} · Memory Gallery`,
    description: ex.description || "一本漫画风的回忆集",
    openGraph: {
      title: ex.title,
      description: ex.description || "",
      images: ex.coverImage ? [ex.coverImage] : [],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const exhibition = findExhibitionByShareToken(token);
  if (!exhibition) notFound();

  const exhibits = findExhibitionPosts(exhibition.id)
    .map((ep) => ep.post)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // 分享出去的册子沿用作者自己的页边吐槽 —— 收到的人看到的是同一本书
  const marginNotes = getMarginNotes(exhibition.userId) ?? undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-3xl mx-auto w-full px-6 pt-10 pb-6 text-center">
        <span className="manga-tag manga-tag-accent rotate-[-3deg] inline-block mb-4">
          有人把这本回忆集分享给你
        </span>
        <h1 className="text-2xl sm:text-3xl font-black mb-3" style={{ textWrap: "balance" }}>
          {exhibition.title}
        </h1>
        {exhibition.description && (
          <p className="text-sm opacity-70 max-w-lg mx-auto leading-relaxed font-bold">
            {exhibition.description}
          </p>
        )}
      </header>

      <main className="flex-1 px-4 sm:px-6 pb-12">
        {exhibits.length > 0 ? (
          <MangaReader
            exhibits={exhibits}
            title={exhibition.title}
            description={exhibition.description}
            marginNotes={marginNotes}
          />
        ) : (
          <div className="max-w-md mx-auto text-center glass-card p-10">
            <p className="font-bold opacity-60">这本还是空的</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs font-bold opacity-50 border-t-[3px] border-[var(--ink)]">
        <p>
          用{" "}
          <Link href="/" className="text-[var(--accent)] hover:underline">
            Memory Gallery
          </Link>{" "}
          把日子画成回忆集
        </p>
      </footer>
    </div>
  );
}
