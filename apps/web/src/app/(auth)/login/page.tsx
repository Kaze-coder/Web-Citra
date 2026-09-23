"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeftIcon, LoaderCircleIcon, LockKeyholeIcon, RadioTowerIcon } from "lucide-react";
import { apiFetch, ApiError, csrf, json } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const data = new FormData(event.currentTarget);

    try {
      await csrf();
      await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: json({ username: data.get("username"), password: data.get("password") }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="grid min-h-dvh bg-[#07110f] text-[#eef7f2] lg:grid-cols-[minmax(0,1fr)_minmax(28rem,.72fr)]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold"><span className="grid size-8 place-items-center rounded-md bg-emerald-400 text-[#07110f]"><RadioTowerIcon className="size-4" /></span>Citra NET</Link>
        <div className="relative z-10 max-w-xl">
          <p className="font-mono text-xs tracking-[0.2em] text-emerald-400 uppercase">Internal access</p>
          <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.05em]">Operasional jaringan dimulai dari data yang tepercaya.</h1>
          <p className="mt-6 max-w-md leading-7 text-slate-400">Akses dibatasi untuk administrator dan operator aktif Citra NET.</p>
        </div>
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(52,211,153,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(52,211,153,.2)_1px,transparent_1px)] [background-size:42px_42px]" />
        <p className="relative z-10 font-mono text-[0.68rem] text-slate-500">SESSION PROTECTED BY LARAVEL SANCTUM</p>
      </section>

      <section className="grid place-items-center bg-background p-5 text-foreground sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"><ArrowLeftIcon className="size-4" /> Kembali</Link>
          <div className="mb-8 flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-white"><LockKeyholeIcon className="size-5" /></div>
          <h2 className="text-3xl font-semibold tracking-[-.04em]">Masuk ke pusat operasi</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun yang diberikan super administrator.</p>

          <form className="mt-8 grid gap-5" onSubmit={submit}>
            <Field label="Username" name="username" autoComplete="username" required autoFocus />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            {error && <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="mt-1 h-10 bg-emerald-700 text-white hover:bg-emerald-800" disabled={loading}>
              {loading && <LoaderCircleIcon className="animate-spin" />} {loading ? "Memeriksa akun" : "Masuk"}
            </Button>
          </form>
          <p className="mt-8 text-xs leading-5 text-muted-foreground">Jika akun Anda dinonaktifkan, hubungi super administrator. Tidak ada registrasi publik.</p>
        </div>
      </section>
    </main>
  );
}
