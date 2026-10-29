"use client";

import useSWR from "swr";
import { RequireEmployee, RequireRole } from "@/components/auth-provider";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  PageHeader,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import type { Employee } from "@/lib/types";

export function Team() {
  return (
    <>
      <PageHeader
        title="Tim Saya"
        description="Karyawan yang melapor langsung kepada Anda."
      />
      <RequireRole roles={["MANAGER", "ADMIN"]}>
        <RequireEmployee>
          <TeamList />
        </RequireEmployee>
      </RequireRole>
    </>
  );
}

function TeamList() {
  const { data, error, mutate } = useSWR<Employee[]>(
    "/employees/me/subordinates",
  );

  return (
    <Card title={data ? `${data.length} anggota tim` : "Anggota tim"}>
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <EmptyState
          title="Belum ada bawahan"
          description="Admin HR dapat mengatur atasan setiap karyawan."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>No. Karyawan</Th>
              <Th>Jabatan</Th>
              <Th>Departemen</Th>
              <Th>Bergabung</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <Td>
                  <div className="font-medium">{e.user.name}</div>
                  <div className="text-xs text-muted">{e.user.email}</div>
                </Td>
                <Td className="font-mono text-xs">{e.employeeNumber}</Td>
                <Td>
                  {e.position}{" "}
                  {e.user.role !== "EMPLOYEE" && (
                    <Badge tone="brand">{ROLE_LABEL[e.user.role]}</Badge>
                  )}
                </Td>
                <Td>{e.department}</Td>
                <Td className="whitespace-nowrap">{formatDate(e.joinDate)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
