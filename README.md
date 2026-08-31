# 忆 Memory Gallery · 把日子画成回忆集

一本**漫画风的回忆录**:上传这些天拍下的照片,按时间线自动整理成分镜,AI 帮你装订成一册册可分享的回忆集。

## 它做什么

1. **收录** — 上传照片(JPG/PNG/GIF/WebP/HEIC,HEIC 自动转 JPG),拍摄时间与 GPS 从 EXIF 自动读取
2. **连载** — 照片按"天"分组成时间线分镜:哪天、在哪、拍了什么,一目了然
3. **装订** — DeepSeek AI 归类打标,起标题、写卷首语,生成可分享链接的回忆集

## 视觉

2D 漫画风(单行本手感):墨线描边、硬投影、平涂印刷色(红/黄/青)、网点纸面、手绘抖动边框、话数徽章与拟声词。深色模式是"夜刊"——炭纸白线。

## 跑起来

```bash
npm ci                                   # 按 lockfile 装,版本锁定
cp .env.example .env
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env
npm run dev                              # http://localhost:3000
```

⚠ **`AUTH_SECRET` 必填**(至少 32 字符),缺失会直接拒绝启动 —— 这是有意为之:
带默认密钥跑起来等于把会话签名密钥公开,任何人都能伪造登录态。

`DEEPSEEK_API_KEY` 选填。不配也能用:装订会自动降级为按日期/地点起名。

**从 0.x 升上来的**,照片还留在 `public/uploads/` 里,跑一次搬迁:

```bash
npm run migrate:uploads                  # public/uploads → data/uploads
```

没跑也不会裂图 —— 单张图第一次被访问时会自动搬走;但没被访问过的那些还留在
公开目录里,所以升级后应当跑一次。

## 技术栈

Next.js 16 App Router · React 19 · Tailwind 4 · exifr(EXIF)· heic-convert(HEIC 转码)· 文件型 JSON 存储(个人部署够用)

## 已知边界

- 数据存 `data/db.json`、图片存 `data/uploads/`,单机部署方案;上 Serverless 平台需改造存储
- 照片不在 `public/` 下,一律经 `/api/media/...` 鉴权取图:必须是本人,或持有效分享链接
  (撤销/过期/密码在图片这一层同样生效)。分享链接只授权那一本册子里的照片
- 曾有的 QQ 空间 Cookie 导入已移除:接口非官方、防盗链、Cookie 随时失效,不值得用户折腾
