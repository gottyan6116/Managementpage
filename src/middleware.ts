import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * 全ルートを既定でブロックし、許可リストのみ通す (allow-list 方式)。
 * ブロック方式 (特定パスだけ守る) より安全側に倒せるため。
 */
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) {
    // ログイン済みで /login に来た場合はアプリへ戻す
    if (pathname === "/login") {
      const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
      if (authed) return NextResponse.redirect(new URL("/todo", req.url));
    }
    return NextResponse.next();
  }

  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!authed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 静的アセット (_next/static, _next/image, favicon 等) を除く全パスに適用する。
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
