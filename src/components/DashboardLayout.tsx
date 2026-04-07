import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar role={role} />
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-6 sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <h1 className="text-xl font-bold">Globilive Admin Panel</h1>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
