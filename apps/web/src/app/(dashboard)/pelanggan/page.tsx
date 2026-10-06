"use client";

import { ChangeEvent, FormEvent, type ReactNode, useEffect, useEffectEvent, useState } from "react";
import { DownloadIcon, ExternalLinkIcon, FileUpIcon, MailIcon, MapPinIcon, MoreHorizontalIcon, PencilIcon, PhoneIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { apiFetch, ApiError, cachedApiFetch, invalidateApiCache, json, type Pagination as PaginationType } from "@/lib/api";
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

function loadCustomerPage(page: number, search: string, signal: AbortSignal, onRevalidate: (response: Awaited<ReturnType<typeof apiFetch<Pelanggan[]>>>) => void) {
  return cachedApiFetch<Pelanggan[]>("/api/v1/pelanggan", {
    params: { page, limit: 12, search },
    signal,
  }, { onRevalidate });
}

function invalidateCustomerData() {
  invalidateApiCache("/api/v1/pelanggan", "/api/v1/maps/customers", "/api/v1/perangkat", "/api/v1/tagihan", "/api/v1/billing/schedules");
}

export default function PelangganPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const notifyLoadError = useEffectEvent(() => notify("Data pelanggan gagal dimuat.", "error"));
  const canWrite = user.role !== "operator";
  const [customers, setCustomers] = useState<Pelanggan[]>([]);
  const [pagination, setPagination] = useState<PaginationType>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editing, setEditing] = useState<Pelanggan | null | undefined>(undefined);
  const [detail, setDetail] = useState<Pelanggan>();
  const [deleting, setDeleting] = useState<Pelanggan>();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await cachedApiFetch<Pelanggan[]>("/api/v1/pelanggan", { params: { page, limit: 12, search: debouncedSearch } }, { force: true });
    setCustomers(response.data);
    setPagination(response.meta.pagination);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const apply = (response: Awaited<ReturnType<typeof loadCustomerPage>>) => {
      if (active) { setCustomers(response.data); setPagination(response.meta.pagination); }
    };
    loadCustomerPage(page, debouncedSearch, controller.signal, apply).then(apply).catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      notifyLoadError();
    });
    return () => { active = false; controller.abort(); };
  }, [page, debouncedSearch]);

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
      invalidateCustomerData();
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
      invalidateCustomerData();
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
      invalidateCustomerData();
      await load();
    } catch (cause) { notify(cause instanceof ApiError ? cause.message : "File gagal diimpor.", "error"); }
    event.target.value = "";
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader eyebrow="Customer registry" title="Pelanggan" description="Data layanan, kontak, paket, dan titik instalasi pelanggan." actions={canWrite && <>
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium hover:bg-muted"><FileUpIcon className="size-4" /> Impor<input type="file" accept=".csv,.xlsx,.ods" className="sr-only" onChange={(event) => void importFile(event)} /></label>
        <Button onClick={() => setEditing(null)}><PlusIcon /> Tambah pelanggan</Button>
      </>} />

      <div className="data-grid">
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative max-w-md flex-1"><SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-8" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, telepon, atau alamat" /></div>
          <span className="hidden text-xs text-muted-foreground sm:block">{pagination?.total ?? 0} pelanggan</span>
        </div>
        {customers.length ? <div className="overflow-x-auto"><Table>
          <TableHeader><TableRow><TableHead>Pelanggan</TableHead><TableHead>Paket</TableHead><TableHead>Biaya</TableHead><TableHead>Status</TableHead><TableHead>Mulai</TableHead><TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader>
          <TableBody>{customers.map((customer) => <TableRow key={customer.id}>
            <TableCell><button className="text-left" onClick={() => setDetail(customer)}><span className="block font-medium hover:underline">{customer.nama_pelanggan}</span><span className="text-xs text-muted-foreground">{customer.no_telepon}</span></button></TableCell>
            <TableCell>{customer.paket_layanan || "-"}</TableCell><TableCell className="tabular-nums">{customer.harga_bulanan ? rupiah.format(Number(customer.harga_bulanan)) : "-"}</TableCell><TableCell><StatusBadge value={customer.status} /></TableCell><TableCell>{formatDate(customer.tanggal_langganan)}</TableCell>
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

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(undefined)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {detail && <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 pr-7">
                <div>
                  <DialogTitle className="text-2xl tracking-[-0.03em]">{detail.nama_pelanggan}</DialogTitle>
                  <DialogDescription className="mt-1 font-mono text-[0.65rem] tracking-[0.1em] uppercase">Pelanggan #{detail.id}</DialogDescription>
                </div>
                <StatusBadge value={detail.status} />
              </div>
            </DialogHeader>

            <div className="divide-y divide-foreground/12">
              <section className="py-5" aria-labelledby="detail-kontak">
                <h3 id="detail-kontak" className="mb-4 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Kontak</h3>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <DetailItem label="Nomor telepon">
                    <a className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline" href={`tel:${detail.no_telepon}`}><PhoneIcon className="size-4 text-primary" />{detail.no_telepon}</a>
                  </DetailItem>
                  <DetailItem label="Email">
                    {detail.email ? <a className="inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline" href={`mailto:${detail.email}`}><MailIcon className="size-4 text-primary" />{detail.email}</a> : "-"}
                  </DetailItem>
                  <DetailItem label="Alamat" className="sm:col-span-2"><span className="leading-6">{detail.alamat || "-"}</span></DetailItem>
                </div>
              </section>

              <section className="py-5" aria-labelledby="detail-layanan">
                <h3 id="detail-layanan" className="mb-4 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Layanan</h3>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
                  <DetailItem label="Paket">{detail.paket_layanan || "-"}</DetailItem>
                  <DetailItem label="Biaya bulanan"><span className="tabular-nums">{detail.harga_bulanan ? rupiah.format(Number(detail.harga_bulanan)) : "-"}</span></DetailItem>
                  <DetailItem label="Mulai berlangganan">{formatDate(detail.tanggal_langganan)}</DetailItem>
                </div>
              </section>

              <section className="pt-5" aria-labelledby="detail-lokasi">
                <h3 id="detail-lokasi" className="mb-4 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Lokasi instalasi</h3>
                {detail.latitude && detail.longitude ? <div className="bg-muted/70 p-4 sm:p-5">
                  <p className="text-sm font-medium">{detail.keterangan_lokasi || detail.alamat}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">{detail.latitude}, {detail.longitude}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" render={<a href={`https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`} target="_blank" rel="noreferrer" />}><ExternalLinkIcon /> Google Maps</Button>
                    <Button size="sm" variant="outline" render={<a href={`https://earth.google.com/web/@${detail.latitude},${detail.longitude},150a,1200d,35y`} target="_blank" rel="noreferrer" />}><ExternalLinkIcon /> Google Earth</Button>
                    <Button size="sm" variant="outline" render={<a href={`/api/v1/maps/customers/${detail.id}.kml`} />}><DownloadIcon /> KML</Button>
                  </div>
                </div> : <p className="bg-muted/70 p-4 text-sm text-muted-foreground">Koordinat belum tersedia. Jalankan geocoding atau edit pelanggan.</p>}
              </section>
            </div>
          </>}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)} title="Hapus pelanggan?" description="Lokasi, perangkat, dan tagihan pelanggan ini ikut terhapus. Tindakan tidak dapat dibatalkan." onConfirm={() => void remove()} busy={busy} />
    </div>
  );
}

function DetailItem({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1.5 text-sm font-medium">{children}</div></div>;
}
