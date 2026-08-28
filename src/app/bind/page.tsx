import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { findPostsByUser } from "@/lib/store";
import Link from "next/link";
import { IconArrowLeft, IconPlus } from "@/lib/icons";
import BindPreview from "./BindPreview";

export default async function BindPage() {
  const session = await getSession();
  if (!session?.id) redirect("/login");

  const pending = findPostsByUser(session.id, { isProcessed: false, limit: 200 });

  const items = pending.map((p) => {
    let urls: string[] = [];
    try {
      urls = JSON.parse(p.mediaUrls) as string[];
    } catch { /* 老数据可能有坏 JSON */ }
    return {
      id: p.id,
      url: urls[0],
      isText: p.contentType === "text" || urls.length === 0,
      text: p.contentText || "",
      date: p.postedAt
        ? new Date(p.postedAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })
        : new Date(p.createdAt).toLocaleDateString("zh-CN", { month: "long", day: "numeric" }),
      place: p.location || "",
    };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-bold opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition-all mb-6"
      >
        <IconArrowLeft size={16} />返回回忆录
      </Link>

      <div className="manga-heading mb-2">
        <h1 className="text-2xl font-black">装订成册</h1>
      </div>
      <p className="text-sm opacity-60 mb-8 font-bold">
        挑出这一卷要收哪些、按什么顺序排、封面用哪张 —— 确认无误再装订。
      </p>

      {items.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="font-black mb-2">没有待收的回忆</p>
          <p className="text-sm opacity-60 font-bold mb-6">
            先去收录一些照片或写一段话,再回来装订。
          </p>
          <Link href="/import" className="manga-btn manga-btn-accent">
            <IconPlus size={16} />去收录
          </Link>
        </div>
      ) : (
        <BindPreview items={items} />
      )}
    </div>
  );
}
