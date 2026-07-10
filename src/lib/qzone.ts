// QQ Space (Qzone) data fetching via cookie-based proxy
// Uses QQ Space's internal web APIs with user-provided cookies

const QZONE_HOST = "https://user.qzone.qq.com";

interface QzoneCookie {
  uin: string;
  p_skey: string;
  skey?: string;
}

interface QzonePost {
  tid: string;
  content: string;
  createTime: string;
  images: string[];
  location?: string;
  source?: string;
}

function getGTK(pSkey: string): number {
  let hash = 5381;
  for (let i = 0; i < pSkey.length; i++) {
    hash += (hash << 5) + pSkey.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}

function parseCookieString(cookieStr: string): QzoneCookie | null {
  const cookies: Record<string, string> = {};
  cookieStr.split(";").forEach((pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  });

  const uin = cookies["uin"]?.replace(/^o0*/, "") || cookies["p_uin"]?.replace(/^o0*/, "");
  const pSkey = cookies["p_skey"];

  if (!uin || !pSkey) return null;
  return { uin, p_skey: pSkey, skey: cookies["skey"] };
}

// Fetch user's Qzone mood list (说说)
export async function fetchQzoneMoods(
  cookieStr: string,
  page: number = 0,
  count: number = 30
): Promise<{ posts: QzonePost[]; total: number }> {
  const cookie = parseCookieString(cookieStr);
  if (!cookie) throw new Error("无法解析Cookie，请确保包含uin和p_skey");

  const gtk = getGTK(cookie.p_skey);

  const url = new URL(`${QZONE_HOST}/proxy/domain/taotao.qq.com/cgi-bin/emotion_cgi_msglist_v6`);
  url.searchParams.set("uin", cookie.uin);
  url.searchParams.set("ftype", "0");
  url.searchParams.set("sort", "0");
  url.searchParams.set("pos", String(page * count));
  url.searchParams.set("num", String(count));
  url.searchParams.set("replynum", "0");
  url.searchParams.set("g_tk", String(gtk));
  url.searchParams.set("format", "jsonp");
  url.searchParams.set("inCharset", "utf-8");
  url.searchParams.set("outCharset", "utf-8");

  const response = await fetch(url.toString(), {
    headers: {
      Cookie: cookieStr,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://user.qzone.qq.com/",
    },
    cache: "no-store",
  });

  const text = await response.text();
  // Handle JSONP response
  const jsonStr = text.replace(/^_Callback\(/, "").replace(/\);?$/, "");
  const data = JSON.parse(jsonStr);

  if (data.code !== 0) {
    throw new Error(`QQ空间接口返回错误: ${data.message || "未知错误"} (code: ${data.code})`);
  }

  const msgList = data.msglist || [];

  const posts: QzonePost[] = msgList.map((msg: Record<string, unknown>) => ({
    tid: String(msg.tid || ""),
    content: (msg.content as string) || "",
    createTime: String(msg.created_time || msg.createTime || ""),
    images: Array.isArray(msg.pic)
      ? (msg.pic as { url: string }[]).map((p) => p.url)
      : msg.pic
        ? [String(msg.pic)]
        : [],
    location: msg.lbs ? (msg.lbs as { name: string }).name : undefined,
    source: msg.source_name ? String(msg.source_name) : undefined,
  }));

  return { posts, total: data.total || 0 };
}

// Fetch user's Qzone album list
export async function fetchQzoneAlbums(
  cookieStr: string
): Promise<{ id: string; name: string; coverUrl: string; count: number }[]> {
  const cookie = parseCookieString(cookieStr);
  if (!cookie) throw new Error("无法解析Cookie，请确保包含uin和p_skey");

  const gtk = getGTK(cookie.p_skey);

  const url = new URL(`${QZONE_HOST}/proxy/domain/photo.qzone.qq.com/fcgi-bin/fcg_list_album_v3`);
  url.searchParams.set("uin", cookie.uin);
  url.searchParams.set("g_tk", String(gtk));
  url.searchParams.set("outCharset", "utf-8");
  url.searchParams.set("format", "jsonp");

  const response = await fetch(url.toString(), {
    headers: {
      Cookie: cookieStr,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://user.qzone.qq.com/",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const jsonStr = text.replace(/^_Callback\(/, "").replace(/\);?$/, "");
  const data = JSON.parse(jsonStr);

  if (data.code !== 0) {
    throw new Error(`QQ空间相册接口返回错误: ${data.message || "未知错误"}`);
  }

  const albums = data.album || [];
  return albums.map((album: Record<string, unknown>) => ({
    id: String(album.id || ""),
    name: String(album.name || "未命名相册"),
    coverUrl: String(album.coverurl || album.pre || ""),
    count: Number(album.priv || album.total || 0),
  }));
}

// Fetch photos from a specific album
export async function fetchAlbumPhotos(
  cookieStr: string,
  albumId: string,
  page: number = 0,
  count: number = 50
): Promise<{ url: string; desc: string; uploadTime: string }[]> {
  const cookie = parseCookieString(cookieStr);
  if (!cookie) throw new Error("无法解析Cookie");

  const gtk = getGTK(cookie.p_skey);

  const url = new URL(`${QZONE_HOST}/proxy/domain/photo.qzone.qq.com/fcgi-bin/cgi_list_photo`);
  url.searchParams.set("uin", cookie.uin);
  url.searchParams.set("albumid", albumId);
  url.searchParams.set("g_tk", String(gtk));
  url.searchParams.set("outCharset", "utf-8");
  url.searchParams.set("format", "jsonp");
  url.searchParams.set("pageStart", String(page * count));
  url.searchParams.set("pageNum", String(count));

  const response = await fetch(url.toString(), {
    headers: {
      Cookie: cookieStr,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://user.qzone.qq.com/",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const jsonStr = text.replace(/^_Callback\(/, "").replace(/\);?$/, "");
  const data = JSON.parse(jsonStr);

  if (data.code !== 0) {
    throw new Error(`QQ空间照片接口返回错误: ${data.message || "未知错误"}`);
  }

  const photos = data.photoList || data.photos || [];
  return photos.map((photo: Record<string, unknown>) => ({
    url: String(photo.url || photo.big_url || photo.raw || ""),
    desc: String(photo.desc || photo.name || ""),
    uploadTime: String(photo.uploadtime || photo.shoottime || ""),
  }));
}
