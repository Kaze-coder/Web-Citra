import { DatabaseZapIcon } from "lucide-react";

export function EmptyState({ title = "Belum ada data", description = "Data akan tampil di sini setelah ditambahkan." }) {
  return (
    <div className="grid min-h-56 place-items-center bg-[linear-gradient(var(--border)_1px,transparent_1px)] bg-[size:100%_3.5rem] p-8 text-center">
      <div className="bg-card px-6 py-4">
        <DatabaseZapIcon className="mx-auto mb-4 size-7 text-primary/70" />
        <h3 className="font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
