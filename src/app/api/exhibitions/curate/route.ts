import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { findPostsByUser, updatePost, createExhibition, createExhibitionPost, findExhibitionsByUser } from "@/lib/store";
import { curatePosts } from "@/lib/deepseek";

type Post = ReturnType<typeof findPostsByUser>[number];

// 没有 AI 也要能成册:按收录的日期跨度起名,按顺序装订
function fallbackCuration(posts: Post[], seq: number) {
  const days = [...new Set(posts.map((p) =>
    new Date(p.postedAt || p.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })
  ))];
  const places = [...new Set(posts.map((p) => p.location).filter(Boolean))];
  const photoCount = posts.filter((p) => p.contentType !== "text").length;
  const noteCount = posts.length - photoCount;

  // 标题要能互相区分 —— 同名的"8月28日这一天"堆四本,用户根本认不出哪本是哪本
  let title: string;
  if (places.length) {
    title = `${places[0]}${places.length > 1 ? "等地" : ""}的${days.length}天`;
  } else if (days.length > 1) {
    title = `${days[days.length - 1]} 到 ${days[0]}`;
  } else {
    // 同一天可能装订多本,用第几卷区分,不留重名
    title = seq > 1 ? `${days[0]} · 第 ${seq} 卷` : `${days[0]}这一天`;
  }

  const parts = [`这一卷收录了`];
  if (photoCount) parts.push(`${photoCount} 张照片`);
  if (noteCount) parts.push(`${photoCount ? "、" : ""}${noteCount} 段手记`);
  if (days.length > 1) parts.push(`,横跨 ${days.length} 天`);
  if (places.length) parts.push(`,去过 ${places.join("、")}`);
  parts.push("。");

  return { title, description: parts.join(""), theme: "life" };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    // 预览页会带上用户的选择;直接调用(无 body)则沿用旧行为:全部待收内容
    let body: {
      postIds?: string[];
      title?: string;
      description?: string;
      coverPostId?: string;
      useAi?: boolean;
    } = {};
    try {
      body = await request.json();
    } catch { /* 没有 body,按旧行为走 */ }

    const pending = findPostsByUser(session.id, { isProcessed: false, limit: 200 });

    // 用户选了哪些就装哪些,并保持他排的顺序
    const posts = body.postIds?.length
      ? body.postIds
          .map((id) => pending.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
      : pending;

    if (posts.length === 0) {
      return NextResponse.json({ error: "没有选中任何回忆" }, { status: 400 });
    }

    let title: string;
    let description: string;
    let theme: string;
    let aiUsed = false;
    let pendingAiUpdates: [string, Record<string, string>][] = [];
    let fallbackReason: string | null = null;

    const wantAi = body.useAi !== false && !body.title?.trim();

    try {
      if (!wantAi) throw new Error("skip-ai");
      const curation = await curatePosts(posts);
      // 只暂存,先不落库 —— 回忆集建成之前不许把内容标记为已消费
      pendingAiUpdates = Object.entries(curation.postCategories).map(([postId, c]) => [
        postId,
        {
          aiCategory: c.category,
          aiTags: JSON.stringify(c.tags),
          aiSentiment: c.sentiment,
          aiDescription: c.description,
        },
      ]);
      ({ title, description, theme } = curation);
      aiUsed = true;
    } catch (err) {
      // AI 不可用(没配 key / 401 / 超时 / 返回不合规)不该挡住成册,
      // 但必须让用户知道这本是自动起名的,而不是悄悄降级
      if (!wantAi) {
        ({ title, description, theme } = fallbackCuration(posts, 1));
      } else {
        console.warn("AI curation unavailable, falling back:", err);
        fallbackReason = !process.env.DEEPSEEK_API_KEY
        ? "没有配置 AI 密钥"
        : err instanceof Error && /401|Authentication/i.test(err.message)
          ? "AI 密钥无效"
          : "AI 暂时不可用";
      }
      // 同一天已有几本,决定卷号,避免重名
      const sameDayCount = findExhibitionsByUser(session.id).filter((e) =>
        e.title.startsWith(new Date(posts[0].postedAt || posts[0].createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }))
      ).length;
      ({ title, description, theme } = fallbackCuration(posts, sameDayCount + 1));
    }

    // 用户在预览页写了什么就用什么 —— 他的话优先于 AI 和自动起名
    const finalTitle = body.title?.trim() || title;
    const finalDescription = body.description?.trim() || description;
    const coverPost = body.coverPostId
      ? posts.find((p) => p.id === body.coverPostId)
      : posts[0];

    const exhibition = createExhibition({
      userId: session.id,
      title: finalTitle,
      theme,
      description: finalDescription,
      coverImage: (() => {
        try {
          return (JSON.parse((coverPost ?? posts[0]).mediaUrls) as string[])[0];
        } catch {
          return undefined;
        }
      })(),
      shareToken: crypto.randomUUID(),
      // 默认开启:分享按钮里可以随时撤销、设密码、设有效期。
      // 之前写 false 但 token 照样能访问,字段是摆设 —— 现在它真的说了算。
      isPublic: true,
    });

    for (const p of posts) {
      createExhibitionPost(exhibition.id, p.id);
    }

    // 回忆集与关联都建成了,才把内容标记为已装订。
    // 任何一步在此之前失败,待装订内容都原样保留,用户可以重试。
    for (const [postId, fields] of pendingAiUpdates) {
      updatePost(postId, fields);
    }
    for (const p of posts) {
      updatePost(p.id, { isProcessed: true });
    }

    return NextResponse.json({ exhibition, aiUsed, fallbackReason }, { status: 201 });
  } catch (error) {
    console.error("Curation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "装订失败" },
      { status: 500 }
    );
  }
}
