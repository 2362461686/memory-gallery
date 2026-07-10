import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "邮箱和密码为必填，密码至少6位" }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = createUser({
      name: name || email.split("@")[0],
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
