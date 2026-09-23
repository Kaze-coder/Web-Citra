import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string }) {
  const positive = ["aktif", "lunas", "normal", "sent"].includes(value);
  const danger = ["error", "overdue", "nonaktif"].includes(value);

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize",
      positive && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      danger && "bg-destructive/10 text-destructive",
      !positive && !danger && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    )}>
      <span className="size-1.5 rounded-full bg-current" />
      {value.replaceAll("_", " ")}
    </span>
  );
}
