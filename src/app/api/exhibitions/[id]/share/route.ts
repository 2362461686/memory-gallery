import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth-helpers";
import { findExhibitionById, updateExhibition } from "@/lib/store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const ex = findExhibitionById(id);
  if (!ex || ex.userId !== session.id) {
    return NextResponse.json({ error: "找不到这本回忆集" }, { status: 404 });
  }

  return NextResponse.json({
    isPublic: ex.isPublic,
    shareToken: ex.shareToken,
    expiresAt: ex.shareExpiresAt ?? null,
    hasPassword: Boolean(ex.sharePasswordHash),
    allowDownload: ex.shareAllowDownload ?? false,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id } = await params;
  const ex = findExhibitionById(id);
  if (!ex || ex.userId !== session.id) {
    return NextResponse.json({ error: "找不到这本回忆集" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (typeof body.isPublic === "boolean") patch.isPublic = body.isPublic;

    // 有效期:天数,0 或 null = 永不过期
    if ("expireDays" in body) {
      const days = Number(body.expireDays);
      patch.shareExpiresAt =
        days > 0 ? new Date(Date.now() + days * 86400_000).toISOString() : undefined;
    }

    // 密码:空字符串 = 取消密码
    if ("password" in body) {
      const pwd = typeof body.password === "string" ? body.password.trim() : "";
      patch.sharePasswordHash = pwd ? await bcrypt.hash(pwd, 10) : undefined;
    }

    if (typeof body.allowDownload === "boolean") patch.shareAllowDownload = body.allowDownload;

    // 换新链接:旧链接立刻作废
    if (body.rotate === true) patch.shareToken = crypto.randomUUID();

    const updated = updateExhibition(id, session.id, patch);
    if (!updated) return NextResponse.json({ error: "更新失败" }, { status: 500 });

    return NextResponse.json({
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      expiresAt: updated.shareExpiresAt ?? null,
      hasPassword: Boolean(updated.sharePasswordHash),
      allowDownload: updated.shareAllowDownload ?? false,
    });
  } catch {
    return NextResponse.json({ error: "参数不对" }, { status: 400 });
  }
}
