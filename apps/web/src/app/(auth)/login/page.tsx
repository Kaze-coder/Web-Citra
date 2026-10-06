"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LoaderCircleIcon, LockKeyholeIcon } from "lucide-react";
import { apiFetch, ApiError, csrf, json } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

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
      await apiFetch("/api/v1/auth/login", { method: "POST", body: json({ username: data.get("username"), password: data.get("password") }) });
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1.05fr)_minmax(27rem,.68fr)]">
      <section className="relative hidden overflow-hidden border-r border-foreground/15 bg-[#173d2f] p-10 text-[#f2efe5] lg:flex lg:flex-col lg:justify-between xl:p-14">
        <Link href="/login" className="relative z-10 w-fit" aria-label="Citra NET"><BrandLogo className="text-white" /></Link>
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(242,239,229,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(242,239,229,.2)_1px,transparent_1px)] [background-size:4rem_4rem]" />
        <div className="relative z-10 max-w-2xl">
          <p className="font-mono text-[0.64rem] tracking-[0.2em] text-emerald-200 uppercase">Restricted operations access</p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] xl:text-7xl">Masuk untuk menjaga operasi tetap bergerak.</h1>
          <p className="mt-7 max-w-md leading-7 text-emerald-50/70">Akses khusus administrator dan operator aktif Citra NET.</p>
        </div>
        <div className="relative z-10 flex justify-between border-t border-white/20 pt-4 font-mono text-[0.58rem] tracking-[0.14em] text-emerald-50/60 uppercase"><span>Sanctum protected</span><span>Bogor / Indonesia</span></div>
      </section>

      <section className="flex min-h-dvh flex-col">
        <div className="flex h-16 items-center justify-end border-b border-foreground/15 px-5 sm:px-8">
          <ThemeToggle />
        </div>
        <div className="grid flex-1 place-items-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-sm">
            <div className="mb-10 flex items-end justify-between border-b border-foreground/15 pb-5"><span className="grid size-10 place-items-center rounded-sm bg-primary text-primary-foreground"><LockKeyholeIcon className="size-4.5" /></span><span className="font-mono text-[0.58rem] tracking-[0.14em] text-muted-foreground uppercase">Portal / 01</span></div>
            <p className="section-kicker">Internal access</p>
            <h2 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.04em]">Masuk ke pusat operasi</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Gunakan akun yang diberikan super administrator.</p>

            <form className="mt-9 grid gap-5" onSubmit={submit}>
              <Field label="Username" name="username" autoComplete="username" required autoFocus />
              <Field label="Password" name="password" type="password" autoComplete="current-password" required />
              {error && <p role="alert" className="border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="mt-2 h-11" disabled={loading}>
                {loading && <LoaderCircleIcon className="animate-spin" />} {loading ? "Memeriksa akun" : "Masuk"}
              </Button>
            </form>
            <p className="mt-8 border-t border-foreground/12 pt-5 text-xs leading-5 text-muted-foreground">Jika akun dinonaktifkan, hubungi super administrator. Tidak ada registrasi publik.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
