import "server-only";
import type { NextResponse } from "next/server";

/** Base URL API NestJS, termasuk prefix global `/api`. */
export const API_URL = (
  process.env.HR_API_URL ?? "http://localhost:3000/api"
).replace(/\/+$/, "");

export const ACCESS_COOKIE = "hr_at";
export const REFRESH_COOKIE = "hr_rt";
/** Waktu kedaluwarsa access token (epoch ms), sengaja bisa dibaca JS. */
export const ACCESS_EXP_COOKIE = "hr_at_exp";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Membaca klaim `exp` (detik) dari JWT tanpa memverifikasi tanda tangan. */
function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function maxAgeOf(token: string, fallback: number): number {
  const exp = jwtExpiry(token);
  if (exp === null) return fallback;
  return Math.max(0, exp - Math.floor(Date.now() / 1000));
}

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Token disimpan di cookie httpOnly sehingga tidak bisa dibaca JavaScript. */
export function setSessionCookies(res: NextResponse, tokens: AuthTokens) {
  const accessMaxAge = maxAgeOf(tokens.accessToken, 15 * 60);
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookie,
    maxAge: accessMaxAge,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie,
    maxAge: maxAgeOf(tokens.refreshToken, 7 * 24 * 60 * 60),
  });
  res.cookies.set(ACCESS_EXP_COOKIE, String(Date.now() + accessMaxAge * 1000), {
    ...baseCookie,
    httpOnly: false,
    maxAge: accessMaxAge,
  });
}

export function clearSessionCookies(res: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ACCESS_EXP_COOKIE]) {
    res.cookies.set(name, "", { ...baseCookie, maxAge: 0 });
  }
}

/** Header yang diteruskan ke backend agar rate limit tetap per IP pengguna. */
export function forwardedHeaders(req: Request): Record<string, string> {
  const ip =
    req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  return ip ? { "x-forwarded-for": ip } : {};
}

/** Membaca body backend sebagai JSON; teks biasa dibungkus `{ message }`. */
export async function readBackendBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function backendUnavailable() {
  return Response.json(
    { statusCode: 502, message: "Server API tidak dapat dihubungi" },
    { status: 502 },
  );
}

/**
 * Perlindungan CSRF sederhana untuk request yang mengubah data: browser lain
 * tidak bisa menambahkan header kustom lintas origin tanpa preflight CORS.
 */
export function isTrustedMutation(req: Request): boolean {
  return req.headers.get("x-hr-client") === "1";
}

export function forbiddenOrigin() {
  return Response.json(
    { statusCode: 403, message: "Permintaan ditolak" },
    { status: 403 },
  );
}
