import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query as fbQuery, where, getDocs, getDoc, doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { TopAgencies } from "@/components/TopAgencies";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader, Table, TableBody } from "@/components/ui/table";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Briefcase,
  DollarSign,
  ShieldAlert,
  TrendingUp,
  UserCog,
  Users,
  User,
  Database,
  Banknote,
  Percent
} from "lucide-react";

type AdminDashboardRole = "super-admin" | "sub-admin";

type MetricDefinition = {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "primary";
};

const headingCopy: Record<AdminDashboardRole, { title: string; description: string }> = {
  "super-admin": {
    title: "Super Admin Dashboard",
    description: "Manage sub-admins and oversee global operations",
  },
  "sub-admin": {
    title: "Sub Admin Dashboard",
    description: "Oversee agencies and hosts assigned to your supervision",
  },
};

const metricsByRole: Record<AdminDashboardRole, MetricDefinition[]> = {
  "super-admin": [
    { title: "Sub Admins", value: "-", change: undefined, icon: UserCog, variant: "primary" },
    { title: "Agencies", value: "-", change: undefined, icon: Briefcase, variant: "default" },
    { title: "Pending Cash-outs", value: "$45,230", icon: DollarSign, variant: "warning" },
    { title: "Monthly Growth", value: "23.5%", change: "+5.2%", icon: TrendingUp, variant: "success" },
  ],
  "sub-admin": [
    { title: "Managed Agencies", value: "-", change: undefined, icon: Briefcase, variant: "primary" },
    { title: "Total Hosts", value: "-", change: undefined, icon: Users, variant: "default" },
    { title: "Pending Reports", value: "12", icon: ShieldAlert, variant: "warning" },
    { title: "Performance Rate", value: "248.9%", change: undefined, icon: TrendingUp, variant: "success" },
  ],
};

const mockSubAdmins = [
  { id: "SA1", name: "Alex Thompson", email: "alex@globilive.com", contact: "+1234567890", region: "North Region", share: "15%", beans: 120000, hosts: 45, status: "Active" },
  { id: "SA2", name: "Maria Garcia", email: "maria@globilive.com", contact: "+0987654321", region: "South Region", share: "12%", beans: 95000, hosts: 32, status: "Active" }
];

const mockAgencies = [
  { id: "A1", name: "Golden Stars", hosts: 24, subAdmins: "Alex T.", share: "20%", beans: 450000, diamonds: 12000, status: "Active" },
  { id: "A2", name: "Elite Performers", hosts: 18, subAdmins: "Maria G.", share: "22%", beans: 380000, diamonds: 8500, status: "Active" }
];

const mockResellers = [
  { id: "R1", name: "Global Networks", share: "10%", totalBeans: 850000, diamonds: 25000, purchaseRequests: 12, status: "Active" },
  { id: "R2", name: "Quick Topups", share: "8%", totalBeans: 420000, diamonds: 10000, purchaseRequests: 5, status: "Active" }
];

const cashoutQueue = [
  { id: "W1", host: "Sarah Johnson", diamonds: 12450, requested: 10000, amountRs: "₨ 45,000", status: "Pending" },
  { id: "W2", host: "Mike Chen", diamonds: 8920, requested: 5000, amountRs: "₨ 22,500", status: "Pending" },
  { id: "W3", host: "Emma Davis", diamonds: 15680, requested: 15000, amountRs: "₨ 67,500", status: "Approved" },
];

const agencyFollowUps = [
  { name: "Silver Stars Agency", hosts: 24, note: "Verification documents expiring", urgency: "High" },
  { name: "Dream Team", hosts: 18, note: "Onboarding 3 new hosts", urgency: "Medium" },
  { name: "Rising Stars", hosts: 15, note: "Pending payout reconciliation", urgency: "High" },
];

const hostAlerts = [
  { name: "Sarah Johnson", agency: "Silver Stars", issue: "Spike in reports", status: "Investigate" },
  { name: "Mike Chen", agency: "Dream Team", issue: "Inactive 48h", status: "Check-in" },
  { name: "Emma Davis", agency: "Rising Stars", issue: "Beans transfer pending", status: "Review" },
];

export function AdminDashboardHome({ role = "super-admin" }: { role?: AdminDashboardRole }) {
  const heading = headingCopy[role];
  const { user, logout } = useAuth();
  const [userAgencyCount, setUserAgencyCount] = useState<number | null>(null);
  const [subAdminCount, setSubAdminCount] = useState<number | null>(null);
  const [managedAgencyCount, setManagedAgencyCount] = useState<number | null>(null);
  const [managedHostCount, setManagedHostCount] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      if (!user?.username) return;
      if (role === "super-admin") {
        try {
          const colRef = collection(db, "globiliveAgencies");
          const q = fbQuery(colRef, where("creator.creatorEmail", "==", user.username));
          const snap = await getDocs(q);
          if (!mounted) return;
          setUserAgencyCount(snap.size);
          try {
            const subCol = collection(db, "globiliveSubAdmins");
            const qSub = fbQuery(subCol, where("creator.creatorEmail", "==", user.username));
            const subSnap = await getDocs(qSub);
            if (!mounted) return;
            setSubAdminCount(subSnap.size);
          } catch (err) {
            console.error("failed to load sub-admin count", err);
            if (mounted) setSubAdminCount(null);
          }
        } catch (e) {
          console.error("failed to load user agencies count", e);
          if (mounted) setUserAgencyCount(null);
        }
      }

      if (role === "sub-admin") {
        try {
          const subCol = collection(db, "globiliveSubAdmins");
          const qSub = fbQuery(subCol, where("email", "==", user.username));
          const subSnap = await getDocs(qSub);
          if (!mounted) return;
          if (!subSnap.empty) {
            const data: any = subSnap.docs[0].data();
            const ids: string[] = Array.isArray(data.assignedAgenciesIds) ? data.assignedAgenciesIds : [];
            setManagedAgencyCount(ids.length);
            // compute total hosts across assigned agencies
            try {
              let total = 0;
              if (ids.length > 0) {
                const agencyDocs = await Promise.all(ids.map((aid) => getDoc(doc(db, "globiliveAgencies", aid))));
                if (!mounted) return;
                agencyDocs.forEach((aDoc) => {
                  if (aDoc?.exists()) {
                    const aData: any = aDoc.data();
                    const hostIds: string[] = Array.isArray(aData.agencyHosts) ? aData.agencyHosts : [];
                    total += hostIds.length;
                  }
                });
              }
              setManagedHostCount(total);
            } catch (err) {
              console.error("failed to compute managed host count", err);
              if (mounted) setManagedHostCount(null);
            }
          } else {
            setManagedAgencyCount(0);
            setManagedHostCount(0);
          }
        } catch (e) {
          console.error("failed to load managed agencies for sub-admin", e);
          if (mounted) setManagedAgencyCount(null);
        }
      }
    };
    loadCount();
    return () => { mounted = false; };
  }, [role, user]);

  useEffect(() => {
    let mounted = true;
    const loadName = async () => {
      if (!user?.username) return;
      try {
        if (role === "super-admin") {
          const colRef = collection(db, "globiliveSuperAdmins");
          const q = fbQuery(colRef, where("email", "==", user.username));
          const snap = await getDocs(q);
          if (!mounted) return;
          if (!snap.empty) {
            const data: any = snap.docs[0].data();
            setDisplayName(data.name || data.fullName || user.username);
            setDisplayEmail(data.email || user.username);
            return;
          }
        }
        if (role === "sub-admin") {
          const colRef = collection(db, "globiliveSubAdmins");
          const q = fbQuery(colRef, where("email", "==", user.username));
          const snap = await getDocs(q);
          if (!mounted) return;
          if (!snap.empty) {
            const data: any = snap.docs[0].data();
            setDisplayName(data.name || data.fullName || user.username);
            setDisplayEmail(data.email || user.username);
            return;
          }
        }
        setDisplayName(null);
        setDisplayEmail(null);
      } catch (e) {
        console.error("failed to load display name", e);
        if (mounted) {
          setDisplayName(null);
          setDisplayEmail(null);
        }
      }
    };
    loadName();
    return () => { mounted = false; };
  }, [role, user]);

  const metrics = metricsByRole[role].map((m) => {
    if (role === "super-admin" && m.title === "Agencies") {
      return { ...m, value: userAgencyCount != null ? String(userAgencyCount) : m.value };
    }
    if (role === "super-admin" && m.title === "Sub Admins") {
      return { ...m, value: subAdminCount != null ? String(subAdminCount) : m.value };
    }
    if (role === "sub-admin" && m.title === "Managed Agencies") {
      return { ...m, value: managedAgencyCount != null ? String(managedAgencyCount) : m.value };
    }
    if (role === "sub-admin" && m.title === "Total Hosts") {
      return { ...m, value: managedHostCount != null ? String(managedHostCount) : m.value };
    }
    return m;
  });

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{heading.title}</h2>
            <p className="text-muted-foreground mt-1">{heading.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {role === "super-admin" && (
              <div className="hidden sm:flex gap-2 mr-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
                  onClick={() => {
                    navigator.clipboard.writeText("https://globilive.app/public/agency-apply");
                    toast({ title: "Agency Application Link Copied", description: "Share this link with prospective agencies." });
                  }}
                >
                  <LinkIcon className="h-3 w-3" />
                  Invite Agency
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-purple-500/20 text-purple-600 hover:bg-purple-500/10"
                  onClick={() => {
                    navigator.clipboard.writeText("https://globilive.app/public/subadmin-apply");
                    toast({ title: "Sub-Admin Application Link Copied", description: "Share this link with prospective sub-admins." });
                  }}
                >
                  <LinkIcon className="h-3 w-3" />
                  Invite Sub-Admin
                </Button>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:text-primary transition-colors">
                  <User className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4 flex flex-col items-center gap-3 bg-card border-border/60 shadow-xl">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-base font-bold text-foreground">{displayName || user?.username || "Admin"}</div>
                  <div className="text-xs text-muted-foreground font-medium">{displayEmail || user?.username}</div>
                </div>
                <div className="w-full border-t border-border/50 my-1" />
                <div className="w-full">
                  <Button variant="destructive" className="w-full h-9 gap-2" onClick={() => logout()}>
                    <Users className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
          {role === "super-admin" && (
              <MetricCard 
                title="Your Agency Share" 
                value="15.5%" 
                change="Platform avg: 12%" 
                icon={Percent} 
                variant="primary" 
              />
          )}
        </div>

        <div className="mt-8">
            <Tabs defaultValue="withdrawals" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-[800px] mb-6">
                    <TabsTrigger value="withdrawals">Withdrawals Record</TabsTrigger>
                    <TabsTrigger value="agencies">Agencies</TabsTrigger>
                    {role === "super-admin" && <TabsTrigger value="subadmins">Sub Admins</TabsTrigger>}
                    {role === "super-admin" && <TabsTrigger value="resellers">Resellers List</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="withdrawals" className="space-y-4">
                    <Card className="border-none shadow-premium bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-xl">Cash-out Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6 sm:pt-0">
                            <EnhancedTable
                                data={cashoutQueue}
                                pageSize={5}
                                searchKeys={["host", "status"]}
                                columns={
                                    <TableHeader>
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Host Name</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Total Diamonds</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Request Qty (D)</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount (Rs)</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                }
                                renderRow={(w: any) => (
                                    <TableRow key={w.id} className="border-border/40">
                                        <TableCell className="font-medium pl-4">{w.host}</TableCell>
                                        <TableCell className="font-bold text-cyan-500">{w.diamonds.toLocaleString()}</TableCell>
                                        <TableCell className="text-center font-bold text-destructive">{w.requested.toLocaleString()}</TableCell>
                                        <TableCell className="font-bold">{w.amountRs}</TableCell>
                                        <TableCell>
                                            <Badge variant={w.status === "Approved" ? "default" : "secondary"}>{w.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Button size="sm" variant="secondary" onClick={() => navigate(`/${role}/cashout`)}>Review</Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="agencies" className="space-y-4">
                    <Card className="border-none shadow-premium bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-xl">Agencies Network</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6 sm:pt-0">
                            <EnhancedTable
                                data={mockAgencies}
                                pageSize={5}
                                searchKeys={["name"]}
                                columns={
                                    <TableHeader>
                                        <TableRow className="border-border/40 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Agency</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Hosts</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Sub Admin Sup.</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Share</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Beans/Diamonds</TableHead>
                                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Manage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                }
                                renderRow={(a: any) => (
                                    <TableRow key={a.id} className="border-border/40">
                                        <TableCell className="font-medium pl-4">{a.name}</TableCell>
                                        <TableCell className="text-center font-bold">{a.hosts}</TableCell>
                                        <TableCell>{a.subAdmins}</TableCell>
                                        <TableCell><Badge variant="outline" className="border-green-500 text-green-500">{a.share}</Badge></TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs font-bold leading-tight">
                                                <span className="text-primary">{a.beans?.toLocaleString()} B</span>
                                                <span className="text-cyan-500">{a.diamonds?.toLocaleString()} D</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <Button size="sm" variant="secondary" onClick={() => navigate(`/${role}/agencies`)}>View</Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {role === "super-admin" && (
                    <TabsContent value="subadmins" className="space-y-4">
                        <Card className="border-none shadow-premium bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Sub Admins Network</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 sm:pt-0">
                                <EnhancedTable
                                    data={mockSubAdmins}
                                    pageSize={5}
                                    searchKeys={["name"]}
                                    columns={
                                        <TableHeader>
                                            <TableRow className="border-border/40 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Name & Email</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">ID</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Hosts</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Share / Beans</TableHead>
                                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Manage</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                    }
                                    renderRow={(s: any) => (
                                        <TableRow key={s.id} className="border-border/40">
                                            <TableCell className="font-medium pl-4">
                                                <div className="flex flex-col">
                                                    <span>{s.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{s.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">{s.id}</TableCell>
                                            <TableCell className="text-center font-bold text-purple-600">{s.hosts}</TableCell>
                                            <TableCell className="text-sm">{s.contact}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs font-bold leading-tight">
                                                    <span className="text-green-500">{s.share} Share</span>
                                                    <span className="text-primary">{s.beans?.toLocaleString()} B</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <Button size="sm" variant="secondary" onClick={() => navigate('/super-admin/sub-admins')}>View</Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {role === "super-admin" && (
                    <TabsContent value="resellers" className="space-y-4">
                        <Card className="border-none shadow-premium bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-xl">Resellers List</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 sm:p-6 sm:pt-0">
                                <EnhancedTable
                                    data={mockResellers}
                                    pageSize={5}
                                    searchKeys={["name"]}
                                    columns={
                                        <TableHeader>
                                            <TableRow className="border-border/40 hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Network Name</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Purchasing Requests</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Share</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Total Beans / Diamonds</TableHead>
                                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Manage</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                    }
                                    renderRow={(r: any) => (
                                        <TableRow key={r.id} className="border-border/40">
                                            <TableCell className="font-medium pl-4">{r.name}</TableCell>
                                            <TableCell className="font-bold">{r.purchaseRequests}</TableCell>
                                            <TableCell><Badge className="bg-cyan-500/10 text-cyan-500 border-none">{r.share}</Badge></TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs font-bold leading-tight">
                                                    <span className="text-primary">{r.totalBeans?.toLocaleString()} B</span>
                                                    <span className="text-cyan-500">{r.diamonds?.toLocaleString()} D</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <Button size="sm" variant="secondary" onClick={() => navigate('/super-admin/resellers')}>View</Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-premium bg-card/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Agency Follow-ups</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                            {agencyFollowUps.map((agency) => (
                                <div key={agency.name} className="flex items-center justify-between rounded-xl border border-border/40 p-4 bg-background/30 hover:bg-background/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-sm">{agency.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                    {agency.hosts} hosts • {agency.note}
                                    </p>
                                </div>
                                <Badge 
                                    variant={agency.urgency === "High" ? "destructive" : "default"}
                                    className="text-[10px] font-bold h-5 px-2"
                                >
                                    {agency.urgency}
                                </Badge>
                                </div>
                            ))}
                            </div>
                        </CardContent>
                        </Card>

                        <Card className="border-none shadow-premium bg-card/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-warning" />
                            Host Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                            {hostAlerts.map((host) => (
                                <div key={host.name} className="rounded-xl border border-border/40 p-4 bg-background/30 hover:bg-background/50 transition-colors group">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{host.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">{host.agency}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2 bg-warning/10 text-warning border-warning/10">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> {host.status}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed bg-muted/20 px-2 py-1 rounded italic">{host.issue}</p>
                                </div>
                            ))}
                            </div>
                        </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <TopAgencies />
                    </div>
                </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SuperAdminDashboard() {
  return <AdminDashboardHome role="super-admin" />;
}
