import { NextResponse } from "next/server";
import {
  API_URL,
  backendUnavailable,
  forbiddenOrigin,
  forwardedHeaders,
  isTrustedMutation,
  readBackendBody,
  setSessionCookies,
  type AuthTokens,
} from "@/lib/session";

export async function POST(req: Request) {
  if (!isTrustedMutation(req)) return forbiddenOrigin();

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", ...forwardedHeaders(req) },
      body: await req.text(),
      cache: "no-store",
    });
  } catch {
    return backendUnavailable();
  }

  const body = await readBackendBody(res);
  if (!res.ok) return NextResponse.json(body, { status: res.status });

  // Token tidak pernah dikirim ke browser, hanya disimpan sebagai cookie.
  const response = new NextResponse(null, { status: 204 });
  setSessionCookies(response, body as AuthTokens);
  return response;
}
