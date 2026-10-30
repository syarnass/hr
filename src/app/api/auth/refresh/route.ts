import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  API_URL,
  backendUnavailable,
  clearSessionCookies,
  forbiddenOrigin,
  forwardedHeaders,
  isTrustedMutation,
  readBackendBody,
  REFRESH_COOKIE,
  setSessionCookies,
  type AuthTokens,
} from "@/lib/session";

export async function POST(req: Request) {
  if (!isTrustedMutation(req)) return forbiddenOrigin();

  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    const response = NextResponse.json(
      { statusCode: 401, message: "Sesi berakhir, silakan login kembali" },
      { status: 401 },
    );
    clearSessionCookies(response);
    return response;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", ...forwardedHeaders(req) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return backendUnavailable();
  }

  const body = await readBackendBody(res);
  if (!res.ok) {
    const response = NextResponse.json(body, { status: res.status });
    // Refresh token ditolak (dicabut/kedaluwarsa): sesi tidak bisa dipulihkan.
    if (res.status === 401 || res.status === 400) clearSessionCookies(response);
    return response;
  }

  const response = new NextResponse(null, { status: 204 });
  setSessionCookies(response, body as AuthTokens);
  return response;
}
