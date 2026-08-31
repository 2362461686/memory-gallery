import { cookies } from "next/headers";
import { checkShareAccess, exhibitionHasMedia, findExhibitionByShareToken } from "@/lib/store";
import { mediaNotFound, serveMedia } from "@/lib/media-server";
import { mediaUrlOf } from "@/lib/media";

/**
 * 收到分享链接的人取图。
 *
 * 图和页面走同一道闸:撤销、过期、要密码,在这儿也一样拦得住 ——
 * 否则页面关了,直连图片地址照样能看,撤销就成了摆设。
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; name: string }> }
) {
  const { token, name } = await params;

  const exhibition = findExhibitionByShareToken(token);
  if (!exhibition) return mediaNotFound();

  const gate = checkShareAccess(exhibition);
  if (!gate.ok) {
    if (gate.reason !== "password") return mediaNotFound();
    const unlocked = (await cookies()).get(`share_${token}`)?.value === "1";
    if (!unlocked) return mediaNotFound();
  }

  if (!exhibitionHasMedia(exhibition.id, mediaUrlOf(name))) return mediaNotFound();
  return serveMedia(name, request);
}
