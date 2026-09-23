import { DatabaseZapIcon } from "lucide-react";

export function EmptyState({ title = "Belum ada data", description = "Data akan tampil di sini setelah ditambahkan." }) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <DatabaseZapIcon className="mx-auto mb-3 size-8 text-muted-foreground/60" />
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
