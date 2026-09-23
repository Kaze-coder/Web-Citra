"use client";

import { AuthProvider } from "@/components/auth-provider";
import { AppSidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Topbar />
            <main id="main-content" className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-5 lg:p-7">
              {children}
            </main>
            <footer className="border-t px-5 py-4 text-xs text-muted-foreground">
              Citra NET Manager · Operasional jaringan internal
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
