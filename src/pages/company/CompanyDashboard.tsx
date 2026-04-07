import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Users, DollarSign, TrendingUp, Shield, Slash, UserX, Database, Banknote, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader, Table, TableBody } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const mockAgencies = [
  { id: "A1", name: "Star Agency", target: 50000, share: "20%", activeHosts: 12 },
  { id: "A2", name: "Galaxy Resellers", target: 100000, share: "25%", activeHosts: 45 },
];

const mockStaff = [
  { id: "S1", name: "Alice Admin", role: "Super Admin", region: "North America" },
  { id: "S2", name: "Bob Support", role: "Sub Admin", region: "Europe" },
];

const mockAgents = [
  { id: "TA1", name: "QuickTopup", type: "Top-up Agent", sales: "$4,500" },
  { id: "R1", name: "GlobalResell", type: "Reseller", sales: "$12,400" },
];

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalSuperAdmins, setTotalSuperAdmins] = useState<number | null>(null);
  
  const [blockedUsersModal, setBlockedUsersModal] = useState(false);
  const [blockedHostsModal, setBlockedHostsModal] = useState(false);
  
  // Need state for blocked counts
  const [blockedUsersCount, setBlockedUsersCount] = useState(0);
  const [blockedHostsCount, setBlockedHostsCount] = useState(0);

  useEffect(() => {
    // In actual implementation, we'd query for blocked status
    setBlockedUsersCount(14);
    setBlockedHostsCount(3);
    const usersRef = collection(db, "globiliveUsers");
    const unsub = onSnapshot(usersRef, (snap) => setTotalUsers(snap.size));
    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = collection(db, "globiliveSuperAdmins");
    const unsub = onSnapshot(ref, (snap) => setTotalSuperAdmins(snap.size));
    return () => unsub();
  }, []);

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Company Overview</h2>
              <p className="text-muted-foreground mt-1">Complete platform control and management</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="border-purple-500/20 text-purple-600 hover:bg-purple-500/10" asChild>
                    <Link to="/company/beans"><Database className="w-4 h-4 mr-2" /> Beans Tracking</Link>
                </Button>
                <Button variant="outline" className="border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10" asChild>
                    <Link to="/company/topup-agents"><Banknote className="w-4 h-4 mr-2" /> Top-up Agents Form Link</Link>
                </Button>
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <MetricCard title="Total Users" value={totalUsers !== null ? totalUsers.toLocaleString() : "—"} change="+12.5%" icon={Users} variant="primary" />
          <MetricCard title="Total Revenue" value="$2.4M" change="+18.2%" icon={DollarSign} variant="success" />
          <MetricCard title="Active Hosts" value="3,248" change="+8.1%" icon={TrendingUp} variant="default" />
          <MetricCard title="Staff Size" value={totalSuperAdmins !== null ? totalSuperAdmins.toLocaleString() : "12"} icon={Shield} variant="default" />
          
          <Card className="cursor-pointer border-none shadow-sm bg-destructive/10 hover:bg-destructive/15 transition-colors" onClick={() => setBlockedUsersModal(true)}>
             <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-1">Blocked Users</p>
                    <h3 className="text-2xl font-bold text-destructive">{blockedUsersCount}</h3>
                </div>
                <UserX className="w-8 h-8 text-destructive opacity-50" />
             </CardContent>
          </Card>
          
          <Card className="cursor-pointer border-none shadow-sm bg-orange-500/10 hover:bg-orange-500/15 transition-colors" onClick={() => setBlockedHostsModal(true)}>
             <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">Blocked Hosts</p>
                    <h3 className="text-2xl font-bold text-orange-600">{blockedHostsCount}</h3>
                </div>
                <Slash className="w-8 h-8 text-orange-600 opacity-50" />
             </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="agencies" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-6">
                <TabsTrigger value="agencies">Agencies Overview</TabsTrigger>
                <TabsTrigger value="staff">Staff Network</TabsTrigger>
                <TabsTrigger value="agents">Agents & Resellers</TabsTrigger>
            </TabsList>

            <TabsContent value="agencies" className="space-y-4">
               <Card className="border-none shadow-premium bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Agency Operations</CardTitle>
                        <CardDescription>Live tracking of agency targets and revenue shares.</CardDescription>
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
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Active Hosts</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Growth Target</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Revenue Share</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Profile</TableHead>
                                    </TableRow>
                                </TableHeader>
                            }
                            renderRow={(a: any) => (
                                <TableRow key={a.id} className="border-border/40">
                                    <TableCell className="font-medium pl-4">{a.name}</TableCell>
                                    <TableCell className="text-center font-bold">{a.activeHosts}</TableCell>
                                    <TableCell>${a.target.toLocaleString()}</TableCell>
                                    <TableCell><Badge variant="outline" className="border-green-500 text-green-500">{a.share}</Badge></TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button size="sm" variant="secondary" onClick={() => navigate('/company/agencies')}>View</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
                <Card className="border-none shadow-premium bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Super & Sub Admins</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                         <EnhancedTable
                            data={mockStaff}
                            pageSize={5}
                            searchKeys={["name", "role", "region"]}
                            columns={
                                <TableHeader>
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Name</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Region</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Manage</TableHead>
                                    </TableRow>
                                </TableHeader>
                            }
                            renderRow={(s: any) => (
                                <TableRow key={s.id} className="border-border/40">
                                    <TableCell className="font-medium pl-4">{s.name}</TableCell>
                                    <TableCell><Badge variant="secondary">{s.role}</Badge></TableCell>
                                    <TableCell>{s.region}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button size="sm" variant="secondary" onClick={() => navigate('/company/super-admins')}>View</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
                <Card className="border-none shadow-premium bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Top-up Agents & Resellers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                         <EnhancedTable
                            data={mockAgents}
                            pageSize={5}
                            searchKeys={["name", "type"]}
                            columns={
                                <TableHeader>
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Entity Name</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Account Type</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Period Sales</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Manage</TableHead>
                                    </TableRow>
                                </TableHeader>
                            }
                            renderRow={(a: any) => (
                                <TableRow key={a.id} className="border-border/40">
                                    <TableCell className="font-medium pl-4">{a.name}</TableCell>
                                    <TableCell><Badge className="bg-cyan-500/10 text-cyan-500 border-none">{a.type}</Badge></TableCell>
                                    <TableCell className="font-bold text-success">{a.sales}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button size="sm" variant="secondary" onClick={() => navigate('/company/topup-agents')}>View</Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </CardContent>
               </Card>
            </TabsContent>
        </Tabs>

        {/* Modals for Blocked Entities */}
        <Dialog open={blockedUsersModal} onOpenChange={setBlockedUsersModal}>
            <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-none shadow-premium">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2"><UserX className="w-5 h-5"/> Blocked Users Database</DialogTitle>
                </DialogHeader>
                <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
                    <p className="p-6 text-center text-muted-foreground text-sm">Actionable list of {blockedUsersCount} blocked users. Click the 'Unblock' action next to a user to restore their access.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => navigate('/company/users')}>Go to User Directory</Button>
                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={blockedHostsModal} onOpenChange={setBlockedHostsModal}>
            <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-none shadow-premium">
                <DialogHeader>
                    <DialogTitle className="text-orange-500 flex items-center gap-2"><Slash className="w-5 h-5"/> Suspended Hosts Tracking</DialogTitle>
                </DialogHeader>
                <div className="bg-muted/40 rounded-lg p-2 border border-border/40">
                    <p className="p-6 text-center text-muted-foreground text-sm">Review the {blockedHostsCount} suspended hosts across all agencies here. Restore their broadcast and withdrawal rights.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => navigate('/company/hosts')}>Go to Hosts Directory</Button>
                    <DialogClose asChild><Button variant="secondary">Close</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
