import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createPost } from "@/lib/store";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import exifr from "exifr";

// 扩展名白名单:防止 .html/.svg 之类落进 /uploads 变成存储型 XSS
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "没有选择文件" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const posts = [];
    const failed: { name: string; reason: string }[] = [];

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

        const post = createPost({
          userId: session.id,
          mediaUrls: JSON.stringify([`/uploads/${filename}`]),
          contentType: "image",
          source: "upload",
          postedAt: takenAt,
          location,
          contentText: file.name.replace(/\.[^.]+$/, ""),
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
