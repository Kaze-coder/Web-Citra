"use client";

import { AuthProvider } from "@/components/auth-provider";
import { AppSidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RouteTransition } from "@/components/route-transition";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Topbar />
            <main id="main-content" className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9">
              <RouteTransition>{children}</RouteTransition>
            </main>
            <footer className="border-t px-5 py-4 text-[0.68rem] text-muted-foreground sm:px-10">
              <span>Citra NET Manager</span>
            </footer>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
