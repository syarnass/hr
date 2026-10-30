import { NextResponse, type NextRequest } from "next/server";

// Disalin dari lib/session: proxy sebaiknya tidak bergantung pada modul lain.
const REFRESH_COOKIE = "hr_rt";

/**
 * Pengecekan cepat: tanpa refresh token, pengguna pasti belum login.
 * Validasi token sesungguhnya tetap dilakukan oleh API NestJS.
 */
export function proxy(req: NextRequest) {
  const loggedIn = req.cookies.has(REFRESH_COOKIE);
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login") {
    return loggedIn
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();
  }
  if (!loggedIn) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
