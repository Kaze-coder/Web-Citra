import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string }) {
  const positive = ["aktif", "lunas", "normal", "sent"].includes(value);
  const danger = ["error", "overdue", "nonaktif"].includes(value);

  return (
    <span className={cn(
      "inline-flex items-center gap-2 text-xs font-semibold capitalize",
      positive && "text-emerald-700 dark:text-emerald-400",
      danger && "text-destructive",
      !positive && !danger && "text-amber-700 dark:text-amber-400",
    )}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {value.replaceAll("_", " ")}
    </span>
  );
}
