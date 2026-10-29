"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { formatDate, formatRange } from "@/lib/format";
import type { LeaveBalance, LeaveRequest, LeaveStatus } from "@/lib/types";
import {
  Alert,
  Button,
  Field,
  Modal,
  Select,
  Stat,
  StatusBadge,
  Table,
  Td,
  Textarea,
  Th,
} from "./ui";

export function BalanceStats({ balance }: { balance: LeaveBalance }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        label="Bisa diajukan"
        value={balance.available}
        hint="hari kerja"
        tone="brand"
      />
      <Stat
        label="Jatah"
        value={balance.quota}
        hint={`tahun ${balance.year}`}
      />
      <Stat label="Terpakai" value={balance.used} hint="sudah disetujui" />
      <Stat label="Menunggu" value={balance.pending} hint="belum diproses" />
    </div>
  );
}

export function LeaveTable({
  requests,
  showEmployee,
  actions,
}: {
  requests: LeaveRequest[];
  showEmployee?: boolean;
  actions?: (request: LeaveRequest) => React.ReactNode;
}) {
  return (
    <Table>
      <thead>
        <tr>
          {showEmployee && <Th>Karyawan</Th>}
          <Th>Tanggal</Th>
          <Th className="text-right">Hari</Th>
          <Th>Alasan</Th>
          <Th>Status</Th>
          <Th>Diajukan</Th>
          {actions && <Th className="text-right">Aksi</Th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr key={r.id} className="hover:bg-subtle/50">
            {showEmployee && (
              <Td>
                <div className="font-medium">{r.employee.user.name}</div>
                <div className="text-xs text-muted">
                  {r.employee.employeeNumber}
                </div>
              </Td>
            )}
            <Td className="whitespace-nowrap">
              <Link
                href={`/cuti/${r.id}`}
                className="font-medium text-brand-strong hover:underline"
              >
                {formatRange(r.startDate, r.endDate)}
              </Link>
            </Td>
            <Td className="text-right tabular-nums">{r.days}</Td>
            <Td className="max-w-64">
              <span className="line-clamp-2 text-muted">{r.reason}</span>
            </Td>
            <Td>
              <StatusBadge status={r.status} />
            </Td>
            <Td className="whitespace-nowrap text-muted">
              {formatDate(r.createdAt)}
            </Td>
            {actions && (
              <Td className="text-right whitespace-nowrap">{actions(r)}</Td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export const STATUS_OPTIONS: { value: LeaveStatus | ""; label: string }[] = [
  { value: "", label: "Semua status" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export function yearOptions(): number[] {
  const now = new Date().getFullYear();
  return [now + 1, now, now - 1, now - 2];
}

export function LeaveFilters({
  status,
  year,
  onChange,
}: {
  status: string;
  year: string;
  onChange: (next: { status: string; year: string }) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        aria-label="Filter status"
        value={status}
        onChange={(e) => onChange({ status: e.target.value, year })}
        className="w-auto"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Filter tahun"
        value={year}
        onChange={(e) => onChange({ status, year: e.target.value })}
        className="w-auto"
      >
        <option value="">Semua tahun</option>
        {yearOptions().map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}

export type Decision = "approve" | "reject";

/** Dialog setuju/tolak. Alasan wajib diisi saat menolak. */
export function DecisionDialog({
  request,
  decision,
  onClose,
  onDone,
}: {
  request: LeaveRequest | null;
  decision: Decision;
  onClose: () => void;
  onDone: (updated: LeaveRequest) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const approving = decision === "approve";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!request) return;
    const note = String(new FormData(e.currentTarget).get("note")).trim();
    setError(null);
    setLoading(true);
    try {
      const updated = await api<LeaveRequest>(
        `/leave-requests/${request.id}/${decision}`,
        { method: "PATCH", body: note ? { note } : {} },
      );
      onDone(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={request !== null}
      title={approving ? "Setujui pengajuan cuti" : "Tolak pengajuan cuti"}
      onClose={() => {
        setError(null);
        onClose();
      }}
    >
      {request && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-subtle px-3.5 py-3 text-sm">
            <p className="font-medium">{request.employee.user.name}</p>
            <p className="text-muted">
              {formatRange(request.startDate, request.endDate)} · {request.days}{" "}
              hari kerja
            </p>
            <p className="mt-1 text-muted">“{request.reason}”</p>
          </div>
          {error && <Alert>{error}</Alert>}
          <Field label={approving ? "Catatan (opsional)" : "Alasan penolakan"}>
            <Textarea
              name="note"
              rows={3}
              maxLength={500}
              required={!approving}
              placeholder={
                approving
                  ? "Contoh: Selamat berlibur"
                  : "Contoh: Bentrok dengan deadline proyek"
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              variant={approving ? "primary" : "danger"}
              loading={loading}
            >
              {approving ? "Setujui" : "Tolak"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Konfirmasi pembatalan pengajuan milik sendiri yang masih PENDING. */
export function CancelDialog({
  request,
  onClose,
  onDone,
}: {
  request: LeaveRequest | null;
  onClose: () => void;
  onDone: (updated: LeaveRequest) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!request) return;
    setLoading(true);
    setError(null);
    try {
      onDone(
        await api<LeaveRequest>(`/leave-requests/${request.id}/cancel`, {
          method: "PATCH",
        }),
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={request !== null}
      title="Batalkan pengajuan?"
      onClose={onClose}
    >
      {request && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Pengajuan cuti {formatRange(request.startDate, request.endDate)} (
            {request.days} hari kerja) akan dibatalkan. Saldo cuti tidak
            berubah.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Kembali
            </Button>
            <Button variant="danger" loading={loading} onClick={confirm}>
              Batalkan pengajuan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
