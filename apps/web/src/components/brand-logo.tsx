import Image from "next/image";
import companyLogo from "../../../../frontend/assets/logo.png";
import companyLogoDark from "../../../../frontend/assets/Logo_dark.png";
import { cn } from "@/lib/utils";

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center",
      compact ? "justify-center" : "gap-2.5",
      className,
    )}>
      <span className={cn("relative block shrink-0", compact ? "size-8" : "h-10 w-16")}>
        <Image src={companyLogo} alt={compact ? "Citra NET" : ""} fill sizes={compact ? "32px" : "64px"} className="object-contain dark:hidden" priority />
        <Image src={companyLogoDark} alt={compact ? "Citra NET" : ""} fill sizes={compact ? "32px" : "64px"} className="hidden object-contain dark:block" priority />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <strong className="block whitespace-nowrap text-base font-semibold tracking-[-0.03em]">Citra NET</strong>
        </span>
      )}
    </span>
  );
}
