import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createPost } from "@/lib/store";

/** 纯文字回忆:没有照片的那些日子,也值得记一页 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { text, date, place } = await request.json();
    const content = typeof text === "string" ? text.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "写点什么吧" }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: "一页写不下这么多,500 字以内" }, { status: 400 });
    }

    const post = createPost({
      userId: session.id,
      contentText: content,
      mediaUrls: JSON.stringify([]),
      contentType: "text",
      source: "note",
      postedAt: date ? new Date(date).toISOString() : undefined,
      location: typeof place === "string" && place.trim() ? place.trim() : undefined,
      batchId: crypto.randomUUID(),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Note error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
