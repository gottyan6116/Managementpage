import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, isRateLimited } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "@/lib/auth/session";

// scrypt (Node crypto) を使うため Edge ではなく Node ランタイムで実行する
export const runtime = "nodejs";

function clientKey(req: NextRequest): string {
  // Vercel はプロキシ経由なので x-forwarded-for の先頭 IP を使う
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  if (isRateLimited(key)) {
    // 試行回数を明かさず一律のメッセージ・ステータスにする
    return NextResponse.json(
      { error: "しばらく時間をおいてから再度お試しください。" },
      { status: 429 },
    );
  }

  let password: unknown;
  try {
    const body = await req.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "リクエストが不正です。" }, { status: 400 });
  }

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "パスワードを入力してください。" }, { status: 400 });
  }

  const primaryOk = verifyPassword(password, process.env.APP_PASSWORD_HASH);
  const backupOk = !primaryOk && verifyPassword(password, process.env.APP_BACKUP_PASSWORD_HASH);

  if (!primaryOk && !backupOk) {
    // 意図的な遅延でブルートフォースの実効速度を落とす (本質的防御は scrypt コストとパスワード強度)
    await new Promise((r) => setTimeout(r, 350));
    return NextResponse.json({ error: "パスワードが違います。" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return res;
}
