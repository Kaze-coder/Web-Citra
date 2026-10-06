"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightIcon, CircleDollarSignIcon, ClockAlertIcon, UsersIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cachedApiFetch } from "@/lib/api";
import type { Tagihan } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

type CustomerStats = { total: number; aktif: number; tagihanBelum: number; totalPemasukan: string };
type BillingStats = { total: number; lunas: number; belum_lunas: number; cicilan: number; totalPemasukan: string };

export default function DashboardPage() {
  const [customer, setCustomer] = useState<CustomerStats>();
  const [billing, setBilling] = useState<BillingStats>();
  const [recent, setRecent] = useState<Tagihan[]>([]);

  useEffect(() => {
    Promise.all([
      cachedApiFetch<CustomerStats>("/api/v1/pelanggan/statistik", {}, { onRevalidate: (response) => setCustomer(response.data) }),
      cachedApiFetch<BillingStats>("/api/v1/tagihan/statistik", {}, { onRevalidate: (response) => setBilling(response.data) }),
      cachedApiFetch<Tagihan[]>("/api/v1/tagihan", { params: { limit: 6 } }, { onRevalidate: (response) => setRecent(response.data) }),
    ]).then(([customers, bills, invoices]) => {
      setCustomer(customers.data);
      setBilling(bills.data);
      setRecent(invoices.data);
    });
  }, []);

  const chart = billing ? [
    { name: "Lunas", jumlah: billing.lunas },
    { name: "Belum", jumlah: billing.belum_lunas },
    { name: "Cicilan", jumlah: billing.cicilan },
  ] : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader eyebrow="Live overview" title="Pusat operasi" description="Kondisi pelanggan dan arus tagihan dalam satu tampilan." />
      <section className="grid overflow-hidden rounded-md border border-foreground/15 bg-card lg:grid-cols-[1.18fr_.82fr]">
        <div className="relative min-h-64 border-b border-foreground/15 p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between"><p className="section-kicker">Customer portfolio</p><UsersIcon className="size-5 text-primary" /></div>
          <div className="mt-14 flex items-end justify-between gap-6">
            <div><p className="text-6xl font-semibold tracking-[-0.04em] sm:text-7xl">{customer ? customer.aktif : "—"}</p><p className="mt-3 text-sm text-muted-foreground">Pelanggan aktif dari {customer?.total ?? 0} pelanggan terdaftar</p></div>
            <span className="hidden size-24 place-items-center border border-primary/20 bg-primary/6 sm:grid"><ArrowUpRightIcon className="size-7 text-primary" /></span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-1">
          <Metric icon={CircleDollarSignIcon} label="Pemasukan tercatat" value={billing ? rupiah.format(Number(billing.totalPemasukan)) : "—"} note={`${billing?.lunas ?? 0} tagihan lunas`} />
          <Metric icon={ClockAlertIcon} label="Belum dibayar" value={billing ? String(billing.belum_lunas) : "—"} note="Perlu tindak lanjut" alert />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,.85fr)]">
        <div className="surface rounded-md p-5 sm:p-7">
          <div className="mb-7 flex items-start justify-between"><div><p className="section-kicker mb-2">Billing composition</p><h2 className="text-xl font-semibold tracking-[-0.03em]">Distribusi tagihan</h2><p className="mt-1 text-sm text-muted-foreground">Status pembayaran seluruh periode.</p></div><span className="font-mono text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">Live dataset</span></div>
          <div className="h-64" aria-label="Grafik distribusi status tagihan">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -20, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--accent)", fillOpacity: 0.18 }}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 2, boxShadow: "0 12px 32px color-mix(in oklch, var(--foreground) 12%, transparent)", padding: "10px 12px" }}
                  labelStyle={{ color: "var(--muted-foreground)", fontFamily: "var(--font-ibm-plex-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}
                  itemStyle={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600 }}
                  formatter={(value) => [`${value} tagihan`, "Jumlah"]}
                />
                <Bar dataKey="jumlah" fill="var(--chart-1)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-grid">
          <div className="border-b px-4 py-5 sm:px-5"><p className="section-kicker mb-2">Recent activity</p><h2 className="text-xl font-semibold tracking-[-0.03em]">Tagihan terbaru</h2><p className="mt-1 text-sm text-muted-foreground">Enam perubahan periode terakhir.</p></div>
          {recent.length ? <div className="divide-y">{recent.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{invoice.nama_pelanggan}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatDate(invoice.bulan_tagihan)}</p></div>
              <div className="text-right"><p className="text-sm font-medium tabular-nums">{rupiah.format(Number(invoice.jumlah_tagihan))}</p><div className="mt-1"><StatusBadge value={invoice.status_pembayaran} /></div></div>
            </div>
          ))}</div> : <EmptyState title="Belum ada tagihan" />}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, alert = false }: { icon: typeof UsersIcon; label: string; value: string; note: string; alert?: boolean }) {
  return <article className="border-b border-foreground/15 p-5 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-r-0 lg:last:border-b-0"><div className="flex items-start justify-between"><p className="font-mono text-[0.62rem] font-medium tracking-[0.1em] text-muted-foreground uppercase">{label}</p><Icon className={`size-4 ${alert ? "text-amber-700 dark:text-amber-400" : "text-primary"}`} /></div><p className={`mt-7 truncate text-2xl font-semibold tracking-[-.03em] tabular-nums ${alert ? "text-amber-800 dark:text-amber-300" : ""}`}>{value}</p><p className="mt-2 text-xs text-muted-foreground">{note}</p></article>;
}
