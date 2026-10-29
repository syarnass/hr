"use client";

import { useState } from "react";
import useSWR from "swr";
import { RequireEmployee } from "@/components/auth-provider";
import {
  BalanceStats,
  CancelDialog,
  LeaveFilters,
  LeaveTable,
} from "@/components/leave";
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
} from "@/components/ui";
import { qs } from "@/lib/api";
import type { LeaveBalance, LeaveRequest, Paginated } from "@/lib/types";

export function MyLeaves() {
  return (
    <>
      <PageHeader
        title="Cuti Saya"
        description="Saldo dan riwayat pengajuan cuti Anda."
        action={<ButtonLink href="/cuti/ajukan">Ajukan cuti</ButtonLink>}
      />
      <RequireEmployee>
        <LeaveHistory />
      </RequireEmployee>
    </>
  );
}

function LeaveHistory() {
  const [filters, setFilters] = useState({
    status: "",
    year: String(new Date().getFullYear()),
  });
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<LeaveRequest | null>(null);

  const balance = useSWR<LeaveBalance>(
    `/leave-balances/me${qs({ year: filters.year })}`,
  );
  const list = useSWR<Paginated<LeaveRequest>>(
    `/leave-requests/me${qs({ ...filters, page, limit: 10 })}`,
  );

  return (
    <div className="space-y-6">
      {filters.year && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Saldo cuti {filters.year}
          </h2>
          {balance.error ? (
            <ErrorState error={balance.error} />
          ) : !balance.data ? (
            <Loading />
          ) : (
            <BalanceStats balance={balance.data} />
          )}
        </section>
      )}

      <Card
        title="Riwayat pengajuan"
        action={
          <LeaveFilters
            {...filters}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />
        }
      >
        {list.error ? (
          <ErrorState error={list.error} onRetry={() => list.mutate()} />
        ) : !list.data ? (
          <Loading />
        ) : list.data.data.length === 0 ? (
          <EmptyState
            title="Tidak ada pengajuan"
            description="Belum ada pengajuan cuti untuk filter ini."
          />
        ) : (
          <>
            <LeaveTable
              requests={list.data.data}
              actions={(r) =>
                r.status === "PENDING" && (
                  <Button variant="ghost" onClick={() => setCancelling(r)}>
                    Batalkan
                  </Button>
                )
              }
            />
            <Pagination meta={list.data.meta} onPage={setPage} />
          </>
        )}
      </Card>

      <CancelDialog
        request={cancelling}
        onClose={() => setCancelling(null)}
        onDone={() => {
          list.mutate();
          balance.mutate();
        }}
      />
    </div>
  );
}
