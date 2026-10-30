"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { RequireRole } from "@/components/auth-provider";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Loading,
  PageHeader,
  Pagination,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import type { Employee, Paginated } from "@/lib/types";

export function EmployeeList() {
  return (
    <>
      <PageHeader
        title="Karyawan"
        description="Kelola data kepegawaian dan struktur atasan."
        action={<ButtonLink href="/karyawan/baru">Tambah karyawan</ButtonLink>}
      />
      <RequireRole roles={["ADMIN"]}>
        <List />
      </RequireRole>
    </>
  );
}

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function List() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const query = {
    search: useDebounced(search.trim()),
    department: useDebounced(department.trim()),
  };

  const { data, error, mutate } = useSWR<Paginated<Employee>>(
    `/employees${qs({ ...query, page, limit: 15 })}`,
    { keepPreviousData: true },
  );

  return (
    <Card
      title="Daftar karyawan"
      action={
        <div className="flex flex-wrap gap-2">
          <Input
            type="search"
            placeholder="Cari nama, email, no. karyawan"
            aria-label="Cari karyawan"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />
          <Input
            placeholder="Departemen"
            aria-label="Filter departemen"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40"
          />
        </div>
      }
    >
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : data.data.length === 0 ? (
        <EmptyState
          title="Karyawan tidak ditemukan"
          description="Coba ubah kata kunci atau filter departemen."
        />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>No. Karyawan</Th>
                <Th>Jabatan</Th>
                <Th>Departemen</Th>
                <Th>Atasan</Th>
                <Th>Bergabung</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e.id} className="hover:bg-subtle/50">
                  <Td>
                    <Link
                      href={`/karyawan/${e.id}`}
                      className="font-medium text-brand-strong hover:underline"
                    >
                      {e.user.name}
                    </Link>
                    <div className="text-xs text-muted">{e.user.email}</div>
                  </Td>
                  <Td className="font-mono text-xs">{e.employeeNumber}</Td>
                  <Td>
                    {e.position}
                    {e.user.role !== "EMPLOYEE" && (
                      <div>
                        <Badge tone="brand">{ROLE_LABEL[e.user.role]}</Badge>
                      </div>
                    )}
                  </Td>
                  <Td>{e.department}</Td>
                  <Td className="text-muted">{e.manager?.user.name ?? "-"}</Td>
                  <Td className="whitespace-nowrap">
                    {formatDate(e.joinDate)}
                  </Td>
                  <Td>
                    {e.user.isActive ? (
                      <Badge tone="success">Aktif</Badge>
                    ) : (
                      <Badge>Nonaktif</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
