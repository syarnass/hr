"use client";

import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/components/auth-provider";
import { BalanceStats, LeaveTable } from "@/components/leave";
import {
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Stat,
} from "@/components/ui";
import type {
  Employee,
  LeaveBalance,
  LeaveRequest,
  Paginated,
} from "@/lib/types";

export function Dashboard() {
  const { user, employee, hasRole } = useAuth();
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName}`}
        description={
          employee
            ? `${employee.position} · ${employee.department}`
            : "Selamat datang di HR Portal"
        }
        action={
          employee && <ButtonLink href="/cuti/ajukan">Ajukan cuti</ButtonLink>
        }
      />
      <div className="space-y-6">
        {hasRole("MANAGER", "ADMIN") && <ManagerSummary />}
        {employee && <MyLeaveSummary />}
      </div>
    </>
  );
}

function ManagerSummary() {
  const { hasRole } = useAuth();
  const pending = useSWR<Paginated<LeaveRequest>>(
    "/leave-requests/approvals?status=PENDING&limit=5",
  );
  const employees = useSWR<Paginated<Employee>>(
    hasRole("ADMIN") ? "/employees?limit=1" : null,
  );
  const team = useSWR<Employee[]>(
    hasRole("MANAGER") ? "/employees/me/subordinates" : null,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Menunggu persetujuan"
          value={pending.data?.meta.total ?? "–"}
          hint="pengajuan cuti"
          tone="brand"
        />
        {hasRole("ADMIN") ? (
          <Stat
            label="Total karyawan"
            value={employees.data?.meta.total ?? "–"}
            hint="terdaftar"
          />
        ) : (
          <Stat
            label="Bawahan langsung"
            value={team.data?.length ?? "–"}
            hint="orang"
          />
        )}
      </div>

      <Card
        title="Perlu diproses"
        action={
          <Link
            href="/persetujuan"
            className="text-sm font-medium text-brand-strong hover:underline"
          >
            Lihat semua
          </Link>
        }
      >
        {pending.error ? (
          <ErrorState error={pending.error} onRetry={() => pending.mutate()} />
        ) : !pending.data ? (
          <Loading />
        ) : pending.data.data.length === 0 ? (
          <EmptyState
            title="Tidak ada pengajuan yang menunggu"
            description="Semua pengajuan cuti sudah diproses."
          />
        ) : (
          <LeaveTable requests={pending.data.data} showEmployee />
        )}
      </Card>
    </div>
  );
}

function MyLeaveSummary() {
  const balance = useSWR<LeaveBalance>("/leave-balances/me");
  const recent = useSWR<Paginated<LeaveRequest>>("/leave-requests/me?limit=5");

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          Saldo cuti tahun ini
        </h2>
        {balance.error ? (
          <ErrorState error={balance.error} onRetry={() => balance.mutate()} />
        ) : !balance.data ? (
          <Loading />
        ) : (
          <BalanceStats balance={balance.data} />
        )}
      </section>

      <Card
        title="Pengajuan cuti terakhir"
        action={
          <Link
            href="/cuti"
            className="text-sm font-medium text-brand-strong hover:underline"
          >
            Riwayat lengkap
          </Link>
        }
      >
        {recent.error ? (
          <ErrorState error={recent.error} onRetry={() => recent.mutate()} />
        ) : !recent.data ? (
          <Loading />
        ) : recent.data.data.length === 0 ? (
          <EmptyState
            title="Belum ada pengajuan cuti"
            action={<ButtonLink href="/cuti/ajukan">Ajukan cuti</ButtonLink>}
          />
        ) : (
          <LeaveTable requests={recent.data.data} />
        )}
      </Card>
    </div>
  );
}
