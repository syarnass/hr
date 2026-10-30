"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  Alert,
  Button,
  Card,
  DescriptionList,
  Field,
  Input,
  PageHeader,
} from "@/components/ui";
import { api, hardNavigate, logout } from "@/lib/api";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import { PASSWORD_HINT } from "@/lib/password";

export function Profile() {
  const { user, employee } = useAuth();

  return (
    <>
      <PageHeader
        title="Profil"
        description="Informasi akun dan kepegawaian Anda."
      />
      <div className="space-y-6">
        <Card title="Akun">
          <DescriptionList
            items={[
              { label: "Nama", value: user.name },
              { label: "Email", value: user.email },
              { label: "Role", value: ROLE_LABEL[user.role] },
              { label: "Terdaftar sejak", value: formatDate(user.createdAt) },
            ]}
          />
        </Card>
        {employee && (
          <Card title="Kepegawaian">
            <DescriptionList
              items={[
                { label: "No. karyawan", value: employee.employeeNumber },
                { label: "Jabatan", value: employee.position },
                { label: "Departemen", value: employee.department },
                {
                  label: "Tanggal bergabung",
                  value: formatDate(employee.joinDate),
                },
                {
                  label: "Atasan langsung",
                  value: employee.manager
                    ? `${employee.manager.user.name} (${employee.manager.position})`
                    : "-",
                },
              ]}
            />
          </Card>
        )}
        <ChangePassword />
      </div>
    </>
  );
}

function ChangePassword() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== form.get("confirmPassword")) {
      setError("Konfirmasi password tidak sama");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: {
          currentPassword: String(form.get("currentPassword")),
          newPassword,
        },
      });
      // Backend mencabut semua sesi setelah password diganti.
      await logout();
      hardNavigate("/login?reason=password-changed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengganti password");
      setLoading(false);
    }
  }

  return (
    <Card title="Ganti password">
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Password saat ini">
          <Input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>
        <Field label="Password baru" hint={PASSWORD_HINT}>
          <Input
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Ulangi password baru">
          <Input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <p className="text-xs text-muted">
          Setelah password diganti, Anda akan diminta masuk kembali di semua
          perangkat.
        </p>
        <Button type="submit" loading={loading}>
          Ganti password
        </Button>
      </form>
    </Card>
  );
}
