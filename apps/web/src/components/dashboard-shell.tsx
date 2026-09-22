"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoAdminSidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <DemoAdminSidebar />
        <SidebarInset>
          <Topbar />
          <main className="flex-1 p-4 sm:p-5">{children}</main>
          <footer className="border-t p-4 sm:p-5">
            <Footer />
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
