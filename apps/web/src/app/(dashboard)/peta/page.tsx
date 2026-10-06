"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { DownloadIcon, Layers3Icon, MapPinIcon } from "lucide-react";
import { cachedApiFetch } from "@/lib/api";
import type { EarthLayer, Pelanggan } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

const NetworkMap = dynamic(() => import("@/components/network-map"), { ssr: false, loading: () => <div className="grid min-h-[34rem] place-items-center bg-muted text-sm text-muted-foreground">Memuat kanvas peta</div> });

export default function PetaPage() {
  const [customers, setCustomers] = useState<Pelanggan[]>([]); const [layers, setLayers] = useState<EarthLayer[]>([]); const [geeOnline, setGeeOnline] = useState(false);
  useEffect(() => {
    cachedApiFetch<Pelanggan[]>("/api/v1/maps/customers", {}, { onRevalidate: (response) => setCustomers(response.data) }).then((response) => setCustomers(response.data));
    cachedApiFetch<EarthLayer[]>("/api/v1/earth-engine/tiles", {}, { onRevalidate: (response) => { setLayers(response.data); setGeeOnline(true); } }).then((response) => { setLayers(response.data); setGeeOnline(true); }).catch(() => setGeeOnline(false));
  }, []);

  return <div className="space-y-6 lg:space-y-8"><PageHeader eyebrow="Geospatial workspace" title="Peta jaringan" description="Titik pelanggan, layer satelit, dan ekspor Google Earth." actions={<Button variant="outline" render={<a href="/api/v1/maps/customers.kml" />}><DownloadIcon /> Unduh semua KML</Button>} />
    <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]"><aside className="surface max-h-[38rem] overflow-hidden rounded-lg"><div className="border-b p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Titik pelanggan</h2><span className="text-xs text-muted-foreground tabular-nums">{customers.length}</span></div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Layers3Icon className="size-3.5" /> Earth Engine {geeOnline ? `${layers.length} layer aktif` : "fallback OSM"}</p></div><div className="max-h-[32rem] overflow-y-auto divide-y">{customers.map((customer) => <a key={customer.id} href={`https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`} target="_blank" rel="noreferrer" className="flex gap-3 p-3.5 transition-colors hover:bg-muted"><MapPinIcon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{customer.nama_pelanggan}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{customer.alamat}</span></span></a>)}</div></aside><div className="overflow-hidden rounded-lg ring-1 ring-foreground/8"><NetworkMap customers={customers} layers={layers} /></div></div>
  </div>;
}
