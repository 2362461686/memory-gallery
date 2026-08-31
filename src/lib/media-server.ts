import { NextResponse } from "next/server";
import { readFile, stat, mkdir, rename, copyFile, unlink } from "fs/promises";
import type { Stats } from "fs";
import path from "path";
import { isSafeMediaName } from "./media";

/** 照片的新家:不在 public/ 下,Next 不会把它当静态资源发出去 */
export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

/** 0.x 版本把照片放在这儿。首次被访问时顺手搬走,老库不至于裂图 */
const LEGACY_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * 文件名一律先过白名单再拼路径 —— 绝不把请求里的字符串直接交给 path.join。
 * 拼完再核对一次结果确实还在目录内,防的是白名单万一被改松。
 */
function resolveSafe(dir: string, name: string): string | null {
  if (!isSafeMediaName(name)) return null;
  const full = path.resolve(dir, name);
  if (path.dirname(full) !== path.resolve(dir)) return null;
  return full;
}

/** 存在感也是信息:查无此图、无权看此图,对外都只是 404 */
export function mediaNotFound(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

async function migrateLegacy(name: string, dest: string): Promise<Stats | null> {
  const old = resolveSafe(LEGACY_DIR, name);
  if (!old) return null;
  const st = await stat(old).catch(() => null);
  if (!st?.isFile()) return null;

  await ensureUploadDir();
  try {
    await rename(old, dest);
  } catch {
    // data 与 public 可能不在同一挂载点,rename 会 EXDEV
    await copyFile(old, dest);
    await unlink(old).catch(() => {});
  }
  return stat(dest).catch(() => null);
}

/**
 * 把图发出去。调用方必须**先**判完权限 —— 这里不做任何鉴权,只管取文件。
 */
export async function serveMedia(name: string, request: Request): Promise<NextResponse> {
  const file = resolveSafe(UPLOAD_DIR, name);
  if (!file) return mediaNotFound();

  let st = await stat(file).catch(() => null);
  if (!st) st = await migrateLegacy(name, file);
  if (!st?.isFile()) return mediaNotFound();

  const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  // 私有缓存 + ETag:同一个人翻页回来不重下,但缓存不会被共享代理捡去
  const cache = "private, max-age=3600, must-revalidate";

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": cache } });
  }

  const ext = path.extname(name).slice(1).toLowerCase();
  const buffer = await readFile(file);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": String(st.size),
      "Content-Disposition": "inline",
      // 上传时已按文件头校验过类型,这里再钉死一次,不让浏览器自己猜
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": cache,
      ETag: etag,
    },
  });
}
