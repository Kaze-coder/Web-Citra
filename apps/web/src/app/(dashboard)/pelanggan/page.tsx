"use client";

import { ChangeEvent, FormEvent, useDeferredValue, useEffect, useState } from "react";
import { DownloadIcon, ExternalLinkIcon, FileUpIcon, MapPinIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { apiFetch, ApiError, json, type Pagination as PaginationType } from "@/lib/api";
import type { Pelanggan } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PelangganPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const canWrite = user.role !== "operator";
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [pagination, setPagination] = useState<PaginationType>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [editing, setEditing] = useState<Pelanggan | null | undefined>(undefined);
  const [detail, setDetail] = useState<Pelanggan>();
  const [deleting, setDeleting] = useState<Pelanggan>();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await apiFetch<Pelanggan[]>("/api/v1/pelanggan", { params: { page, limit: 12, search: deferredSearch } });
    setCustomers(response.data);
    setPagination(response.meta.pagination);
  }

  useEffect(() => {
    let active = true;
    apiFetch<Pelanggan[]>("/api/v1/pelanggan", { params: { page, limit: 12, search: deferredSearch } }).then((response) => {
      if (active) { setCustomers(response.data); setPagination(response.meta.pagination); }
    });
    return () => { active = false; };
  }, [page, deferredSearch]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const target = editing?.id ? `/api/v1/pelanggan/${editing.id}` : "/api/v1/pelanggan";
    try {
      await apiFetch(target, { method: editing?.id ? "PATCH" : "POST", body: json(payload) });
      notify(editing?.id ? "Data pelanggan diperbarui." : "Pelanggan baru ditambahkan.");
      setEditing(undefined);
      await load();
    } catch (cause) {
      if (cause instanceof ApiError) setErrors(cause.meta.errors ?? {});
      notify(cause instanceof ApiError ? cause.message : "Data pelanggan gagal disimpan.", "error");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/pelanggan/${deleting.id}`, { method: "DELETE" });
      notify("Pelanggan dan data terkait dihapus.");
      setDeleting(undefined);
      await load();
    } catch (cause) { notify(cause instanceof ApiError ? cause.message : "Pelanggan gagal dihapus.", "error"); }
    finally { setBusy(false); }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await apiFetch<{ imported: number; skipped: number }>("/api/v1/pelanggan/import", { method: "POST", body: form });
      notify(`${response.data.imported} pelanggan diimpor, ${response.data.skipped} dilewati.`);
      await load();
    } catch (cause) { notify(cause instanceof ApiError ? cause.message : "File gagal diimpor.", "error"); }
    event.target.value = "";
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Customer registry" title="Pelanggan" description="Data layanan, kontak, paket, dan titik instalasi pelanggan." actions={canWrite && <>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium hover:bg-muted"><FileUpIcon className="size-4" /> Impor<input type="file" accept=".csv,.xlsx,.ods" className="sr-only" onChange={(event) => void importFile(event)} /></label>
        <Button onClick={() => setEditing(null)}><PlusIcon /> Tambah pelanggan</Button>
      </>} />

      <div className="data-grid">
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative max-w-md flex-1"><SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari nama, telepon, atau alamat" /></div>
          <span className="hidden text-xs text-muted-foreground sm:block">{pagination?.total ?? 0} pelanggan</span>
        </div>
        {customers.length ? <div className="overflow-x-auto"><Table>
          <TableHeader><TableRow><TableHead>Pelanggan</TableHead><TableHead>Paket</TableHead><TableHead>Biaya</TableHead><TableHead>Status</TableHead><TableHead>Mulai</TableHead><TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
          <TableBody>{customers.map((customer) => <TableRow key={customer.id}>
            <TableCell><button className="text-left" onClick={() => setDetail(customer)}><span className="block font-medium hover:underline">{customer.nama_pelanggan}</span><span className="text-xs text-muted-foreground">{customer.no_telepon}</span></button></TableCell>
            <TableCell>{customer.paket_layanan || "-"}</TableCell><TableCell className="font-mono">{customer.harga_bulanan ? rupiah.format(Number(customer.harga_bulanan)) : "-"}</TableCell><TableCell><StatusBadge value={customer.status} /></TableCell><TableCell>{formatDate(customer.tanggal_langganan)}</TableCell>
            <TableCell><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi ${customer.nama_pelanggan}`} />}><MoreHorizontalIcon /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDetail(customer)}><MapPinIcon /> Detail lokasi</DropdownMenuItem>{canWrite && <><DropdownMenuItem onClick={() => setEditing(customer)}><PencilIcon /> Edit</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleting(customer)}><Trash2Icon /> Hapus</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></TableCell>
          </TableRow>)}</TableBody>
        </Table></div> : <EmptyState title="Pelanggan tidak ditemukan" description="Ubah pencarian atau tambahkan pelanggan pertama." />}
        <Pagination value={pagination} onChange={setPage} />
      </div>

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent className="sm:max-w-2xl"><form onSubmit={save}><DialogHeader><DialogTitle>{editing?.id ? "Edit pelanggan" : "Tambah pelanggan"}</DialogTitle><DialogDescription>Kolom nama, nomor telepon, dan alamat wajib diisi.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2">
        <Field label="Nama pelanggan" name="nama_pelanggan" defaultValue={editing?.nama_pelanggan} error={errors.nama_pelanggan?.[0]} required />
        <Field label="Nomor telepon" name="no_telepon" defaultValue={editing?.no_telepon} error={errors.no_telepon?.[0]} required />
        <Field label="Email" name="email" type="email" defaultValue={editing?.email ?? ""} error={errors.email?.[0]} />
        <Field label="Paket layanan" name="paket_layanan" defaultValue={editing?.paket_layanan ?? ""} />
        <Field label="Harga bulanan" name="harga_bulanan" type="number" min="0" defaultValue={editing?.harga_bulanan ?? ""} />
        <Field label="Tanggal langganan" name="tanggal_langganan" type="date" defaultValue={editing?.tanggal_langganan?.slice(0, 10)} />
        <label className="field-label">Status<select name="status" defaultValue={editing?.status ?? "aktif"} className="field-select"><option value="aktif">Aktif</option><option value="suspend">Suspend</option><option value="nonaktif">Nonaktif</option></select></label>
        <div className="sm:col-span-2"><label className="field-label">Alamat<textarea name="alamat" defaultValue={editing?.alamat} className="field-textarea" required /></label>{errors.alamat?.[0] && <p className="mt-1 text-xs text-destructive">{errors.alamat[0]}</p>}</div>
        <Field label="Latitude" name="latitude" type="number" step="any" defaultValue={editing?.latitude ?? ""} />
        <Field label="Longitude" name="longitude" type="number" step="any" defaultValue={editing?.longitude ?? ""} />
      </div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button type="submit" disabled={busy}>{busy ? "Menyimpan" : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(undefined)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{detail?.nama_pelanggan}</DialogTitle><DialogDescription>{detail?.alamat}</DialogDescription></DialogHeader>{detail && <div className="grid gap-4 py-3"><div className="grid grid-cols-2 gap-3"><Info label="Paket" value={detail.paket_layanan || "-"} /><Info label="Biaya" value={detail.harga_bulanan ? rupiah.format(Number(detail.harga_bulanan)) : "-"} /></div>{detail.latitude && detail.longitude ? <div className="rounded-lg bg-muted p-4"><p className="font-mono text-xs">{detail.latitude}, {detail.longitude}</p><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" render={<a href={`https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`} target="_blank" rel="noreferrer" />}><ExternalLinkIcon /> Google Maps</Button><Button size="sm" variant="outline" render={<a href={`https://earth.google.com/web/@${detail.latitude},${detail.longitude},150a,1200d,35y`} target="_blank" rel="noreferrer" />}><ExternalLinkIcon /> Google Earth</Button><Button size="sm" variant="outline" render={<a href={`/api/v1/maps/customers/${detail.id}.kml`} />}><DownloadIcon /> KML</Button></div></div> : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Koordinat belum tersedia. Jalankan geocoding atau edit pelanggan.</p>}</div>}</DialogContent></Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)} title="Hapus pelanggan?" description="Lokasi, perangkat, dan tagihan pelanggan ini ikut terhapus. Tindakan tidak dapat dibatalkan." onConfirm={() => void remove()} busy={busy} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
