"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { fetcher, hardNavigate, logout } from "@/lib/api";
import { initials, ROLE_LABEL } from "@/lib/format";
import type { Role } from "@/lib/types";
import { AuthProvider, useAuth } from "./auth-provider";
import { cn } from "./ui";

interface NavItem {
  href: string;
  label: string;
  roles?: Role[];
  /** Hanya untuk akun yang punya data kepegawaian. */
  needsEmployee?: boolean;
  icon: ReactNode;
}

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4.5 shrink-0"
    aria-hidden
  >
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  { href: "/", label: "Dasbor", icon: icon("M3 12l9-8 9 8M5 10v10h14V10") },
  {
    href: "/cuti",
    label: "Cuti Saya",
    needsEmployee: true,
    icon: icon(
      "M8 3v4M16 3v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    ),
  },
  {
    href: "/persetujuan",
    label: "Persetujuan",
    roles: ["MANAGER", "ADMIN"],
    icon: icon("M9 12l2 2 4-4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"),
  },
  {
    href: "/tim",
    label: "Tim Saya",
    roles: ["MANAGER", "ADMIN"],
    needsEmployee: true,
    icon: icon(
      "M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8",
    ),
  },
  {
    href: "/karyawan",
    label: "Karyawan",
    roles: ["ADMIN"],
    icon: icon(
      "M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 21v-4h6v4",
    ),
  },
  {
    href: "/pengguna",
    label: "Pengguna",
    roles: ["ADMIN"],
    icon: icon("M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{ fetcher, revalidateOnFocus: false, shouldRetryOnError: false }}
    >
      <AuthProvider>
        <Shell>{children}</Shell>
      </AuthProvider>
    </SWRConfig>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Bilah atas untuk layar kecil */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-lg p-2 text-muted hover:bg-subtle"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
        >
          {icon(menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16")}
        </button>
      </div>

      <aside
        className={cn(
          "border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r",
          menuOpen ? "block border-b" : "hidden",
        )}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Brand />
        </div>
        <Nav onNavigate={() => setMenuOpen(false)} />
        <UserMenu />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
        HR
      </span>
      <span className="font-semibold text-ink">HR Portal</span>
    </Link>
  );
}

function Nav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { hasRole, employee } = useAuth();
  const items = NAV.filter(
    (item) =>
      (!item.roles || hasRole(...item.roles)) &&
      (!item.needsEmployee || employee),
  );

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-2">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand/10 text-brand-strong"
                : "text-muted hover:bg-subtle hover:text-ink",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    await logout();
    hardNavigate("/login");
  }

  return (
    <div className="border-t border-line p-3">
      <Link
        href="/profil"
        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-subtle"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink">
          {initials(user.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">
            {user.name}
          </span>
          <span className="block truncate text-xs text-muted">
            {ROLE_LABEL[user.role]} · {user.email}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        disabled={leaving}
        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-subtle hover:text-danger disabled:opacity-50"
      >
        {leaving ? "Keluar…" : "Keluar"}
      </button>
    </div>
  );
}
