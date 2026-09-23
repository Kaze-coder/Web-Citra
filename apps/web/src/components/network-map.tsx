"use client";

import L from "leaflet";
import { LayersControl, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { EarthLayer, Pelanggan } from "@/lib/types";
import { rupiah } from "@/lib/format";

const marker = L.divIcon({
  className: "",
  html: '<span style="display:block;width:14px;height:14px;border:3px solid white;border-radius:50%;background:#138a5b;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>',
  iconSize: [14, 14], iconAnchor: [7, 7],
});

export default function NetworkMap({ customers, layers }: { customers: Pelanggan[]; layers: EarthLayer[] }) {
  const points = customers.filter((item) => item.latitude && item.longitude);
  const bounds = points.length ? L.latLngBounds(points.map((item) => [Number(item.latitude), Number(item.longitude)])) : undefined;

  return <MapContainer center={[-6.4, 106.8]} zoom={11} bounds={bounds} boundsOptions={{ padding: [36, 36] }} className="h-full min-h-[34rem] w-full" scrollWheelZoom>
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="OpenStreetMap"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="ESRI Satelit"><TileLayer attribution="&copy; Esri, Maxar, Earthstar Geographics" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
      {layers.map((layer) => <LayersControl.Overlay key={layer.name} name={`GEE · ${layer.name}`}><TileLayer attribution={layer.attribution} url={layer.url} /></LayersControl.Overlay>)}
    </LayersControl>
    {points.map((customer) => <Marker key={customer.id} position={[Number(customer.latitude), Number(customer.longitude)]} icon={marker}><Popup><strong>{customer.nama_pelanggan}</strong><br />{customer.alamat}<br />{customer.harga_bulanan ? rupiah.format(Number(customer.harga_bulanan)) : ""}</Popup></Marker>)}
  </MapContainer>;
}
