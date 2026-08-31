/**
 * 图片地址的翻译层。
 *
 * 上传的照片曾经直接落在 `public/uploads/`,由 Next 当静态资源发出去 ——
 * 那等于任何人拿到文件名就能下载别人的私人照片,不需要登录、也绕过分享的
 * 撤销/过期/密码。现在文件搬进 `data/uploads/`(不对外),一律经鉴权路由。
 *
 * 库里 `mediaUrls` 存的仍是 `/uploads/<file>` —— 那是**逻辑地址**,不是 URL,
 * 老数据因此不用迁移。要渲染时用这里的 mediaSrc 翻成真正能取到图的地址。
 *
 * 这个文件被客户端组件 import,不能引入任何 node 内置模块。
 */

const PREFIX = "/uploads/";

/** 只认 UUID 那类文件名;带斜杠、`..`、控制字符的一律不放行 */
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function isSafeMediaName(name: string): boolean {
  return SAFE_NAME.test(name) && !name.includes("..");
}

/** 从逻辑地址取文件名;不是上传图或名字不合法都返回 null */
export function mediaName(url: string | null | undefined): string | null {
  if (!url || !url.startsWith(PREFIX)) return null;
  const name = url.slice(PREFIX.length);
  return isSafeMediaName(name) ? name : null;
}

/**
 * 逻辑地址 → 可访问地址。
 * 传了 shareToken 就走分享通道 —— 收到链接的人没有账号,但那本册子对他开着。
 */
export function mediaSrc(url: string, shareToken?: string): string;
export function mediaSrc(url: string | null | undefined, shareToken?: string): string | undefined;
export function mediaSrc(url: string | null | undefined, shareToken?: string): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith(PREFIX)) return url; // 外链或更早的老数据,原样放行
  const name = url.slice(PREFIX.length);
  const base = shareToken
    ? `/api/share/${encodeURIComponent(shareToken)}/media`
    : "/api/media";
  return `${base}/${encodeURIComponent(name)}`;
}

/** 反过来:路由拿到的文件名 → 库里存的逻辑地址,用于比对归属 */
export function mediaUrlOf(name: string): string {
  return `${PREFIX}${name}`;
}
