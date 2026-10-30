import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  API_URL,
  backendUnavailable,
  forbiddenOrigin,
  forwardedHeaders,
  isTrustedMutation,
} from "@/lib/session";

/** Endpoint yang menerbitkan token hanya boleh lewat /api/auth/*. */
const BLOCKED_PATHS = new Set(["auth/login", "auth/refresh", "auth/logout"]);

/**
 * Meneruskan request browser ke API NestJS dengan access token dari cookie
 * httpOnly. Jika token kedaluwarsa, backend membalas 401 dan client akan
 * memanggil /api/auth/refresh lalu mengulang request.
 */
async function forward(
  req: NextRequest,
  ctx: RouteContext<"/api/backend/[...path]">,
) {
  const { path } = await ctx.params;
  const target = path.map(encodeURIComponent).join("/");
  if (BLOCKED_PATHS.has(target)) {
    return Response.json(
      { statusCode: 404, message: "Tidak ditemukan" },
      { status: 404 },
    );
  }
  if (req.method !== "GET" && !isTrustedMutation(req)) return forbiddenOrigin();

  const headers: Record<string, string> = {
    accept: "application/json",
    ...forwardedHeaders(req),
  };
  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const hasBody = !["GET", "HEAD", "DELETE"].includes(req.method);
  if (hasBody) {
    headers["content-type"] =
      req.headers.get("content-type") ?? "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/${target}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch {
    return backendUnavailable();
  }

  const responseHeaders = new Headers({ "cache-control": "no-store" });
  const contentType = res.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(res.status === 204 ? null : res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
