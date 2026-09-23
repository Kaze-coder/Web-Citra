"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheckIcon, BellRingIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { apiFetch, ApiError, json, type Pagination as PaginationType } from "@/lib/api";
import type { Pelanggan, Tagihan } from "@/lib/types";
import { rupiah, formatDate } from "@/lib/format";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/providers";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Stats = { total: number; lunas: number; belum_lunas: number; cicilan: number; totalPemasukan: string };

export default function TagihanPage() {
  const { user } = useAuth(); const { notify } = useToast(); const canWrite = user.role !== "operator";
  const [invoices, setInvoices] = useState<Tagihan[]>([]); const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [stats, setStats] = useState<Stats>(); const [pagination, setPagination] = useState<PaginationType>();
  const [page, setPage] = useState(1); const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Tagihan | null | undefined>(undefined); const [deleting, setDeleting] = useState<Tagihan>();
  const [errors, setErrors] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);

  async function load() {
    const [list, summary] = await Promise.all([
      apiFetch<Tagihan[]>("/api/v1/tagihan", { params: { page, limit: 15, status } }),
      apiFetch<Stats>("/api/v1/tagihan/statistik"),
    ]);
    setInvoices(list.data); setPagination(list.meta.pagination); setStats(summary.data);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Tagihan[]>("/api/v1/tagihan", { params: { page, limit: 15, status } }),
      apiFetch<Stats>("/api/v1/tagihan/statistik"),
      apiFetch<Pelanggan[]>("/api/v1/pelanggan", { params: { limit: 100 } }),
    ]).then(([list, summary, customerResponse]) => {
      if (active) { setInvoices(list.data); setPagination(list.meta.pagination); setStats(summary.data); setCustomers(customerResponse.data); }
    });
    return () => { active = false; };
  }, [page, status]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setErrors({}); const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { await apiFetch(editing?.id ? `/api/v1/tagihan/${editing.id}` : "/api/v1/tagihan", { method: editing?.id ? "PATCH" : "POST", body: json(payload) }); notify(editing?.id ? "Tagihan diperbarui." : "Tagihan dibuat."); setEditing(undefined); await load(); }
    catch (cause) { if (cause instanceof ApiError) setErrors(cause.meta.errors ?? {}); notify(cause instanceof ApiError ? cause.message : "Tagihan gagal disimpan.", "error"); }
    finally { setBusy(false); }
  }

  async function markPaid(invoice: Tagihan) {
    try { await apiFetch(`/api/v1/tagihan/${invoice.id}`, { method: "PATCH", body: json({ status_pembayaran: "lunas", tanggal_pembayaran: new Date().toISOString().slice(0, 10), metode_pembayaran: "transfer" }) }); notify("Tagihan ditandai lunas."); await load(); }
    catch (cause) { notify(cause instanceof ApiError ? cause.message : "Status gagal diperbarui.", "error"); }
  }

  async function send(invoice: Tagihan, confirmation = false) {
    try { await apiFetch(`/api/v1/whatsapp/${confirmation ? "send-confirmation" : "send-reminder"}`, { method: "POST", body: json({ tagihan_id: invoice.id }) }); notify(confirmation ? "Konfirmasi masuk antrean." : "Reminder masuk antrean."); }
    catch (cause) { notify(cause instanceof ApiError ? cause.message : "Pesan gagal dimasukkan ke antrean.", "error"); }
  }

  async function remove() { if (!deleting) return; setBusy(true); try { await apiFetch(`/api/v1/tagihan/${deleting.id}`, { method: "DELETE" }); notify("Tagihan dihapus."); setDeleting(undefined); await load(); } catch (cause) { notify(cause instanceof ApiError ? cause.message : "Tagihan gagal dihapus.", "error"); } finally { setBusy(false); } }

  return <div className="space-y-5">
    <PageHeader eyebrow="Billing control" title="Tagihan" description="Kelola periode, pembayaran, dan komunikasi penagihan pelanggan." actions={canWrite && <Button onClick={() => setEditing(null)}><PlusIcon /> Buat tagihan</Button>} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total tagihan" value={String(stats?.total ?? 0)} /><Metric label="Lunas" value={String(stats?.lunas ?? 0)} positive /><Metric label="Belum lunas" value={String(stats?.belum_lunas ?? 0)} alert /><Metric label="Pemasukan" value={rupiah.format(Number(stats?.totalPemasukan ?? 0))} /></section>
    <div className="data-grid"><div className="flex items-center justify-between gap-3 border-b p-3"><label className="flex items-center gap-2 text-sm text-muted-foreground">Status<select className="field-select w-40 text-foreground" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Semua</option><option value="belum_lunas">Belum lunas</option><option value="lunas">Lunas</option><option value="cicilan">Cicilan</option></select></label><span className="text-xs text-muted-foreground">{pagination?.total ?? 0} tagihan</span></div>
    {invoices.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pelanggan</TableHead><TableHead>Periode</TableHead><TableHead>Jumlah</TableHead><TableHead>Status</TableHead><TableHead>Pembayaran</TableHead><TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader><TableBody>{invoices.map((invoice) => <TableRow key={invoice.id}><TableCell><span className="font-medium">{invoice.nama_pelanggan}</span><span className="block text-xs text-muted-foreground">{invoice.no_telepon}</span></TableCell><TableCell>{formatDate(invoice.bulan_tagihan)}</TableCell><TableCell className="font-mono font-medium">{rupiah.format(Number(invoice.jumlah_tagihan))}</TableCell><TableCell><StatusBadge value={invoice.status_pembayaran} /></TableCell><TableCell><span className="block">{formatDate(invoice.tanggal_pembayaran)}</span><span className="text-xs capitalize text-muted-foreground">{invoice.metode_pembayaran || ""}</span></TableCell><TableCell>{canWrite && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi tagihan ${invoice.nama_pelanggan}`} />}><MoreHorizontalIcon /></DropdownMenuTrigger><DropdownMenuContent align="end">{invoice.status_pembayaran !== "lunas" && <><DropdownMenuItem onClick={() => void markPaid(invoice)}><BadgeCheckIcon /> Tandai lunas</DropdownMenuItem><DropdownMenuItem onClick={() => void send(invoice)}><BellRingIcon /> Kirim reminder</DropdownMenuItem></>}{invoice.status_pembayaran === "lunas" && <DropdownMenuItem onClick={() => void send(invoice, true)}><BellRingIcon /> Kirim konfirmasi</DropdownMenuItem>}<DropdownMenuItem onClick={() => setEditing(invoice)}><PencilIcon /> Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleting(invoice)}><Trash2Icon /> Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="Tagihan tidak ditemukan" description="Ubah filter atau buat tagihan baru." />}<Pagination value={pagination} onChange={setPage} /></div>

    <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent className="sm:max-w-xl"><form onSubmit={save}><DialogHeader><DialogTitle>{editing?.id ? "Edit tagihan" : "Buat tagihan"}</DialogTitle><DialogDescription>Satu pelanggan hanya dapat memiliki satu tagihan untuk tanggal periode yang sama.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><label className="field-label sm:col-span-2">Pelanggan<select name="pelanggan_id" defaultValue={editing?.pelanggan_id ?? ""} className="field-select" required><option value="" disabled>Pilih pelanggan</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nama_pelanggan}</option>)}</select>{errors.pelanggan_id?.[0] && <span className="text-xs text-destructive">{errors.pelanggan_id[0]}</span>}</label><Field label="Periode tagihan" name="bulan_tagihan" type="date" defaultValue={editing?.bulan_tagihan?.slice(0, 10)} error={errors.bulan_tagihan?.[0]} required /><Field label="Jumlah tagihan" name="jumlah_tagihan" type="number" min="1" defaultValue={editing?.jumlah_tagihan} error={errors.jumlah_tagihan?.[0]} required /><label className="field-label">Status<select name="status_pembayaran" defaultValue={editing?.status_pembayaran ?? "belum_lunas"} className="field-select"><option value="belum_lunas">Belum lunas</option><option value="cicilan">Cicilan</option><option value="lunas">Lunas</option></select></label><Field label="Tanggal pembayaran" name="tanggal_pembayaran" type="date" defaultValue={editing?.tanggal_pembayaran?.slice(0, 10) ?? ""} /><Field label="Metode pembayaran" name="metode_pembayaran" defaultValue={editing?.metode_pembayaran ?? ""} /><label className="field-label sm:col-span-2">Catatan<textarea name="catatan" defaultValue={editing?.catatan ?? ""} className="field-textarea" /></label></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button type="submit" disabled={busy}>{busy ? "Menyimpan" : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)} title="Hapus tagihan?" description="Riwayat tagihan ini akan dihapus permanen." onConfirm={() => void remove()} busy={busy} />
  </div>;
}

function Metric({ label, value, positive = false, alert = false }: { label: string; value: string; positive?: boolean; alert?: boolean }) { return <div className="surface rounded-lg p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-3 truncate font-mono text-2xl font-semibold ${positive ? "text-emerald-700 dark:text-emerald-400" : alert ? "text-destructive" : ""}`}>{value}</p></div>; }
