"use client";

import { useEffect, useState } from "react";
import { ActivityIcon, CircleDollarSignIcon, ClockAlertIcon, UsersIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch } from "@/lib/api";
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
      apiFetch<CustomerStats>("/api/v1/pelanggan/statistik"),
      apiFetch<BillingStats>("/api/v1/tagihan/statistik"),
      apiFetch<Tagihan[]>("/api/v1/tagihan", { params: { limit: 6 } }),
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
    <div className="space-y-5">
      <PageHeader eyebrow="Live overview" title="Pusat operasi" description="Kondisi pelanggan dan arus tagihan dalam satu tampilan." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={UsersIcon} label="Pelanggan aktif" value={customer ? String(customer.aktif) : "—"} note={`${customer?.total ?? 0} pelanggan terdaftar`} />
        <Metric icon={CircleDollarSignIcon} label="Pemasukan tercatat" value={billing ? rupiah.format(Number(billing.totalPemasukan)) : "—"} note={`${billing?.lunas ?? 0} tagihan lunas`} />
        <Metric icon={ClockAlertIcon} label="Belum dibayar" value={billing ? String(billing.belum_lunas) : "—"} note="Perlu tindak lanjut" />
        <Metric icon={ActivityIcon} label="Service API" value="Online" note="Laravel + queue ready" active />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(24rem,.85fr)]">
        <div className="surface rounded-lg p-4 sm:p-5">
          <div className="mb-5"><h2 className="font-semibold">Distribusi tagihan</h2><p className="text-sm text-muted-foreground">Status pembayaran seluruh periode.</p></div>
          <div className="h-64" aria-label="Grafik distribusi status tagihan">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -20, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="jumlah" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-grid">
          <div className="border-b px-4 py-4 sm:px-5"><h2 className="font-semibold">Tagihan terbaru</h2><p className="text-sm text-muted-foreground">Enam perubahan periode terakhir.</p></div>
          {recent.length ? <div className="divide-y">{recent.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{invoice.nama_pelanggan}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatDate(invoice.bulan_tagihan)}</p></div>
              <div className="text-right"><p className="font-mono text-sm font-medium">{rupiah.format(Number(invoice.jumlah_tagihan))}</p><div className="mt-1"><StatusBadge value={invoice.status_pembayaran} /></div></div>
            </div>
          ))}</div> : <EmptyState title="Belum ada tagihan" />}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, active = false }: { icon: typeof UsersIcon; label: string; value: string; note: string; active?: boolean }) {
  return <article className="surface rounded-lg p-4"><div className="flex items-start justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><Icon className={`size-4 ${active ? "text-emerald-600" : "text-muted-foreground"}`} /></div><p className="mt-5 truncate font-mono text-2xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-1.5 text-xs text-muted-foreground">{note}</p></article>;
}
