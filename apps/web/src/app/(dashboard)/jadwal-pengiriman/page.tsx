"use client";

import { useEffect, useState } from "react";
import { CalendarClockIcon, PlayIcon, SendIcon } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import type { BillingSchedule } from "@/lib/types";
import { rupiah } from "@/lib/format";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/providers";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function JadwalPage() {
  const { user } = useAuth(); const { notify } = useToast(); const canRun = user.role !== "operator";
  const [schedules, setSchedules] = useState<BillingSchedule[]>([]); const [running, setRunning] = useState(false);

  async function load() { setSchedules((await apiFetch<BillingSchedule[]>("/api/v1/billing/schedules")).data); }
  useEffect(() => {
    let active = true;
    apiFetch<BillingSchedule[]>("/api/v1/billing/schedules").then((response) => { if (active) setSchedules(response.data); });
    return () => { active = false; };
  }, []);

  async function runBilling() {
    setRunning(true);
    try { const response = await apiFetch<{ created: number; queued: number }>("/api/v1/billing/run", { method: "POST", body: "{}" }); notify(`${response.data.created} tagihan dibuat, ${response.data.queued} notifikasi masuk antrean.`); await load(); }
    catch (cause) { notify(cause instanceof ApiError ? cause.message : "Billing gagal dijalankan.", "error"); }
    finally { setRunning(false); }
  }

  async function remindH3() {
    try { const response = await apiFetch<{ queued: number }>("/api/v1/whatsapp/send-reminder-h3", { method: "POST", body: "{}" }); notify(`${response.data.queued} reminder H-3 masuk antrean.`); }
    catch (cause) { notify(cause instanceof ApiError ? cause.message : "Reminder gagal diproses.", "error"); }
  }

  const soon = schedules.filter((item) => item.days_until_billing <= 3).length;
  const outstanding = schedules.reduce((total, item) => total + item.tagihan_belum_lunas, 0);

  return <div className="space-y-5">
    <PageHeader eyebrow="Automated billing" title="Jadwal pengiriman" description="Tanggal penagihan berikutnya, tunggakan, dan antrean reminder WhatsApp." actions={canRun && <><Button variant="outline" onClick={() => void remindH3()}><SendIcon /> Proses H-3</Button><Button onClick={() => void runBilling()} disabled={running}><PlayIcon /> {running ? "Menjalankan" : "Jalankan billing"}</Button></>} />
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Pelanggan terjadwal" value={schedules.length} /><Metric label="Jatuh tempo ≤ 3 hari" value={soon} alert={soon > 0} /><Metric label="Total tunggakan" value={outstanding} alert={outstanding > 0} /></section>
    <div className="data-grid"><div className="border-b px-4 py-3 font-mono text-[0.68rem] tracking-wider text-muted-foreground uppercase">Timeline penagihan · scheduler 00:00 / reminder 08:00</div>{schedules.length ? <div className="divide-y">{schedules.map((schedule) => <article key={schedule.id} className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
      <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-md bg-muted"><CalendarClockIcon className="size-4 text-muted-foreground" /></span><div><p className="font-medium">{schedule.nama_pelanggan}</p><p className="text-xs text-muted-foreground">{schedule.paket_layanan || "Paket belum diatur"} · {schedule.no_telepon}</p></div></div>
      <div><p className="text-xs text-muted-foreground">Tagihan berikutnya</p><p className="mt-1 text-sm font-medium">{schedule.next_billing_formatted}</p></div>
      <div className="sm:text-right"><p className="font-mono text-sm font-medium">{rupiah.format(Number(schedule.harga_bulanan || 0))}</p><p className="text-xs text-muted-foreground">{schedule.tagihan_belum_lunas} belum lunas</p></div>
      <StatusBadge value={schedule.status} />
    </article>)}</div> : <EmptyState title="Belum ada jadwal" description="Pelanggan aktif dengan tanggal langganan akan tampil di sini." />}</div>
  </div>;
}

function Metric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <div className="surface rounded-lg p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-2 font-mono text-2xl font-semibold ${alert ? "text-destructive" : ""}`}>{value}</p></div>; }
