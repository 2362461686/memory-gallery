import sharp from "sharp";

export interface ImageFeatures {
  /** 主色 hex,驱动该话色调 */
  dominantColor: string;
  /** 宽高比 w/h,用于按比例排版 */
  aspectRatio: number;
  /** 视觉兴趣度 0-1,用于挑主角格 */
  interest: number;
}

/**
 * 从图片本身提取排版所需的信号。
 * 截图、老照片这类没有 EXIF 的图,靠这些特征也能排出有节奏的版面 ——
 * 用户不需要交代任何东西。
 */
export async function extractFeatures(buffer: Buffer): Promise<ImageFeatures | null> {
  try {
    const image = sharp(buffer, { failOn: "none" });
    const meta = await image.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;
    if (!width || !height) return null;

    // 缩到极小再统计:32x32 足够表达色彩分布,成本可忽略
    const { data, info } = await image
      .resize(32, 32, { fit: "fill" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const px = info.width * info.height;
    let rSum = 0, gSum = 0, bSum = 0;
    const sat: number[] = [];
    const lum: number[] = [];

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      rSum += r; gSum += g; bSum += b;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      sat.push(max === 0 ? 0 : (max - min) / max);
      lum.push((0.299 * r + 0.587 * g + 0.114 * b) / 255);
    }

    // 主色:平均色往饱和方向推一把,避免一片灰扑扑
    const avgR = rSum / px, avgG = gSum / px, avgB = bSum / px;
    const dominantColor = boostSaturation(avgR, avgG, avgB);

    // 兴趣度 = 亮度对比 × 平均饱和度。
    // 截图通常大片纯色低对比 → 分低,不会被选去当主角格;
    // 风景/人像色彩丰富、明暗有层次 → 分高。
    const meanLum = lum.reduce((a, b) => a + b, 0) / lum.length;
    const lumStd = Math.sqrt(lum.reduce((a, b) => a + (b - meanLum) ** 2, 0) / lum.length);
    const meanSat = sat.reduce((a, b) => a + b, 0) / sat.length;
    const interest = Math.min(1, lumStd * 2.2 * 0.6 + meanSat * 0.4 * 1.6);

    return {
      dominantColor,
      aspectRatio: Number((width / height).toFixed(3)),
      interest: Number(interest.toFixed(3)),
    };
  } catch {
    return null;
  }
}

function boostSaturation(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const mid = (max + min) / 2;
  const push = (v: number) => Math.round(Math.max(0, Math.min(255, mid + (v - mid) * 1.9)));
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(push(r))}${hex(push(g))}${hex(push(b))}`;
}
