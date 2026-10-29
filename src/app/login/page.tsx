import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand text-base font-bold text-white">
            HR
          </span>
          <h1 className="mt-4 text-xl font-semibold text-ink">
            Masuk ke HR Portal
          </h1>
          <p className="mt-1 text-sm text-muted">
            Gunakan email dan password akun kantor Anda.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
