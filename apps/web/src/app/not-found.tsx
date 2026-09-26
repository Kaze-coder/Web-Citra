import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
  return <main id="main-content" className="grid min-h-dvh place-items-center bg-background p-6 text-center"><div><BrandLogo className="mx-auto mb-7 justify-center" /><p className="font-mono text-xs tracking-[.2em] text-muted-foreground">404 · ROUTE NOT FOUND</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Halaman tidak ditemukan</h1><p className="mt-2 text-sm text-muted-foreground">Alamat mungkin berubah atau Anda tidak memiliki tautan yang tepat.</p><Link href="/dashboard" className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"><ArrowLeftIcon className="size-4" /> Kembali ke pusat operasi</Link></div></main>;
}
