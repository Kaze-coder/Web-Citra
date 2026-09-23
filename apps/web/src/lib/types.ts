export type Role = "super_admin" | "admin" | "operator";

export type Admin = {
  id: number;
  username: string;
  email: string;
  nama_lengkap: string | null;
  status: "aktif" | "nonaktif";
  role: Role;
  tanggal_login_terakhir?: string | null;
};

export type Pelanggan = {
  id: number;
  nama_pelanggan: string;
  no_telepon: string;
  email: string | null;
  alamat: string;
  status: "aktif" | "nonaktif" | "suspend";
  paket_layanan: string | null;
  harga_bulanan: string | null;
  tanggal_langganan: string;
  latitude: string | null;
  longitude: string | null;
  keterangan_lokasi: string | null;
};

export type Perangkat = {
  id: number;
  pelanggan_id: number;
  nama_pelanggan?: string;
  nama_perangkat: string;
  tipe_perangkat: string;
  ip_address: string | null;
  mac_address: string | null;
  serial_number: string | null;
  status_perangkat: "aktif" | "mati" | "error";
  tanggal_instalasi: string | null;
};

export type Tagihan = {
  id: number;
  pelanggan_id: number;
  nama_pelanggan?: string;
  no_telepon?: string;
  bulan_tagihan: string;
  jumlah_tagihan: string;
  status_pembayaran: "belum_lunas" | "lunas" | "cicilan";
  tanggal_pembayaran: string | null;
  metode_pembayaran: string | null;
  catatan: string | null;
};

export type BillingSchedule = {
  id: number;
  nama_pelanggan: string;
  no_telepon: string;
  paket_layanan: string | null;
  harga_bulanan: string | null;
  tagihan_belum_lunas: number;
  next_billing_date: string;
  next_billing_formatted: string;
  days_until_billing: number;
  status: "overdue" | "soon" | "normal";
};

export type EarthLayer = { name: string; url: string; attribution: string };
