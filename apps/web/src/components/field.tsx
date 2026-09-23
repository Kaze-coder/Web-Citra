import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export function Field({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input {...props} aria-invalid={Boolean(error)} />
      {error && <span className="text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
