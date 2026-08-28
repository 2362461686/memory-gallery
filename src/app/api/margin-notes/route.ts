import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getMarginNotes, saveMarginNotes, isMarginNotesOff } from "@/lib/store";
import { MARGIN_NOTES } from "@/components/gallery/layout-engine";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const custom = getMarginNotes(session.id);
  const off = isMarginNotesOff(session.id);
  return NextResponse.json({
    notes: off ? [] : custom ?? [...MARGIN_NOTES],
    isCustom: !off && custom !== null && custom.length > 0,
    off,
    builtin: [...MARGIN_NOTES],
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const { notes, off } = await request.json();
    if (off) {
      saveMarginNotes(session.id, [], true);
      return NextResponse.json({ notes: [], isCustom: false, off: true });
    }
    if (!Array.isArray(notes)) {
      return NextResponse.json({ error: "格式不对" }, { status: 400 });
    }
    const saved = saveMarginNotes(
      session.id,
      notes.filter((n): n is string => typeof n === "string")
    );
    return NextResponse.json({ notes: saved, isCustom: saved.length > 0, off: false });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
