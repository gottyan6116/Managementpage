import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth/session";
import { verifyConfiguredPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/guard";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const attempt = attempts.get(ip);
  if (attempt && attempt.resetAt > now && attempt.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "しばらく待ってから再度お試しください。" }, { status: 429 });
  }
  const body = await request.json().catch(() => null) as { password?: unknown; next?: unknown } | null;
  const hashes = [process.env.APP_PASSWORD_HASH, process.env.APP_BACKUP_PASSWORD_HASH].filter((value): value is string => Boolean(value));
  if (!body || typeof body.password !== "string" || !process.env.AUTH_SESSION_SECRET || hashes.length === 0 || !verifyConfiguredPassword(body.password, hashes)) {
    attempts.set(ip, { count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1, resetAt: now + WINDOW_MS });
    return NextResponse.json({ error: "パスワードを確認してください。" }, { status: 401 });
  }
  attempts.delete(ip);
  const next = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/todo";
  const response = NextResponse.json({ next });
  response.cookies.set(SESSION_COOKIE, createSessionToken(process.env.AUTH_SESSION_SECRET), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
