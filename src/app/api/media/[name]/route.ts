import { getSession } from "@/lib/auth-helpers";
import { userOwnsMedia } from "@/lib/store";
import { mediaNotFound, serveMedia } from "@/lib/media-server";
import { mediaUrlOf } from "@/lib/media";

/**
 * 本人取自己的照片。
 * 没登录、不是自己的,统一 404 —— 回 403 等于告诉外人「这个文件存在」。
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const session = await getSession();
  if (!session?.id) return mediaNotFound();
  if (!userOwnsMedia(session.id, mediaUrlOf(name))) return mediaNotFound();
  return serveMedia(name, request);
}
