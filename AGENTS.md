# Memory Gallery

## ⚠️ 开工前必读

1. **[STATUS.md](STATUS.md)** —— 项目进度、已定死的决定、当前卡点、这台机器的坑、Git 纪律。
   新会话读这一份就能接上。
2. 要改界面/样式/排版,再读 **[.claude/skills/README.md](.claude/skills/README.md)**
   (两份 skill:官方 frontend-design 管方法,memoir-ui 管本项目约束)。

一句话:这是一个**漫画风回忆录**。上传照片 → 自动分「话」→ 排成分镜 → 装订成可分享的一卷。
设计命题是**把平凡的日子变得不平凡**。

⛔ 已定死、别重新提案:不做 QQ/微信导入、不做 3D、视觉是黑白漫画不是彩色立绘、
界面要动态、不让用户交代产品该自己算的信息。

⛔ 本机验证只用 `npx tsc --noEmit` + `npm run lint`,别死磕 dev server(理由见 STATUS.md 第六节)。

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
