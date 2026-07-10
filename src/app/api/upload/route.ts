import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createPost } from "@/lib/store";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import exifr from "exifr";

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

    for (const file of files) {
      const extension = file.name.split(".").pop() || "jpg";
      const filename = `${crypto.randomUUID()}.${extension}`;
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      let takenAt: string | undefined;
      let location: string | undefined;

      try {
        const exif = await exifr.parse(buffer, { pick: ["DateTimeOriginal", "GPSLatitude", "GPSLongitude"] });
        if (exif?.DateTimeOriginal) takenAt = new Date(exif.DateTimeOriginal).toISOString();
        if (exif?.GPSLatitude && exif?.GPSLongitude) {
          location = `${exif.GPSLatitude.toFixed(4)},${exif.GPSLongitude.toFixed(4)}`;
        }
      } catch { /* EXIF parse failures are non-critical */ }

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
    }

    return NextResponse.json({ count: posts.length, posts }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
