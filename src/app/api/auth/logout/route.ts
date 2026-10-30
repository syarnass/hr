import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  clearSessionCookies,
  forbiddenOrigin,
  isTrustedMutation,
} from "@/lib/session";

export async function POST(req: Request) {
  if (!isTrustedMutation(req)) return forbiddenOrigin();

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    // Mencabut refresh token di backend; cookie tetap dihapus walau gagal.
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }).catch(() => undefined);
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);
  return response;
}
