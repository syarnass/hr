"use client";

import { useState } from "react";
import useSWR from "swr";
import { RequireRole, useAuth } from "@/components/auth-provider";
import {
  DecisionDialog,
  LeaveFilters,
  LeaveTable,
  type Decision,
} from "@/components/leave";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
} from "@/components/ui";
import { qs } from "@/lib/api";
import type { LeaveRequest, Paginated } from "@/lib/types";

export function Approvals() {
  const { hasRole } = useAuth();
  return (
    <>
      <PageHeader
        title="Persetujuan Cuti"
        description={
          hasRole("ADMIN")
            ? "Semua pengajuan cuti karyawan."
            : "Pengajuan cuti dari bawahan langsung Anda."
        }
      />
      <RequireRole roles={["MANAGER", "ADMIN"]}>
        <ApprovalList />
      </RequireRole>
    </>
  );
}

function ApprovalList() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: "PENDING", year: "" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    request: LeaveRequest;
    decision: Decision;
  } | null>(null);

  const list = useSWR<Paginated<LeaveRequest>>(
    `/leave-requests/approvals${qs({ ...filters, page, limit: 10 })}`,
  );

  return (
    <Card
      title="Daftar pengajuan"
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
          description={
            filters.status === "PENDING"
              ? "Semua pengajuan sudah diproses."
              : "Tidak ada pengajuan untuk filter ini."
          }
        />
      ) : (
        <>
          <LeaveTable
            requests={list.data.data}
            showEmployee
            actions={(r) =>
              r.status === "PENDING" &&
              r.employee.user.id !== user.id && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    className="text-danger"
                    onClick={() =>
                      setSelected({ request: r, decision: "reject" })
                    }
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setSelected({ request: r, decision: "approve" })
                    }
                  >
                    Setujui
                  </Button>
                </div>
              )
            }
          />
          <Pagination meta={list.data.meta} onPage={setPage} />
        </>
      )}

      <DecisionDialog
        request={selected?.request ?? null}
        decision={selected?.decision ?? "approve"}
        onClose={() => setSelected(null)}
        onDone={() => list.mutate()}
      />
    </Card>
  );
}
