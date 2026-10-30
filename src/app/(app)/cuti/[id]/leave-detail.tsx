"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/auth-provider";
import {
  CancelDialog,
  DecisionDialog,
  type Decision,
} from "@/components/leave";
import {
  Button,
  Card,
  DescriptionList,
  ErrorState,
  Loading,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import type { LeaveRequest } from "@/lib/types";

export function LeaveDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { data, error, mutate } = useSWR<LeaveRequest>(`/leave-requests/${id}`);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [cancelling, setCancelling] = useState(false);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (!data) return <Loading />;

  const isOwner = data.employee.user.id === user.id;
  const pending = data.status === "PENDING";
  // Backend tetap memvalidasi bahwa pemroses adalah atasan langsung / admin.
  const canDecide = pending && !isOwner && hasRole("MANAGER", "ADMIN");

  return (
    <>
      <Link
        href={isOwner ? "/cuti" : "/persetujuan"}
        className="mb-4 inline-block text-sm text-muted hover:text-ink"
      >
        ← Kembali
      </Link>
      <PageHeader
        title={`Pengajuan Cuti #${data.id}`}
        description={`Diajukan ${formatDateTime(data.createdAt)}`}
        action={
          <div className="flex gap-2">
            {isOwner && pending && (
              <Button variant="secondary" onClick={() => setCancelling(true)}>
                Batalkan
              </Button>
            )}
            {canDecide && (
              <>
                <Button variant="danger" onClick={() => setDecision("reject")}>
                  Tolak
                </Button>
                <Button onClick={() => setDecision("approve")}>Setujui</Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card title="Rincian">
          <DescriptionList
            items={[
              {
                label: "Karyawan",
                value: `${data.employee.user.name} (${data.employee.employeeNumber})`,
              },
              { label: "Status", value: <StatusBadge status={data.status} /> },
              { label: "Tanggal mulai", value: formatDate(data.startDate) },
              { label: "Tanggal selesai", value: formatDate(data.endDate) },
              { label: "Lama cuti", value: `${data.days} hari kerja` },
              { label: "Alasan", value: data.reason },
            ]}
          />
        </Card>

        <Card title="Keputusan">
          {pending ? (
            <p className="text-sm text-muted">Menunggu persetujuan atasan.</p>
          ) : data.status === "CANCELLED" ? (
            <p className="text-sm text-muted">
              Dibatalkan oleh karyawan pada {formatDateTime(data.decidedAt)}.
            </p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Diproses oleh</dt>
                <dd className="text-ink">{data.approver?.name ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Waktu</dt>
                <dd className="text-ink">{formatDateTime(data.decidedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Catatan</dt>
                <dd className="text-ink">{data.decisionNote || "-"}</dd>
              </div>
            </dl>
          )}
        </Card>
      </div>

      <DecisionDialog
        request={decision ? data : null}
        decision={decision ?? "approve"}
        onClose={() => setDecision(null)}
        onDone={(updated) => mutate(updated, { revalidate: false })}
      />
      <CancelDialog
        request={cancelling ? data : null}
        onClose={() => setCancelling(false)}
        onDone={(updated) => mutate(updated, { revalidate: false })}
      />
    </>
  );
}
