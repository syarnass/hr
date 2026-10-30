import type { LeaveStatus, Role } from "./types";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/**
 * Kolom `@db.Date` dikirim sebagai `YYYY-MM-DDT00:00:00.000Z`, jadi
 * diformat dalam UTC agar tanggalnya tidak bergeser.
 */
export function formatDate(value: string | null | undefined): string {
  return value ? dateFmt.format(new Date(value)) : "-";
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFmt.format(new Date(value)) : "-";
}

export function formatRange(start: string, end: string): string {
  return start.slice(0, 10) === end.slice(0, 10)
    ? formatDate(start)
    : `${formatDate(start)} – ${formatDate(end)}`;
}

/** `YYYY-MM-DD` dari nilai tanggal API, untuk input type="date". */
export function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/** Tanggal hari ini (zona Asia/Jakarta) dalam format `YYYY-MM-DD`. */
export function todayInput(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

/** Jumlah hari kerja (Senin–Jumat) inklusif, sama dengan aturan backend. */
export function countWorkingDays(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const day = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  let count = 0;
  while (day <= last) {
    const weekday = day.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return count;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Atasan",
  EMPLOYEE: "Karyawan",
};

export const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
