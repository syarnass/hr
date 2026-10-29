"use client";

/** Error dari API, `message` sudah siap ditampilkan ke pengguna. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CLIENT_HEADER = { "x-hr-client": "1" };
const ACCESS_EXP_COOKIE = "hr_at_exp";

function readAccessExp(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${ACCESS_EXP_COOKIE}=`))
    ?.split("=")[1];
}

let refreshing: Promise<boolean> | null = null;

/**
 * Menukar refresh token sekali saja walau banyak request gagal bersamaan.
 * Refresh token dirotasi oleh backend, jadi dua refresh paralel akan
 * membuat salah satunya gagal dan sesi ikut berakhir. Web Locks mencegah
 * hal yang sama terjadi antar-tab.
 */
function refreshSession(expBefore: string | undefined): Promise<boolean> {
  refreshing ??= (async () => {
    const run = async () => {
      // Tab lain sudah memperbarui token selagi kita menunggu lock.
      if (readAccessExp() && readAccessExp() !== expBefore) return true;
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: CLIENT_HEADER,
      });
      return res.ok;
    };
    try {
      return navigator.locks
        ? await navigator.locks.request("hr-refresh", run)
        : await run();
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Navigasi dengan memuat ulang halaman. Dipakai saat sesi berganti agar
 * cache SWR milik pengguna sebelumnya ikut terhapus, sesuatu yang tidak
 * dilakukan `router.push()`.
 */
export function hardNavigate(path: string) {
  window.location.href = path;
}

function redirectToLogin() {
  const next = window.location.pathname + window.location.search;
  hardNavigate(`/login?next=${encodeURIComponent(next)}`);
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Terjadi kesalahan (${res.status})`;
  try {
    const body = await res.json();
    // ValidationPipe NestJS mengirim `message` berupa array string.
    if (Array.isArray(body?.message)) message = body.message.join(", ");
    else if (typeof body?.message === "string") message = body.message;
  } catch {
    // body bukan JSON, pakai pesan default
  }
  return new ApiError(res.status, message);
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Memanggil API NestJS melalui proxy `/api/backend`. Path tanpa prefix
 * `/api`, contoh: `api("/leave-requests/me?status=PENDING")`.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: Method; body?: unknown } = {},
): Promise<T> {
  const send = () =>
    fetch(`/api/backend${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...CLIENT_HEADER,
        ...(options.body !== undefined && {
          "content-type": "application/json",
        }),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  const expBefore = readAccessExp();
  let res = await send();
  if (res.status === 401) {
    if (!(await refreshSession(expBefore))) {
      redirectToLogin();
      throw new ApiError(401, "Sesi berakhir, silakan login kembali");
    }
    res = await send();
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Fetcher untuk SWR: key berupa path API. */
export const fetcher = <T>(path: string) => api<T>(path);

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { ...CLIENT_HEADER, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    if (res.status === 429) {
      throw new ApiError(429, "Terlalu banyak percobaan, coba lagi sebentar");
    }
    throw await toApiError(res);
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", headers: CLIENT_HEADER });
}

/** Membuat query string, mengabaikan nilai kosong. */
export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
