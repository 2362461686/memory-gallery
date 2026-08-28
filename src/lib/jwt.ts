import { SignJWT, jwtVerify } from "jose";

/**
 * 签名密钥必须由环境提供。
 * 曾经有过 "fallback-secret-change-me" 这样的默认值 —— 那等于把所有部署的
 * 会话签名密钥公开在源码里,任何人都能伪造登录态。宁可起不来,也不能带默认值跑。
 */
function loadSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.trim().length < 32) {
    throw new Error(
      "AUTH_SECRET 未配置或过短(至少 32 字符)。生成一个:openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(value);
}

let cached: Uint8Array | null = null;
function secret(): Uint8Array {
  if (!cached) cached = loadSecret();
  return cached;
}

export async function createToken(payload: { id: string; email: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as { id: string; email: string };
  } catch {
    return null;
  }
}
