"use client";

import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="grid min-h-[60dvh] place-items-center p-6 text-center"><div><TriangleAlertIcon className="mx-auto mb-4 size-9 text-destructive" /><h1 className="text-xl font-semibold">Data tidak dapat dimuat</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Periksa koneksi API lalu coba kembali. Perubahan yang belum dikirim tetap berada di form.</p><Button className="mt-6" variant="outline" onClick={reset}><RotateCcwIcon /> Coba lagi</Button></div></div>;
}
