import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createPost } from "@/lib/store";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import exifr from "exifr";
import { extractFeatures } from "@/lib/image-features";

// 扩展名白名单:防止 .html/.svg 之类落进 /uploads 变成存储型 XSS
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// 相机/截图的默认文件名对人没有意义,当图注只会变成一串乱码
const MEANINGLESS_NAME = [
  /^[0-9a-f]{16,}$/i,                       // 哈希
  /^(img|dsc|dscn|pxl|mvimg|photo|image)[-_ ]?\d+$/i,
  /^(screenshot|截屏|截图|屏幕快照)[-_ ．\d:：\s()（）年月日时分秒at.]*$/i,
  /^\d{4}[-_]?\d{2}[-_]?\d{2}[-_ ]?\d{0,6}$/, // 纯日期时间戳
  /^(wx_camera_|mmexport|微信图片)[-_]?\d*$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID
];

function captionFromFilename(name: string): string | undefined {
  const base = name.replace(/\.[^.]+$/, "").trim();
  if (!base) return undefined;
  if (MEANINGLESS_NAME.some((re) => re.test(base))) return undefined;
  return base;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    // 补录:截图之类没有 EXIF 的图,由用户自己交代是哪天、在哪、发生了什么
    const manualDate = (formData.get("date") as string | null)?.trim() || "";
    const manualPlace = (formData.get("place") as string | null)?.trim() || "";
    const manualNote = (formData.get("note") as string | null)?.trim() || "";

    if (files.length === 0) {
      return NextResponse.json({ error: "没有选择文件" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const posts = [];
    const failed: { name: string; reason: string }[] = [];
    // 同一次上传共享一个批次 id —— 没有时间戳时,"一起传的"就是"一件事"
    const batchId = crypto.randomUUID();

    for (const file of files) {
      try {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!ALLOWED_EXT.has(ext)) {
          failed.push({ name: file.name, reason: "不支持的格式(仅 JPG/PNG/GIF/WebP/HEIC)" });
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          failed.push({ name: file.name, reason: "超过 20MB 上限" });
          continue;
        }

        let buffer = Buffer.from(await file.arrayBuffer());
        let outExt = ext;

        // 浏览器不认 HEIC,存原样等于裂图 —— 服务端转成 JPG
        if (ext === "heic" || ext === "heif") {
          const { default: heicConvert } = await import("heic-convert");
          buffer = Buffer.from(
            await heicConvert({ buffer, format: "JPEG", quality: 0.9 })
          );
          outExt = "jpg";
        }

        // EXIF 在转码前的原始 buffer 上解析最全,但 heic-convert 会丢 EXIF,
        // 所以统一在写盘前、用进入本分支时的原始 arrayBuffer 解析
        let takenAt: string | undefined;
        let location: string | undefined;
        try {
          const exif = await exifr.parse(Buffer.from(await file.arrayBuffer()), {
            pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"],
          });
          if (exif?.DateTimeOriginal) takenAt = new Date(exif.DateTimeOriginal).toISOString();
          if (exif?.GPSLatitude && exif?.GPSLongitude) {
            location = `${exif.GPSLatitude.toFixed(4)},${exif.GPSLongitude.toFixed(4)}`;
          }
        } catch { /* EXIF parse failures are non-critical */ }

        const filename = `${crypto.randomUUID()}.${outExt}`;
        await writeFile(path.join(uploadDir, filename), buffer);

        // 从图片本身提取排版信号,用户无需交代任何信息
        const features = await extractFeatures(buffer);

        // 用户手填 > EXIF > 文件名(无意义就留空)
        const post = createPost({
          userId: session.id,
          mediaUrls: JSON.stringify([`/uploads/${filename}`]),
          contentType: "image",
          source: "upload",
          postedAt: manualDate ? new Date(manualDate).toISOString() : takenAt,
          location: manualPlace || location,
          contentText: manualNote || captionFromFilename(file.name),
          batchId,
          dominantColor: features?.dominantColor,
          aspectRatio: features?.aspectRatio,
          interest: features?.interest,
        });

        posts.push(post);
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        failed.push({ name: file.name, reason: "处理失败" });
      }
    }

    if (posts.length === 0) {
      return NextResponse.json(
        { error: `全部上传失败: ${failed.map((f) => `${f.name}(${f.reason})`).join("、")}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ count: posts.length, failed, posts }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
