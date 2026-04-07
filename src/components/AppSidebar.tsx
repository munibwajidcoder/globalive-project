import { Building2, Shield, UserCog, Briefcase, Mic2, MessageSquare, Users, DollarSign, Wallet, LayoutDashboard, Settings, LogOut, MessageCircle, Award, Gem, Coins, Package, Flag, LifeBuoy } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: string;
}

const roleRoutes: Record<string, { title: string; url: string; icon: any }[]> = {
  company: [
    { title: "Dashboard", url: "/company", icon: LayoutDashboard },
    { title: "Users", url: "/company/users", icon: Users },
    { title: "Agencies", url: "/company/agencies", icon: Briefcase },
    { title: "Hosts", url: "/company/hosts", icon: Mic2 },
    { title: "Transactions", url: "/company/transactions", icon: DollarSign },
    { title: "Reports", url: "/company/reports", icon: Flag },
    { title: "Support", url: "/company/support", icon: LifeBuoy },
    { title: "Beans", url: "/company/beans", icon: Building2 },
    { title: "Policy", url: "/company/policy", icon: Building2 },
    { title: "Super Admins", url: "/company/super-admins", icon: Shield },
    { title: "Top-up Agents", url: "/company/topup-agents", icon: Users },
    { title: "Resellers", url: "/company/resellers", icon: Users },
    { title: "Analytics", url: "/company/analytics", icon: LayoutDashboard },
    { title: "Games", url: "/company/games", icon: Award },
    { title: "Settings", url: "/company/settings", icon: Settings },
  ],
  "super-admin": [
    { title: "Dashboard", url: "/super-admin", icon: LayoutDashboard },
    { title: "Sub Admins", url: "/super-admin/sub-admins", icon: UserCog },
    { title: "Users", url: "/super-admin/users", icon: Users },
    { title: "Agencies", url: "/super-admin/agencies", icon: Briefcase },
    { title: "Hosts", url: "/super-admin/hosts", icon: Mic2 },
    { title: "Diamonds", url: "/super-admin/diamonds", icon: Gem },
    { title: "Reports", url: "/super-admin/reports", icon: Flag },
    { title: "Support", url: "/super-admin/support", icon: LifeBuoy },
    { title: "Cash-out Requests", url: "/super-admin/cashout", icon: DollarSign },
  ],
  "sub-admin": [
    { title: "Dashboard", url: "/sub-admin", icon: LayoutDashboard },
    { title: "Users", url: "/sub-admin/users", icon: Users },
    { title: "Agencies", url: "/sub-admin/agencies", icon: Briefcase },
    { title: "Hosts", url: "/sub-admin/hosts", icon: Mic2 },
    { title: "Disputes", url: "/sub-admin/disputes", icon: MessageSquare },
    { title: "Reports", url: "/sub-admin/reports", icon: Flag },
    { title: "Support", url: "/sub-admin/support", icon: LifeBuoy },
  ],
  agency: [
    { title: "Dashboard", url: "/agency", icon: LayoutDashboard },
    { title: "Users", url: "/agency/users", icon: Users },
    { title: "Hosts", url: "/agency/hosts", icon: Mic2 },
    { title: "Performance", url: "/agency/performance", icon: LayoutDashboard },
    { title: "Approvals", url: "/agency/approvals", icon: UserCog },
    { title: "Cash-out", url: "/agency/cashout", icon: DollarSign },
    { title: "Profile", url: "/agency/profile", icon: Building2 },
    { title: "Support", url: "/agency/support", icon: LifeBuoy },
    { title: "Reports", url: "/agency/reports", icon: Flag },
  ],
  host: [
    { title: "Dashboard", url: "/host", icon: LayoutDashboard },
    { title: "Profile", url: "/host/profile", icon: Users },
    { title: "Earnings", url: "/host/earnings", icon: DollarSign },
    { title: "Gifts", url: "/host/gifts", icon: Wallet },
    { title: "Request Cash-out", url: "/host/cashout", icon: DollarSign },
    { title: "Analytics", url: "/host/analytics", icon: LayoutDashboard },
  ],
  user: [
    { title: "Dashboard", url: "/user", icon: LayoutDashboard },
    { title: "Top-up", url: "/user/topup", icon: Wallet },
    { title: "Send Gift", url: "/user/send-gift", icon: MessageCircle },
    { title: "Transactions", url: "/user/transactions", icon: DollarSign },
    { title: "Profile", url: "/user/profile", icon: Users },
    { title: "Verification", url: "/user/verification", icon: Award },
  ],
  reseller: [
    { title: "Dashboard", url: "/reseller", icon: LayoutDashboard },
    { title: "Bean Ledger", url: "/reseller/sales", icon: Coins },
    { title: "Statements", url: "/reseller/reports", icon: Package },
  ],
  "topup-agent": [
    { title: "Dashboard", url: "/topup-agent", icon: LayoutDashboard },
    { title: "Users", url: "/topup-agent/users", icon: Users },
    { title: "Reseller Network", url: "/topup-agent/resellers", icon: Users },
    { title: "Bean Transfers", url: "/topup-agent/transactions", icon: Coins },
    { title: "Statements", url: "/topup-agent/reports", icon: Package },
  ],
};

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const items = roleRoutes[role] || [];

  // Use exact match so only the exact route is highlighted (prevents parent items from also appearing active)
  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        className={() =>
                          `flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm ${active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium pl-3 border-l-4 border-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`
                        }
                      >
                        <item.icon className={`h-4 w-4 ${active ? "text-sidebar-primary-foreground" : ""}`} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    className="flex items-center gap-3 w-full text-destructive"
                    onClick={() => setLogoutOpen(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span>Logout</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex gap-2 justify-end">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        // Use auth context logout so navigation is client-side and works on SPA deployments
                        logout();
                        setLogoutOpen(false);
                      }}
                    >
                      Logout
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
