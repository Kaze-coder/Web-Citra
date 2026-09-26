"use client";

import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { menuItems } from "@/components/items";
import { NavItem } from "@/components/nav-item";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";
import { initials } from "@/lib/format";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const visibleItems = menuItems.filter((item) => !item.roles || item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-14 rounded-none px-1 transition-none hover:bg-transparent hover:text-inherit active:bg-transparent data-open:hover:bg-transparent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!" render={<Link href="/dashboard" aria-label="Citra NET - Pusat operasi" />}>
              <BrandLogo className="group-data-[collapsible=icon]:hidden" />
              <BrandLogo compact className="hidden group-data-[collapsible=icon]:block" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-5">
        <SidebarMenu className="gap-0.5 px-2">
          {visibleItems.map((item) => <NavItem key={item.href} item={item} />)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!" render={<div />}>
              <span className="grid size-8 place-items-center rounded-sm bg-sidebar-accent text-xs font-semibold group-data-[collapsible=icon]:hidden">
                {initials(user.nama_lengkap || user.username)}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{user.nama_lengkap || user.username}</span>
                <span className="truncate text-xs capitalize text-muted-foreground">{user.role.replace("_", " ")}</span>
              </span>
              <Button variant="ghost" size="icon-sm" className="group-data-[collapsible=icon]:size-8" aria-label="Keluar" onClick={() => void logout()}>
                <LogOutIcon />
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
