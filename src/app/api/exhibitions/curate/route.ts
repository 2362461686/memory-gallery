import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { findPostsByUser, updatePost, createExhibition, createExhibitionPost } from "@/lib/store";
import { curatePosts } from "@/lib/deepseek";

type Post = ReturnType<typeof findPostsByUser>[number];

// 没有 AI 也要能成册:按收录的日期跨度起名,按顺序装订
function fallbackCuration(posts: Post[]) {
  const days = [...new Set(posts.map((p) =>
    new Date(p.postedAt || p.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })
  ))];
  const places = [...new Set(posts.map((p) => p.location).filter(Boolean))];

  const title = places.length
    ? `${places[0]}${places.length > 1 ? "等地" : ""}的${days.length}天`
    : days.length === 1
      ? `${days[0]}这一天`
      : `${days[days.length - 1]} 到 ${days[0]}`;

  const description = `这一卷收录了 ${posts.length} 张回忆${
    days.length > 1 ? `,横跨 ${days.length} 天` : ""
  }${places.length ? `,去过 ${places.join("、")}` : ""}。`;

  return { title, description, theme: "life" };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const posts = findPostsByUser(session.id, { isProcessed: false, limit: 100 });

    if (posts.length === 0) {
      return NextResponse.json({ error: "没有新的回忆可以装订" }, { status: 400 });
    }

    let title: string;
    let description: string;
    let theme: string;
    let aiUsed = false;

    try {
      const curation = await curatePosts(posts);
      for (const [postId, category] of Object.entries(curation.postCategories)) {
        updatePost(postId, {
          aiCategory: category.category,
          aiTags: JSON.stringify(category.tags),
          aiSentiment: category.sentiment,
          aiDescription: category.description,
          isProcessed: true,
        });
      }
      ({ title, description, theme } = curation);
      aiUsed = true;
    } catch (err) {
      // AI 不可用(没配 key / 超时 / 返回不合规)不该挡住成册
      console.warn("AI curation unavailable, falling back:", err);
      ({ title, description, theme } = fallbackCuration(posts));
      for (const p of posts) updatePost(p.id, { isProcessed: true });
    }

    const exhibition = createExhibition({
      userId: session.id,
      title,
      theme,
      description,
      coverImage: (() => {
        try {
          return (JSON.parse(posts[0].mediaUrls) as string[])[0];
        } catch {
          return undefined;
        }
      })(),
      shareToken: crypto.randomUUID(),
      isPublic: false,
    });

    for (const p of posts) {
      createExhibitionPost(exhibition.id, p.id);
    }

    return NextResponse.json({ exhibition, aiUsed }, { status: 201 });
  } catch (error) {
    console.error("Curation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "装订失败" },
      { status: 500 }
    );
  }
}
