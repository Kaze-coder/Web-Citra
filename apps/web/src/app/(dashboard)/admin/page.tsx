"use client";

import { FormEvent, useEffect, useState } from "react";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, ShieldAlertIcon, Trash2Icon } from "lucide-react";
import { apiFetch, ApiError, json, type Pagination as PaginationType } from "@/lib/api";
import type { Admin } from "@/lib/types";
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

export default function AdminPage() {
  const { user } = useAuth(); const { notify } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]); const [pagination, setPagination] = useState<PaginationType>(); const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Admin | null | undefined>(undefined); const [deleting, setDeleting] = useState<Admin>(); const [errors, setErrors] = useState<Record<string, string[]>>({}); const [busy, setBusy] = useState(false);

  async function load() { const response = await apiFetch<Admin[]>("/api/v1/admins", { params: { page, limit: 15 } }); setAdmins(response.data); setPagination(response.meta.pagination); }
  useEffect(() => {
    if (user.role !== "super_admin") return;
    let active = true;
    apiFetch<Admin[]>("/api/v1/admins", { params: { page, limit: 15 } }).then((response) => {
      if (active) { setAdmins(response.data); setPagination(response.meta.pagination); }
    });
    return () => { active = false; };
  }, [page, user.role]);

  if (user.role !== "super_admin") return <div className="grid min-h-[60dvh] place-items-center text-center"><div><ShieldAlertIcon className="mx-auto mb-4 size-10 text-destructive" /><h1 className="text-xl font-semibold">Akses dibatasi</h1><p className="mt-2 text-sm text-muted-foreground">Hanya super administrator yang dapat mengelola akun.</p></div></div>;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setErrors({}); const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (!payload.password) { delete payload.password; delete payload.password_confirmation; }
    try { await apiFetch(editing?.id ? `/api/v1/admins/${editing.id}` : "/api/v1/admins", { method: editing?.id ? "PATCH" : "POST", body: json(payload) }); notify(editing?.id ? "Administrator diperbarui." : "Administrator ditambahkan."); setEditing(undefined); await load(); }
    catch (cause) { if (cause instanceof ApiError) setErrors(cause.meta.errors ?? {}); notify(cause instanceof ApiError ? cause.message : "Administrator gagal disimpan.", "error"); }
    finally { setBusy(false); }
  }

  async function remove() { if (!deleting) return; setBusy(true); try { await apiFetch(`/api/v1/admins/${deleting.id}`, { method: "DELETE" }); notify("Administrator dihapus."); setDeleting(undefined); await load(); } catch (cause) { notify(cause instanceof ApiError ? cause.message : "Administrator gagal dihapus.", "error"); } finally { setBusy(false); } }

  return <div className="space-y-5"><PageHeader eyebrow="Access control" title="Administrator" description="Kelola akun, peran, dan status akses operasional." actions={<Button onClick={() => setEditing(null)}><PlusIcon /> Tambah admin</Button>} />
    <div className="data-grid">{admins.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Administrator</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Login terakhir</TableHead><TableHead className="w-12"><span className="sr-only">Aksi</span></TableHead></TableRow></TableHeader><TableBody>{admins.map((admin) => <TableRow key={admin.id}><TableCell><span className="font-medium">{admin.nama_lengkap || admin.username}</span><span className="block text-xs text-muted-foreground">{admin.email}</span></TableCell><TableCell className="capitalize">{admin.role.replace("_", " ")}</TableCell><TableCell><StatusBadge value={admin.status} /></TableCell><TableCell>{formatDate(admin.tanggal_login_terakhir)}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Aksi ${admin.username}`} />}><MoreHorizontalIcon /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setEditing(admin)}><PencilIcon /> Edit</DropdownMenuItem>{admin.id !== user.id && <DropdownMenuItem variant="destructive" onClick={() => setDeleting(admin)}><Trash2Icon /> Hapus</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="Belum ada administrator" />}<Pagination value={pagination} onChange={setPage} /></div>
    <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent className="sm:max-w-xl"><form onSubmit={save}><DialogHeader><DialogTitle>{editing?.id ? "Edit administrator" : "Tambah administrator"}</DialogTitle><DialogDescription>Password minimal delapan karakter. Kosongkan password saat edit jika tidak berubah.</DialogDescription></DialogHeader><div className="grid gap-4 py-5 sm:grid-cols-2"><Field label="Username" name="username" defaultValue={editing?.username} error={errors.username?.[0]} required /><Field label="Email" name="email" type="email" defaultValue={editing?.email} error={errors.email?.[0]} required /><Field label="Nama lengkap" name="nama_lengkap" defaultValue={editing?.nama_lengkap ?? ""} /><label className="field-label">Role<select name="role" defaultValue={editing?.role ?? "operator"} className="field-select"><option value="operator">Operator</option><option value="admin">Admin</option><option value="super_admin">Super admin</option></select></label><label className="field-label">Status<select name="status" defaultValue={editing?.status ?? "aktif"} className="field-select"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></label><span /><Field label={editing?.id ? "Password baru" : "Password"} name="password" type="password" error={errors.password?.[0]} required={!editing?.id} /><Field label="Konfirmasi password" name="password_confirmation" type="password" required={!editing?.id} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Batal</Button><Button type="submit" disabled={busy}>{busy ? "Menyimpan" : "Simpan"}</Button></DialogFooter></form></DialogContent></Dialog>
    <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(undefined)} title="Hapus administrator?" description="Akun ini tidak lagi dapat mengakses pusat operasi." onConfirm={() => void remove()} busy={busy} />
  </div>;
}
