import { findExhibitionByShareToken, findExhibitionPosts } from "@/lib/store";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IconGallery } from "@/lib/icons";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
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

const themeColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-600",
  travel: "bg-blue-100 text-blue-600",
  emotion: "bg-purple-100 text-purple-600",
  music: "bg-green-100 text-green-600",
  life: "bg-pink-100 text-pink-600",
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const exhibition = findExhibitionByShareToken(token);
  if (!exhibition) notFound();

  const exhibitionPosts = findExhibitionPosts(exhibition.id);
  const exhibits = exhibitionPosts.map((ep) => ep.post).filter(Boolean);

  const catColor =
    themeColors[exhibition.theme] || "bg-zinc-100 text-zinc-600";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="text-center py-16 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
          <IconGallery className="text-zinc-400" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
          {exhibition.title}
        </h1>
        <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
          {exhibition.description}
        </p>
      </div>

      {/* Masonry grid */}
      <div className="max-w-5xl mx-auto px-6 py-10 flex-1">
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {exhibits.map((post) => {
            if (!post) return null;
            let urls: string[] = [];
            let tags: string[] = [];
            try {
              urls = JSON.parse(post.mediaUrls || "[]");
              tags = JSON.parse(post.aiTags || "[]");
            } catch {
              /* ignore parse errors */
            }

            return (
              <div
                key={post.id}
                className="break-inside-avoid bg-white rounded-xl overflow-hidden border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow"
              >
                {urls[0] && (
                  <div className="relative">
                    <img
                      src={urls[0]}
                      alt={post.aiDescription || post.contentText || "展品图片"}
                      className="w-full"
                      loading="lazy"
                    />
                    {post.aiCategory && (
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${catColor}`}
                      >
                        {post.aiCategory}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  {post.contentText && (
                    <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                      {post.contentText}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-xs"
                        >
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

        {exhibits.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <IconGallery className="text-zinc-300" size={28} />
            </div>
            <p className="text-zinc-400">该展览还没有展品</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-zinc-300 border-t border-zinc-100">
        <p>
          Created with{" "}
          <span className="text-zinc-400 font-medium">Memory Gallery</span>
        </p>
      </div>
    </div>
  );
}
