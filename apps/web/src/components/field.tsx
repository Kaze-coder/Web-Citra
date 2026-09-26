import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

export function Field({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="field-label">
      {label}
      <Input {...props} aria-invalid={Boolean(error)} />
      {error && <span className="text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
