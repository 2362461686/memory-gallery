import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

interface DB {
  users: UserRecord[];
  posts: PostRecord[];
  exhibitions: ExhibitionRecord[];
  exhibitionPosts: ExhibitionPostRecord[];
  /** 每个用户自定义的页边吐槽;没配过就用内置那套 */
  marginNotes?: Record<string, string[]>;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  image?: string;
  createdAt: string;
}

interface PostRecord {
  id: string;
  userId: string;
  contentText?: string;
  mediaUrls: string;
  contentType: string;
  source: string;
  originalUrl?: string;
  postedAt?: string;
  location?: string;
  /** 同一次上传的照片共享此 id —— 没有时间戳时,"一起传的"就是"一件事" */
  batchId?: string;
  /** 图片主色 hex,驱动该话的色调 */
  dominantColor?: string;
  /** 宽高比 w/h,用于按比例排版,避免竖图被裁 */
  aspectRatio?: number;
  /** 视觉兴趣度 0-1,用于挑主角格 */
  interest?: number;
  aiCategory?: string;
  aiTags?: string;
  aiSentiment?: string;
  aiDescription?: string;
  isProcessed: boolean;
  createdAt: string;
}

interface ExhibitionRecord {
  id: string;
  userId: string;
  title: string;
  theme: string;
  coverImage?: string;
  description?: string;
  shareToken: string;
  /** 分享开关。false = 链接立即失效,拿着旧链接也打不开 */
  isPublic: boolean;
  /** 到期时间 ISO,空表示永不过期 */
  shareExpiresAt?: string;
  /** 访问密码(bcrypt hash),空表示不需要密码 */
  sharePasswordHash?: string;
  /** 是否允许下载原图 */
  shareAllowDownload?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExhibitionPostRecord {
  id: string;
  exhibitionId: string;
  postId: string;
  sortOrder: number;
}

function readDB(): DB {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const empty: DB = { users: [], posts: [], exhibitions: [], exhibitionPosts: [], marginNotes: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeDB(db: DB) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// --- Users ---

export function createUser(data: { name: string; email: string; password: string }) {
  const db = readDB();
  const id = crypto.randomUUID();
  const user: UserRecord = {
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  return { ...user, password: undefined };
}

export function findUserByEmail(email: string) {
  return readDB().users.find((u) => u.email === email.toLowerCase()) || null;
}

export function findUserById(id: string) {
  const user = readDB().users.find((u) => u.id === id);
  return user ? { ...user, password: undefined } : null;
}

// --- Posts ---

export function createPost(data: Omit<PostRecord, "id" | "createdAt" | "isProcessed">) {
  const db = readDB();
  const post: PostRecord = {
    ...data,
    id: crypto.randomUUID(),
    isProcessed: false,
    createdAt: new Date().toISOString(),
  };
  db.posts.push(post);
  writeDB(db);
  return post;
}

export function findPostsByUser(userId: string, options?: { isProcessed?: boolean; limit?: number }) {
  let posts = readDB().posts.filter((p) => p.userId === userId);
  if (options?.isProcessed !== undefined) posts = posts.filter((p) => p.isProcessed === options.isProcessed);
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (options?.limit) posts = posts.slice(0, options.limit);
  return posts;
}

export function updatePost(id: string, data: Partial<PostRecord>) {
  const db = readDB();
  const idx = db.posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  db.posts[idx] = { ...db.posts[idx], ...data };
  writeDB(db);
  return db.posts[idx];
}

export function findPostsByIds(ids: string[]) {
  return readDB().posts.filter((p) => ids.includes(p.id));
}

function mediaListOf(post: PostRecord): string[] {
  try {
    const urls = JSON.parse(post.mediaUrls);
    return Array.isArray(urls) ? urls : [];
  } catch {
    return []; // 老数据里可能有坏 JSON
  }
}

/** 这张图是不是他自己的 —— 鉴权下载路由唯一的判据 */
export function userOwnsMedia(userId: string, url: string): boolean {
  return readDB().posts.some((p) => p.userId === userId && mediaListOf(p).includes(url));
}

/**
 * 这张图是不是这本册子里的。
 * 分享链接只授权「这一本」,不能拿它当令牌去取作者其它照片。
 */
export function exhibitionHasMedia(exhibitionId: string, url: string): boolean {
  const db = readDB();
  // 只认成员关系。不给 coverImage 开后门 —— 老数据里出现过封面指向册外照片的情况,
  // 那时候「是封面」就成了绕过成员判定的口子
  const postIds = new Set(
    db.exhibitionPosts.filter((ep) => ep.exhibitionId === exhibitionId).map((ep) => ep.postId)
  );
  return db.posts.some((p) => postIds.has(p.id) && mediaListOf(p).includes(url));
}

// --- Exhibitions ---

export function createExhibition(data: Omit<ExhibitionRecord, "id" | "createdAt" | "updatedAt">) {
  const db = readDB();
  const exhibition: ExhibitionRecord = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.exhibitions.push(exhibition);
  writeDB(db);
  return exhibition;
}

export function findExhibitionsByUser(userId: string) {
  return readDB()
    .exhibitions.filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findExhibitionById(id: string) {
  return readDB().exhibitions.find((e) => e.id === id) || null;
}

export function findExhibitionByShareToken(token: string) {
  return readDB().exhibitions.find((e) => e.shareToken === token) || null;
}

/**
 * 分享链接的可访问性判定。
 * 之前 isPublic 是个摆设 —— 建册时写 false,但拿 token 照样打得开,
 * 字段语义和实际行为对不上。现在它真的说了算。
 */
export type ShareGate =
  | { ok: true }
  | { ok: false; reason: "revoked" | "expired" | "password" };

export function checkShareAccess(ex: ExhibitionRecord): ShareGate {
  if (!ex.isPublic) return { ok: false, reason: "revoked" };
  if (ex.shareExpiresAt && new Date(ex.shareExpiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (ex.sharePasswordHash) return { ok: false, reason: "password" };
  return { ok: true };
}

export function updateExhibition(id: string, userId: string, data: Partial<ExhibitionRecord>) {
  const db = readDB();
  const idx = db.exhibitions.findIndex((e) => e.id === id && e.userId === userId);
  if (idx === -1) return null;
  db.exhibitions[idx] = { ...db.exhibitions[idx], ...data, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.exhibitions[idx];
}

// --- 页边吐槽(欄外) ---

/** 返回用户自定义的吐槽;没配过返回 null,由调用方退回内置那套 */
export function getMarginNotes(userId: string): string[] | null {
  const notes = readDB().marginNotes?.[userId];
  if (!notes || !notes.length) return null;
  if (notes.length === 1 && notes[0] === NOTES_OFF) return [];  // 关闭:空数组
  return notes;
}

/** 关闭标记:存这一条表示用户主动关掉了页边吐槽,与"没配置过"区分开 */
const NOTES_OFF = "__off__";

export function isMarginNotesOff(userId: string): boolean {
  const notes = readDB().marginNotes?.[userId];
  return notes?.length === 1 && notes[0] === NOTES_OFF;
}

export function saveMarginNotes(userId: string, notes: string[], off = false) {
  const db = readDB();
  if (!db.marginNotes) db.marginNotes = {};
  if (off) {
    db.marginNotes[userId] = [NOTES_OFF];
    writeDB(db);
    return [];
  }
  const cleaned = notes.map((n) => n.trim()).filter(Boolean).slice(0, 60);
  if (cleaned.length) db.marginNotes[userId] = cleaned;
  else delete db.marginNotes[userId]; // 清空 = 恢复内置
  writeDB(db);
  return cleaned;
}

// --- ExhibitionPosts ---

export function createExhibitionPost(exhibitionId: string, postId: string) {
  const db = readDB();
  const ep: ExhibitionPostRecord = {
    id: crypto.randomUUID(),
    exhibitionId,
    postId,
    sortOrder: 0,
  };
  db.exhibitionPosts.push(ep);
  writeDB(db);
  return ep;
}

/**
 * 书架卡片的封面。
 * 册子自己的 coverImage 为空时退回册里第一张照片 —— 一张空封面比没有封面更糟,
 * 它让书架看起来像坏了。一次读库批量算完,不要每张卡片各查一次。
 */
export function getExhibitionCovers(exhibitionIds: string[]) {
  const db = readDB();
  const byId = new Map(db.posts.map((p) => [p.id, p]));
  const covers: Record<string, string | undefined> = {};

  for (const id of exhibitionIds) {
    const ex = db.exhibitions.find((e) => e.id === id);
    if (ex?.coverImage) { covers[id] = ex.coverImage; continue; }
    const eps = db.exhibitionPosts.filter((ep) => ep.exhibitionId === id);
    let found: string | undefined;
    for (const ep of eps) {
      const first = mediaListOf(byId.get(ep.postId) ?? ({ mediaUrls: "[]" } as PostRecord))[0];
      if (first) { found = first; break; }
    }
    covers[id] = found;
  }
  return covers;
}

export function getExhibitionPostCounts(exhibitionIds: string[]) {
  const db = readDB();
  const counts: Record<string, number> = {};
  for (const id of exhibitionIds) {
    counts[id] = db.exhibitionPosts.filter((ep) => ep.exhibitionId === id).length;
  }
  return counts;
}

export function findExhibitionPosts(exhibitionId: string) {
  const db = readDB();
  const eps = db.exhibitionPosts.filter((ep) => ep.exhibitionId === exhibitionId);
  return eps.map((ep) => {
    const post = db.posts.find((p) => p.id === ep.postId);
    return { ...ep, post };
  });
}
