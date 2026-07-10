import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createPost } from "@/lib/store";
import { fetchQzoneMoods, fetchQzoneAlbums, fetchAlbumPhotos } from "@/lib/qzone";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { cookie } = await request.json();
    if (!cookie) {
      return NextResponse.json({ error: "请提供 Cookie" }, { status: 400 });
    }

    let postCount = 0;
    try {
      const { posts } = await fetchQzoneMoods(cookie, 0, 50);
      for (const qpost of posts) {
        createPost({
          userId: session.id,
          contentText: qpost.content || "(无文字)",
          mediaUrls: JSON.stringify(qpost.images || []),
          contentType: qpost.images?.length ? "image" : "text",
          source: "qzone",
          postedAt: qpost.createTime ? new Date(parseInt(qpost.createTime) * 1000).toISOString() : undefined,
          location: qpost.location,
        });
        postCount++;
      }
    } catch (err) {
      console.error("Qzone moods fetch error:", err);
    }

    let photoCount = 0;
    try {
      const albums = await fetchQzoneAlbums(cookie);
      for (const album of albums.slice(0, 3)) {
        const photos = await fetchAlbumPhotos(cookie, album.id, 0, 20);
        for (const photo of photos) {
          createPost({
            userId: session.id,
            contentText: photo.desc || "",
            mediaUrls: JSON.stringify([photo.url]),
            contentType: "image",
            source: "qzone",
            postedAt: photo.uploadTime ? new Date(parseInt(photo.uploadTime) * 1000).toISOString() : undefined,
          });
          photoCount++;
        }
      }
    } catch (err) {
      console.error("Qzone albums fetch error:", err);
    }

    return NextResponse.json({ postCount, photoCount }, { status: 201 });
  } catch (error) {
    console.error("Qzone import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "导入失败" },
      { status: 500 }
    );
  }
}
