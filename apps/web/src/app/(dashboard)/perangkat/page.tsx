"use client";

import { FormEvent, useEffect, useState } from "react";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, RouterIcon, Trash2Icon } from "lucide-react";
import { apiFetch, ApiError, cachedApiFetch, invalidateApiCache, json, type Pagination as PaginationType } from "@/lib/api";
import type { Pelanggan, Perangkat } from "@/lib/types";
import { formatDate } from "@/lib/format";
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

export default function PerangkatPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const canWrite = user.role !== "operator";
  const [devices, setDevices] = useState<Perangkat[]>([]);
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [pagination, setPagination] = useState<PaginationType>();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Perangkat | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Perangkat>();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await cachedApiFetch<Perangkat[]>("/api/v1/perangkat", { params: { page, limit: 15 } }, { force: true });
    setDevices(response.data); setPagination(response.meta.pagination);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      cachedApiFetch<Perangkat[]>("/api/v1/perangkat", { params: { page, limit: 15 } }, { onRevalidate: (response) => { if (active) { setDevices(response.data); setPagination(response.meta.pagination); } } }),
      cachedApiFetch<Pelanggan[]>("/api/v1/pelanggan", { params: { limit: 100 } }, { onRevalidate: (response) => { if (active) setCustomers(response.data); } }),
    ]).then(([deviceResponse, customerResponse]) => {
      if (active) { setDevices(deviceResponse.data); setPagination(deviceResponse.meta.pagination); setCustomers(customerResponse.data); }
    });
    return () => { active = false; };
  }, [page]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setErrors({});
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await apiFetch(editing?.id ? `/api/v1/perangkat/${editing.id}` : "/api/v1/perangkat", { method: editing?.id ? "PATCH" : "POST", body: json(payload) });
      notify(editing?.id ? "Perangkat diperbarui." : "Perangkat ditambahkan."); setEditing(undefined); invalidateApiCache("/api/v1/perangkat"); await load();
    } catch (cause) { if (cause instanceof ApiError) setErrors(cause.meta.errors ?? {}); notify(cause instanceof ApiError ? cause.message : "Perangkat gagal disimpan.", "error"); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!deleting) return; setBusy(true);
    try { await apiFetch(`/api/v1/perangkat/${deleting.id}`, { method: "DELETE" }); notify("Perangkat dihapus."); setDeleting(undefined); invalidateApiCache("/api/v1/perangkat"); await load(); }
    catch (cause) { notify(cause instanceof ApiError ? cause.message : "Perangkat gagal dihapus.", "error"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6 lg:space-y-8">
    <PageHeader eyebrow="Network inventory" title="Perangkat" description="Router, modem, MikroTik, alamat jaringan, dan kondisi perangkat pelanggan." actions={canWrite && <Button onClick={() => setEditing(null)}><PlusIcon /> Tambah perangkat</Button>} />
    <div className="grid overflow-hidden rounded-md border border-foreground/15 bg-card sm:grid-cols-3"><Summary label="Total terdaftar" value={pagination?.total ?? 0} /><Summary label="Aktif di halaman ini" value={devices.filter((item) => item.status_perangkat === "aktif").length} /><Summary label="Perlu diperiksa" value={devices.filter((item) => item.status_perangkat === "error").length} alert /></div>
    <div className="data-grid">{devices.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Perangkat</TableHead><TableHead>Pelanggan</TableHead><TableHead>Alamat jaringan</TableHead><TableHead>Serial / MAC</TableHead><TableHead>Status</TableHead><TableHead>Instalasi</TableHead><TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader><TableBody>{devices.map((device) => <TableRow key={device.id}>
      <TableCell><span className="flex items-center gap-2 font-medium"><RouterIcon className="size-4 text-muted-foreground" />{device.nama_perangkat}</span><span className="ml-6 text-xs capitalize text-muted-foreground">{device.tipe_perangkat}</span></TableCell><TableCell>{device.nama_pelanggan || "-"}</TableCell><TableCell className="font-mono text-xs">{device.ip_address || "-"}</TableCell><TableCell><span className="block font-mono text-xs">{device.serial_number || "-"}</span><span className="font-mono text-xs text-muted-foreground">{device.mac_address || ""}</span></TableCell><TableCell><StatusBadge value={device.status_perangkat} /></TableCell><TableCell>{formatDate(device.tanggal_instalasi)}</TableCell>
      <TableCell>{canWrite && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi ${device.nama_perangkat}`} />}><MoreHorizontalIcon /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditing(device)}><PencilIcon /> Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleting(device)}><Trash2Icon /> Hapus</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</TableCell>
    </TableRow>)}</TableBody></Table></div> : <EmptyState title="Belum ada perangkat" description="Tambahkan perangkat yang dipasang pada pelanggan." />}<Pagination value={pagination} onChange={setPage} /></div>

    <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent className="sm:max-w-2xl"><form onSubmit={save}><DialogHeader><DialogTitle>{editing?.id ? "Edit perangkat" : "Tambah perangkat"}</DialogTitle><DialogDescription>Hubungkan perangkat ke pelanggan yang menggunakan layanan.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2">
      <label className="field-label sm:col-span-2">Pelanggan<select name="pelanggan_id" defaultValue={editing?.pelanggan_id ?? ""} className="field-select" required><option value="" disabled>Pilih pelanggan</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.nama_pelanggan} · {customer.no_telepon}</option>)}</select>{errors.pelanggan_id?.[0] && <span className="text-xs text-destructive">{errors.pelanggan_id[0]}</span>}</label>
      <Field label="Nama perangkat" name="nama_perangkat" defaultValue={editing?.nama_perangkat} error={errors.nama_perangkat?.[0]} required />
      <label className="field-label">Tipe<select name="tipe_perangkat" defaultValue={editing?.tipe_perangkat ?? "router"} className="field-select"><option value="router">Router</option><option value="modem">Modem</option><option value="mikrotik">MikroTik</option><option value="other">Lainnya</option></select></label>
      <Field label="IP address" name="ip_address" defaultValue={editing?.ip_address ?? ""} error={errors.ip_address?.[0]} />
      <Field label="MAC address" name="mac_address" defaultValue={editing?.mac_address ?? ""} />
      <Field label="Serial number" name="serial_number" defaultValue={editing?.serial_number ?? ""} />
      <Field label="Tanggal instalasi" name="tanggal_instalasi" type="date" defaultValue={editing?.tanggal_instalasi?.slice(0, 10) ?? ""} />
      <label className="field-label">Status<select name="status_perangkat" defaultValue={editing?.status_perangkat ?? "aktif"} className="field-select"><option value="aktif">Aktif</option><option value="mati">Mati</option><option value="error">Error</option></select></label>
    </div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button type="submit" disabled={busy}>{busy ? "Menyimpan" : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)} title="Hapus perangkat?" description="Data inventaris perangkat ini akan dihapus permanen." onConfirm={() => void remove()} busy={busy} />
  </div>;
}

function Summary({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <div className="border-b border-foreground/15 p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"><p className="font-mono text-[0.62rem] tracking-[0.1em] text-muted-foreground uppercase">{label}</p><p className={`mt-5 text-3xl font-semibold tracking-[-0.03em] tabular-nums ${alert && value ? "text-destructive" : ""}`}>{value}</p></div>; }
