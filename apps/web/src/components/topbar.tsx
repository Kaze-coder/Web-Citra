"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const titles: Record<string, string> = {
  "/dashboard": "Pusat operasi",
  "/pelanggan": "Data pelanggan",
  "/perangkat": "Inventaris perangkat",
  "/tagihan": "Pengelolaan tagihan",
  "/jadwal-pengiriman": "Jadwal pengiriman",
  "/peta": "Peta jaringan",
  "/admin": "Administrator",
};

export function Topbar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-foreground/12 bg-background/92 px-3 backdrop-blur-md sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="h-5 w-px bg-border" />
        <p className="text-xs font-semibold tracking-[0.08em] uppercase">{titles[pathname] ?? "Citra NET Manager"}</p>
      </div>
      <ThemeToggle />
    </header>
  );
}
