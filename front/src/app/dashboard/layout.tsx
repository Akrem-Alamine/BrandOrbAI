"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import data from "./data.json";
import { ButtomBar } from "@/components/dashboard/ButtomBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
      className="bg-surface-muted dark:bg-surface min-h-screen"
    >
      <AppSidebar variant="inset" className="bg-surface-muted dark:bg-surface" />
      <SidebarInset className="bg-surface dark:bg-surface">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
        {/* <ButtomBar /> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
