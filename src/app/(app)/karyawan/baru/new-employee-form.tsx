"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { RequireRole } from "@/components/auth-provider";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
} from "@/components/ui";
import { api } from "@/lib/api";
import { PASSWORD_HINT } from "@/lib/password";
import type { Employee } from "@/lib/types";
import { EmployeeFields, readEmployeeFields } from "../employee-fields";

export function NewEmployeeForm() {
  return (
    <>
      <PageHeader
        title="Tambah Karyawan"
        description="Membuat akun login sekaligus data kepegawaian."
      />
      <RequireRole roles={["ADMIN"]}>
        <Form />
      </RequireRole>
    </>
  );
}

function Form() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { managerId, ...profile } = readEmployeeFields(form);
    setError(null);
    setLoading(true);
    try {
      const created = await api<Employee>("/employees", {
        method: "POST",
        body: {
          name: String(form.get("name")).trim(),
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
          role: String(form.get("role")),
          ...profile,
          // Saat membuat, field ini harus dihilangkan (bukan null) jika kosong.
          ...(managerId !== null && { managerId }),
        },
      });
      router.push(`/karyawan/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert>{error}</Alert>}
      <Card title="Akun login">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap">
            <Input name="name" required maxLength={100} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required maxLength={191} />
          </Field>
          <Field label="Password awal" hint={PASSWORD_HINT}>
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">Karyawan</option>
              <option value="MANAGER">Atasan</option>
            </Select>
          </Field>
        </div>
      </Card>
      <Card title="Data kepegawaian">
        <EmployeeFields />
      </Card>
      <div className="flex justify-end gap-2">
        <ButtonLink href="/karyawan" variant="secondary">
          Batal
        </ButtonLink>
        <Button type="submit" loading={loading}>
          Simpan karyawan
        </Button>
      </div>
    </form>
  );
}
