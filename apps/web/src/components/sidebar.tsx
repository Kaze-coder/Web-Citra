"use client";

import Link from "next/link";
import { LogOutIcon, RadioTowerIcon } from "lucide-react";
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
      <SidebarHeader className="border-b p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <span className="grid size-8 place-items-center rounded-md bg-emerald-700 text-white shadow-sm shadow-emerald-950/15">
                <RadioTowerIcon className="size-4.5" />
              </span>
              <span className="grid leading-tight">
                <span className="font-semibold tracking-[-0.02em]">Citra NET</span>
                <span className="font-mono text-[0.65rem] text-muted-foreground">OPS MANAGER</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-3">
        <SidebarMenu className="gap-1 px-2">
          {visibleItems.map((item) => <NavItem key={item.href} item={item} />)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2" render={<div />}>
              <span className="grid size-8 place-items-center rounded-md bg-sidebar-accent text-xs font-semibold">
                {initials(user.nama_lengkap || user.username)}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{user.nama_lengkap || user.username}</span>
                <span className="truncate text-xs capitalize text-muted-foreground">{user.role.replace("_", " ")}</span>
              </span>
              <Button variant="ghost" size="icon-sm" aria-label="Keluar" onClick={() => void logout()}>
                <LogOutIcon />
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
