#!/usr/bin/env node
/**
 * 把 public/uploads/ 里的照片搬进 data/uploads/。
 *
 * 0.x 版本把用户照片放在 public/ 下,Next 会无条件当静态资源发出去 ——
 * 知道文件名就能下,不用登录,也绕过分享的撤销/过期/密码。
 * 现在取图一律走 /api/media 鉴权路由,文件必须离开 public/。
 *
 * 跑法:node scripts/migrate-uploads.mjs
 * 幂等,可以重复跑;没有 public/uploads 就直接退出。
 */
import { readdir, mkdir, rename, copyFile, unlink, rmdir, stat } from "node:fs/promises";
import path from "node:path";

const LEGACY = path.join(process.cwd(), "public", "uploads");
const TARGET = path.join(process.cwd(), "data", "uploads");

const legacyStat = await stat(LEGACY).catch(() => null);
if (!legacyStat?.isDirectory()) {
  console.log("没有 public/uploads,无需搬迁。");
  process.exit(0);
}

await mkdir(TARGET, { recursive: true });

const entries = await readdir(LEGACY, { withFileTypes: true });
let moved = 0, skipped = 0;

for (const entry of entries) {
  if (!entry.isFile()) continue;
  const from = path.join(LEGACY, entry.name);
  const to = path.join(TARGET, entry.name);

  // 目标已存在就不覆盖 —— 重复跑不会拿旧文件盖掉新的
  if (await stat(to).then(() => true).catch(() => false)) {
    await unlink(from);
    skipped++;
    continue;
  }

  try {
    await rename(from, to);
  } catch {
    // data 与 public 可能不在同一挂载点,rename 会 EXDEV
    await copyFile(from, to);
    await unlink(from);
  }
  moved++;
}

// 目录空了才删,里面还剩东西就留着让人自己看一眼
await rmdir(LEGACY).catch(() => {});

console.log(`搬迁完成:移动 ${moved} 个,已存在跳过 ${skipped} 个 → data/uploads/`);
