import { findExhibitionByShareToken, findExhibitionPosts } from "@/lib/store";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const exhibition = findExhibitionByShareToken(token);
  if (!exhibition) return { title: "展览未找到" };

  return {
    title: `${exhibition.title} - Memory Gallery`,
    description: exhibition.description || "在 Memory Gallery 查看这场展览",
    openGraph: {
      title: exhibition.title,
      description: exhibition.description || "",
      images: exhibition.coverImage ? [exhibition.coverImage] : [],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const exhibition = findExhibitionByShareToken(token);
  if (!exhibition) notFound();

  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const exhibits = exhibitionPosts.map((ep) => ep.post).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-center py-12 px-6">
        <div className="text-4xl mb-4">
          {exhibition.theme === "food"
            ? "🍰"
            : exhibition.theme === "travel"
              ? "✈️"
              : exhibition.theme === "emotion"
                ? "💭"
                : exhibition.theme === "music"
                  ? "🎵"
                  : "✨"}
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
          {exhibition.title}
        </h1>
        <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed text-lg">
          {exhibition.description}
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
          {exhibits.map((post) => {
            if (!post) return null;
            const urls: string[] = JSON.parse(post.mediaUrls || "[]");
            const tags: string[] = JSON.parse(post.aiTags || "[]");

            return (
              <div
                key={post.id}
                className="break-inside-avoid bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/80 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              >
                {urls[0] && (
                  <div className="relative">
                    <img src={urls[0]} alt="" className="w-full" />
                    {post.aiCategory && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm text-xs font-medium text-pink-500">
                        {post.aiCategory}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  {post.contentText && (
                    <p className="text-sm text-zinc-600 leading-relaxed mb-3">{post.contentText}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-400 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto text-center py-8 text-sm text-zinc-300">
        <p>
          Created with{" "}
          <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent font-medium">
            Memory Gallery
          </span>
        </p>
      </div>
    </div>
  );
}
