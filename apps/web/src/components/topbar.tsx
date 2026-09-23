"use client";

import { usePathname } from "next/navigation";
import { MoonStarIcon, SunIcon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { toggleTheme } from "@/components/providers";

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

  function changeTheme() {
    toggleTheme();
  }

  return (
    <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b bg-background/88 px-3 backdrop-blur-md sm:px-5">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="h-5 w-px bg-border" />
        <p className="text-sm font-medium">{titles[pathname] ?? "Citra NET Manager"}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 font-mono text-[0.68rem] text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px] shadow-emerald-500/12" /> API ONLINE
        </span>
        <Button variant="ghost" size="icon" onClick={changeTheme} aria-label="Ganti tema warna">
          <MoonStarIcon className="dark:hidden" />
          <SunIcon className="hidden dark:block" />
        </Button>
      </div>
    </header>
  );
}
