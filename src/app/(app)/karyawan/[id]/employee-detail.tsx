"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { RequireRole } from "@/components/auth-provider";
import { BalanceStats, yearOptions } from "@/components/leave";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Loading,
  PageHeader,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import { ROLE_LABEL } from "@/lib/format";
import type { Employee, LeaveBalance, Role, User } from "@/lib/types";
import { EmployeeFields, readEmployeeFields } from "../employee-fields";

export function EmployeeDetail() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Detail />
    </RequireRole>
  );
}

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, mutate } = useSWR<Employee>(`/employees/${id}`);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (!data) return <Loading />;

  return (
    <>
      <Link
        href="/karyawan"
        className="mb-4 inline-block text-sm text-muted hover:text-ink"
      >
        ← Daftar karyawan
      </Link>
      <PageHeader
        title={data.user.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {data.employeeNumber} · {data.user.email}
            <Badge tone="brand">{ROLE_LABEL[data.user.role]}</Badge>
            {!data.user.isActive && <Badge tone="danger">Nonaktif</Badge>}
          </span>
        }
      />
      <div className="space-y-6">
        <ProfileForm
          employee={data}
          onSaved={(updated) => mutate(updated, { revalidate: false })}
        />
        <AccountForm employee={data} onSaved={() => mutate()} />
        <LeaveQuota employeeId={data.id} />
      </div>
    </>
  );
}

function useSubmit<T>(action: (form: FormData) => Promise<T>) {
  const [status, setStatus] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await action(new FormData(e.currentTarget));
      setStatus({ type: "success", message: "Perubahan disimpan." });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan",
      });
    } finally {
      setLoading(false);
    }
  }
  return { status, loading, onSubmit };
}

function ProfileForm({
  employee,
  onSaved,
}: {
  employee: Employee;
  onSaved: (updated: Employee) => void;
}) {
  const { status, loading, onSubmit } = useSubmit(async (form) => {
    const updated = await api<Employee>(`/employees/${employee.id}`, {
      method: "PATCH",
      body: readEmployeeFields(form),
    });
    onSaved(updated);
  });

  return (
    <Card title="Data kepegawaian">
      <form onSubmit={onSubmit} className="space-y-4">
        {status && <Alert tone={status.type}>{status.message}</Alert>}
        <EmployeeFields employee={employee} />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AccountForm({
  employee,
  onSaved,
}: {
  employee: Employee;
  onSaved: () => void;
}) {
  const { status, loading, onSubmit } = useSubmit(async (form) => {
    await api<User>(`/users/${employee.user.id}`, {
      method: "PATCH",
      body: {
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        role: String(form.get("role")) as Role,
        isActive: form.get("isActive") === "on",
      },
    });
    onSaved();
  });

  return (
    <Card title="Akun login">
      <form onSubmit={onSubmit} className="space-y-4">
        {status && <Alert tone={status.type}>{status.message}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap">
            <Input
              name="name"
              required
              maxLength={100}
              defaultValue={employee.user.name}
            />
          </Field>
          <Field label="Email">
            <Input
              name="email"
              type="email"
              required
              maxLength={191}
              defaultValue={employee.user.email}
            />
          </Field>
          <Field
            label="Role"
            hint="Menurunkan role atasan tidak memindahkan bawahannya."
          >
            <Select name="role" defaultValue={employee.user.role}>
              <option value="EMPLOYEE">Karyawan</option>
              <option value="MANAGER">Atasan</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={employee.user.isActive}
              className="size-4 accent-brand"
            />
            Akun aktif (bisa login)
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Simpan
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LeaveQuota({ employeeId }: { employeeId: number }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, error, mutate } = useSWR<LeaveBalance>(
    `/leave-balances/employees/${employeeId}?year=${year}`,
  );
  const { status, loading, onSubmit } = useSubmit(async (form) => {
    const updated = await api<LeaveBalance>(
      `/leave-balances/employees/${employeeId}/${year}`,
      { method: "PUT", body: { quota: Number(form.get("quota")) } },
    );
    await mutate(updated, { revalidate: false });
  });

  return (
    <Card
      title="Saldo cuti"
      action={
        <Select
          aria-label="Tahun"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-auto"
        >
          {yearOptions().map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      }
    >
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="space-y-5">
          <BalanceStats balance={data} />
          <form
            onSubmit={onSubmit}
            className="flex flex-wrap items-end gap-3 border-t border-line pt-5"
          >
            <Field
              label={`Jatah cuti ${year}`}
              hint={`Tidak boleh kurang dari yang sudah terpakai (${data.used} hari).`}
            >
              <Input
                key={`${year}-${data.quota}`}
                name="quota"
                type="number"
                min={data.used}
                max={365}
                required
                defaultValue={data.quota}
                className="w-32"
              />
            </Field>
            <Button type="submit" loading={loading} className="mb-6">
              Ubah jatah
            </Button>
          </form>
          {status && <Alert tone={status.type}>{status.message}</Alert>}
        </div>
      )}
    </Card>
  );
}
