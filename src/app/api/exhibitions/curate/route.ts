import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { findPostsByUser, updatePost, createExhibition, createExhibitionPost } from "@/lib/store";
import { curatePosts } from "@/lib/deepseek";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const posts = findPostsByUser(session.id, { isProcessed: false, limit: 100 });

    if (posts.length === 0) {
      return NextResponse.json({ error: "没有新的内容可以策展" }, { status: 400 });
    }

    // AI curation
    const curation = await curatePosts(posts);

    // Update posts with AI results
    for (const [postId, category] of Object.entries(curation.postCategories)) {
      updatePost(postId, {
        aiCategory: category.category,
        aiTags: JSON.stringify(category.tags),
        aiSentiment: category.sentiment,
        aiDescription: category.description,
        isProcessed: true,
      });
    }

    // Create exhibition
    const exhibition = createExhibition({
      userId: session.id,
      title: curation.title,
      theme: curation.theme,
      description: curation.description,
      shareToken: crypto.randomUUID(),
      isPublic: false,
    });

    // Link posts to exhibition
    for (const postId of Object.keys(curation.postCategories)) {
      createExhibitionPost(exhibition.id, postId);
    }

    return NextResponse.json({ exhibition }, { status: 201 });
  } catch (error) {
    console.error("Curation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "策展失败" },
      { status: 500 }
    );
  }
}
