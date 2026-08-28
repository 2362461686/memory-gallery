import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getMarginNotes, saveMarginNotes } from "@/lib/store";
import { MARGIN_NOTES } from "@/components/gallery/layout-engine";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const custom = getMarginNotes(session.id);
  return NextResponse.json({
    notes: custom ?? [...MARGIN_NOTES],
    isCustom: custom !== null,
    builtin: [...MARGIN_NOTES],
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { notes } = await request.json();
    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: "格式不对" }, { status: 400 });
    }
    const saved = saveMarginNotes(
      session.id,
      notes.filter((n): n is string => typeof n === "string")
    );
    return NextResponse.json({ notes: saved, isCustom: saved.length > 0 });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
