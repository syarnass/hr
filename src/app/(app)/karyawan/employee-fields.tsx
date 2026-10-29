"use client";

import useSWR from "swr";
import { Field, Input, Select } from "@/components/ui";
import { toDateInput } from "@/lib/format";
import type { Employee, Paginated } from "@/lib/types";

/** Kandidat atasan: karyawan ber-role MANAGER/ADMIN (maks. 100, batas API). */
function useManagerOptions(excludeId?: number) {
  const { data } = useSWR<Paginated<Employee>>("/employees?limit=100");
  return (data?.data ?? []).filter(
    (e) => e.user.role !== "EMPLOYEE" && e.id !== excludeId,
  );
}

/** Field kepegawaian yang dipakai bersama oleh form tambah & ubah. */
export function EmployeeFields({ employee }: { employee?: Employee }) {
  const managers = useManagerOptions(employee?.id);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="No. karyawan">
        <Input
          name="employeeNumber"
          required
          maxLength={30}
          defaultValue={employee?.employeeNumber}
          placeholder="EMP-0003"
        />
      </Field>
      <Field label="Tanggal bergabung">
        <Input
          name="joinDate"
          type="date"
          required
          defaultValue={toDateInput(employee?.joinDate)}
        />
      </Field>
      <Field label="Jabatan">
        <Input
          name="position"
          required
          maxLength={100}
          defaultValue={employee?.position}
          placeholder="Software Engineer"
        />
      </Field>
      <Field label="Departemen">
        <Input
          name="department"
          required
          maxLength={100}
          defaultValue={employee?.department}
          placeholder="Engineering"
        />
      </Field>
      <Field
        label="Atasan langsung"
        hint="Atasan menyetujui pengajuan cuti karyawan ini."
        className="sm:col-span-2"
      >
        <Select
          name="managerId"
          // key memaksa render ulang setelah opsi atasan selesai dimuat.
          key={managers.length}
          defaultValue={employee?.managerId ?? ""}
        >
          <option value="">Tanpa atasan (diproses Admin)</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user.name} — {m.position} ({m.employeeNumber})
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** Mengambil nilai field kepegawaian dari FormData. */
export function readEmployeeFields(form: FormData) {
  const managerId = String(form.get("managerId") ?? "");
  return {
    employeeNumber: String(form.get("employeeNumber")).trim(),
    position: String(form.get("position")).trim(),
    department: String(form.get("department")).trim(),
    joinDate: String(form.get("joinDate")),
    managerId: managerId ? Number(managerId) : null,
  };
}
