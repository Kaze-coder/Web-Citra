"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination as PaginationType } from "@/lib/api";

export function Pagination({ value, onChange }: { value?: PaginationType; onChange: (page: number) => void }) {
  if (!value || value.pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
      <span>{value.total} data · halaman {value.page} dari {value.pages}</span>
      <div className="flex gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Halaman sebelumnya" disabled={value.page <= 1} onClick={() => onChange(value.page - 1)}><ChevronLeftIcon /></Button>
        <Button variant="outline" size="icon-sm" aria-label="Halaman berikutnya" disabled={value.page >= value.pages} onClick={() => onChange(value.page + 1)}><ChevronRightIcon /></Button>
      </div>
    </div>
  );
}
