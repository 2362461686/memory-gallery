import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

interface DB {
  users: UserRecord[];
  posts: PostRecord[];
  exhibitions: ExhibitionRecord[];
  exhibitionPosts: ExhibitionPostRecord[];
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
  isPublic: boolean;
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
    const empty: DB = { users: [], posts: [], exhibitions: [], exhibitionPosts: [] };
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
