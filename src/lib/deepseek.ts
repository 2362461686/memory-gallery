const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function chat(messages: DeepSeekMessage[]): Promise<string> {
  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${error}`);
  }

  const data: DeepSeekResponse = await res.json();
  return data.choices[0].message.content;
}

// Curate posts: classify into themes, generate exhibition
export async function curatePosts(posts: {
  id: string;
  contentText?: string | null;
  postedAt?: string | null;
  location?: string | null;
}[]): Promise<{
  theme: string;
  title: string;
  description: string;
  postCategories: Record<string, { category: string; tags: string[]; sentiment: string; description: string }>;
}> {
  const postsJson = posts.map((p) => ({
    id: p.id,
    text: p.contentText || "(无文字内容)",
    date: p.postedAt || "未知时间",
    location: p.location || "未知地点",
  }));

  const systemPrompt = `你是一个专业的数字生活策展人。你需要分析用户的社交媒体内容，将其分类并策划成一场虚拟展览。

任务：
1. 分析所有帖子的主题分布，确定一个最佳展览主题（从以下选择：food美食、travel旅行、music音乐、emotion情感、life日常、mix综合）
2. 为展览起一个富有诗意和二次元风格的中文标题（8-15字）
3. 写一段策展人导语（80-150字），用温暖、治愈、二次元风格的文字
4. 为每篇帖子分类并打标签

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "theme": "主题英文名",
  "title": "展览标题",
  "description": "策展人导语",
  "postCategories": {
    "post_id_1": {"category": "food", "tags": ["甜品", "抹茶", "下午茶"], "sentiment": "positive", "description": "一张诱人的抹茶蛋糕照片..."},
    "post_id_2": ...
  }
}`;

  const userPrompt = `以下是用户近期发布的社交内容（${posts.length}条），请分析并策展：

${JSON.stringify(postsJson, null, 2)}`;

  const response = await chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");

  return JSON.parse(jsonMatch[0]);
}

// Generate image description for content understanding
export async function describeImage(imageBase64: string): Promise<string> {
  const prompt = "请用中文简短描述这张图片的内容、氛围和关键元素（50字以内）。";

  const res = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek vision API error: ${res.status} ${error}`);
  }

  const data: DeepSeekResponse = await res.json();
  return data.choices[0].message.content;
}

// Generate exhibition cover text overlay
export async function generateCoverText(title: string, theme: string): Promise<string> {
  const response = await chat([
    {
      role: "system",
      content: "你是一个二次元风格的设计师。为展览封面生成一句吸引人的标语（10-20字）。",
    },
    {
      role: "user",
      content: `展览标题：${title}，展览主题：${theme}，请生成一句二次元风格的封面标语。`,
    },
  ]);
  return response.trim();
}
