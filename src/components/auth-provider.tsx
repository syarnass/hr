"use client";

import { createContext, use, type ReactNode } from "react";
import useSWR from "swr";
import { api, ApiError } from "@/lib/api";
import type { Employee, Role, User } from "@/lib/types";
import { Button, Spinner } from "./ui";

interface AuthContextValue {
  user: User;
  /** `null` jika akun belum terdaftar sebagai karyawan (mis. admin awal). */
  employee: Employee | null;
  hasRole: (...roles: Role[]) => boolean;
  reload: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const me = useSWR<User>("/auth/me");
  const employee = useSWR<Employee | null>(
    me.data ? "/employees/me" : null,
    async (path: string) => {
      try {
        return await api<Employee>(path);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  );

  // 401 sudah ditangani `api()` dengan mengarahkan ke halaman login.
  const error = me.error ?? employee.error;
  if (error && !(error instanceof ApiError && error.status === 401)) {
    return (
      <FullScreen>
        <p className="text-sm text-danger">{error.message}</p>
        <Button
          variant="secondary"
          onClick={() => Promise.all([me.mutate(), employee.mutate()])}
        >
          Coba lagi
        </Button>
      </FullScreen>
    );
  }
  if (!me.data || employee.data === undefined) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  }

  const user = me.data;
  const value: AuthContextValue = {
    user,
    employee: employee.data,
    hasRole: (...roles) => roles.includes(user.role),
    reload: () => Promise.all([me.mutate(), employee.mutate()]),
  };
  return <AuthContext value={value}>{children}</AuthContext>;
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted">
      {children}
    </div>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

/** Menampilkan konten hanya untuk role tertentu. */
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return (
      <div className="rounded-xl border border-line bg-surface p-10 text-center">
        <p className="font-medium text-ink">Akses ditolak</p>
        <p className="mt-1 text-sm text-muted">
          Anda tidak memiliki izin untuk membuka halaman ini.
        </p>
      </div>
    );
  }
  return children;
}

/** Pesan untuk akun yang belum punya data kepegawaian. */
export function RequireEmployee({ children }: { children: ReactNode }) {
  const { employee } = useAuth();
  if (!employee) {
    return (
      <div className="rounded-xl border border-line bg-surface p-10 text-center">
        <p className="font-medium text-ink">Belum terdaftar sebagai karyawan</p>
        <p className="mt-1 text-sm text-muted">
          Fitur cuti hanya tersedia untuk akun yang memiliki data kepegawaian.
        </p>
      </div>
    );
  }
  return children;
}
