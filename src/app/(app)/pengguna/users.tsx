"use client";

import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { RequireRole, useAuth } from "@/components/auth-provider";
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PASSWORD_HINT } from "@/lib/password";
import type { Role, User } from "@/lib/types";

export function Users() {
  const [creating, setCreating] = useState(false);
  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Akun login dan hak akses. Untuk karyawan baru, gunakan menu Karyawan."
        action={
          <Button variant="secondary" onClick={() => setCreating(true)}>
            Tambah akun
          </Button>
        }
      />
      <RequireRole roles={["ADMIN"]}>
        <UserTable
          creating={creating}
          onCloseCreate={() => setCreating(false)}
        />
      </RequireRole>
    </>
  );
}

function UserTable({
  creating,
  onCloseCreate,
}: {
  creating: boolean;
  onCloseCreate: () => void;
}) {
  const { user: me } = useAuth();
  const { data, error, mutate } = useSWR<User[]>("/users");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  async function update(
    user: User,
    body: Partial<Pick<User, "role" | "isActive">>,
  ) {
    setBusyId(user.id);
    setActionError(null);
    try {
      const updated = await api<User>(`/users/${user.id}`, {
        method: "PATCH",
        body,
      });
      await mutate(
        (list) => list?.map((u) => (u.id === updated.id ? updated : u)),
        { revalidate: false },
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card title={data ? `${data.length} akun` : "Akun"}>
      {actionError && (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      )}
      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : !data ? (
        <Loading />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nama</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th className="text-right">Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => {
              const self = u.id === me.id;
              const busy = busyId === u.id;
              return (
                <tr key={u.id}>
                  <Td>
                    <div className="font-medium">
                      {u.name} {self && <Badge>Anda</Badge>}
                    </div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </Td>
                  <Td>
                    <Select
                      aria-label={`Role ${u.name}`}
                      value={u.role}
                      disabled={self || busy}
                      onChange={(e) =>
                        update(u, { role: e.target.value as Role })
                      }
                      className="w-auto py-1.5"
                    >
                      <option value="EMPLOYEE">Karyawan</option>
                      <option value="MANAGER">Atasan</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </Td>
                  <Td>
                    {u.isActive ? (
                      <Badge tone="success">Aktif</Badge>
                    ) : (
                      <Badge>Nonaktif</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatDate(u.createdAt)}
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    {!self && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => update(u, { isActive: !u.isActive })}
                        >
                          {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-danger"
                          disabled={busy}
                          onClick={() => setDeleting(u)}
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <CreateUserDialog
        open={creating}
        onClose={onCloseCreate}
        onCreated={() => mutate()}
      />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => mutate()}
      />
    </Card>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setLoading(true);
    try {
      await api<User>("/users", {
        method: "POST",
        body: {
          name: String(form.get("name")).trim(),
          email: String(form.get("email")).trim(),
          password: String(form.get("password")),
          role: String(form.get("role")),
        },
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Tambah akun" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Nama lengkap">
          <Input name="name" required maxLength={100} />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required maxLength={191} />
        </Field>
        <Field label="Password" hint={PASSWORD_HINT}>
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Role">
          <Select name="role" defaultValue="ADMIN">
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Atasan</option>
            <option value="EMPLOYEE">Karyawan</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={loading}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: User | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={user !== null} title="Hapus akun?" onClose={onClose}>
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Akun <span className="font-medium text-ink">{user.name}</span>{" "}
            beserta data kepegawaian dan riwayat cutinya akan dihapus permanen.
            Untuk sekadar mencabut akses, gunakan <em>Nonaktifkan</em>.
          </p>
          {error && <Alert>{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button variant="danger" loading={loading} onClick={confirm}>
              Hapus permanen
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
