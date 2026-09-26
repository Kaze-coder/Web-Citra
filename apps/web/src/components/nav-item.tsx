"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { MenuItem } from "@/components/items";

export function NavItem({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        tooltip={item.label}
        className="relative h-10 rounded-sm px-3 text-[0.82rem] font-medium before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:scale-y-50 before:bg-primary before:opacity-0 before:transition-[transform,opacity] before:duration-200 hover:bg-sidebar-accent/35! [&_svg]:text-sidebar-foreground/70 data-active:bg-primary/7! data-active:font-semibold data-active:text-sidebar-foreground data-active:before:scale-y-100 data-active:before:opacity-100 data-active:[&_svg]:text-primary dark:[&_svg]:text-sidebar-foreground/85 dark:data-active:bg-primary/10!"
        render={<Link href={item.href} aria-current={active ? "page" : undefined} />}
      >
        <item.icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
