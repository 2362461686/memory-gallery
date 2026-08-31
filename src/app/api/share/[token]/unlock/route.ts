import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { findExhibitionByShareToken } from "@/lib/store";

/** 分享密码校验。通过后种一个只对这个 token 生效的 cookie */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ex = findExhibitionByShareToken(token);
  if (!ex) return NextResponse.json({ error: "链接无效" }, { status: 404 });

  if (!ex.isPublic) return NextResponse.json({ error: "分享已关闭" }, { status: 403 });
  if (ex.shareExpiresAt && new Date(ex.shareExpiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "链接已过期" }, { status: 403 });
  }
  if (!ex.sharePasswordHash) return NextResponse.json({ ok: true });

  const { password } = await request.json().catch(() => ({ password: "" }));
  const ok = typeof password === "string" && (await bcrypt.compare(password, ex.sharePasswordHash));
  if (!ok) return NextResponse.json({ error: "密码不对" }, { status: 401 });

  const store = await cookies();
  // path 必须是 "/":图片走 /api/share/<token>/media/...,cookie 挂在 /share/<token>
  // 下的话那条路由收不到,解了锁照样是一页裂图。名字里已经带 token,不会串本。
  store.set(`share_${token}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
