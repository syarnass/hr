"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { RequireEmployee, useAuth } from "@/components/auth-provider";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api";
import { countWorkingDays, todayInput } from "@/lib/format";
import type { LeaveBalance, LeaveRequest } from "@/lib/types";

export function LeaveRequestForm() {
  return (
    <>
      <PageHeader
        title="Ajukan Cuti"
        description="Pengajuan akan dikirim ke atasan langsung Anda untuk disetujui."
      />
      <RequireEmployee>
        <Form />
      </RequireEmployee>
    </>
  );
}

function Form() {
  const router = useRouter();
  const { employee } = useAuth();
  const today = todayInput();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const year = startDate.slice(0, 4);
  const balance = useSWR<LeaveBalance>(
    /^\d{4}$/.test(year) ? `/leave-balances/me?year=${year}` : null,
  );
  const days = countWorkingDays(startDate, endDate);
  const crossesYear = endDate.slice(0, 4) !== year;
  const exceeds = balance.data !== undefined && days > balance.data.available;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("reason")).trim();
    setError(null);
    setLoading(true);
    try {
      const created = await api<LeaveRequest>("/leave-requests", {
        method: "POST",
        body: { startDate, endDate, reason },
      });
      router.push(`/cuti/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan cuti");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal mulai">
              <Input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </Field>
            <Field label="Tanggal selesai">
              <Input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Alasan">
            <Textarea
              name="reason"
              required
              rows={4}
              maxLength={500}
              placeholder="Contoh: Acara keluarga"
            />
          </Field>

          {crossesYear && (
            <Alert>Satu pengajuan tidak boleh melewati pergantian tahun.</Alert>
          )}
          {exceeds && (
            <Alert>
              Jumlah hari melebihi saldo yang bisa diajukan (
              {balance.data?.available} hari).
            </Alert>
          )}
          {days === 0 && startDate && endDate && (
            <Alert tone="info">
              Rentang tanggal ini hanya berisi akhir pekan.
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <ButtonLink href="/cuti" variant="secondary">
              Batal
            </ButtonLink>
            <Button
              type="submit"
              loading={loading}
              disabled={days === 0 || crossesYear || exceeds}
            >
              Kirim pengajuan
            </Button>
          </div>
        </form>
      </Card>

      <aside className="space-y-3">
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Lama cuti
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {days} <span className="text-base font-normal">hari kerja</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Sabtu dan Minggu tidak dihitung.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Saldo {year}
          </p>
          {balance.data ? (
            <p className="mt-1 text-ink">
              <span className="text-2xl font-semibold tabular-nums">
                {balance.data.available}
              </span>{" "}
              hari bisa diajukan
            </p>
          ) : (
            <p className="mt-1 text-muted">Memuat…</p>
          )}
          <p className="mt-3 text-xs text-muted">
            Disetujui oleh:{" "}
            <span className="text-ink">
              {employee?.manager?.user.name ?? "Admin HR"}
            </span>
          </p>
        </div>
      </aside>
    </div>
  );
}
