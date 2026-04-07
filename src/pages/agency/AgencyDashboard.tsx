import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query as fbQuery, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { TopAgencies } from "@/components/TopAgencies";
import { AlertTriangle, DollarSign, Gift, Link as LinkIcon, Mic2, MoreHorizontal, ShieldCheck, TrendingUp, User, ShieldAlert } from "lucide-react";

type HostTransactionType = "Gift" | "Top-up" | "Bonus" | "Penalty";
type WithdrawalStatus = "Pending" | "Paid" | "Rejected";

type HostWithdrawal = {
  id: string;
  amountUsd: number;
  requestedFrom: string;
  requestedOn: string;
  processedOn?: string;
  status: WithdrawalStatus;
};

type HostTransaction = {
  id: string;
  type: HostTransactionType;
  amount: number;
  source: string;
  date: string;
  note?: string;
};

type HostRecord = {
  id: string;
  name: string;
  level: string;
  status: "Active" | "Suspended" | "Auditing";
  diamonds: number;
  beans: number;
  lastPayoutOn: string;
  lastLiveAt: string;
  contact: string;
  location: string;
  avgViewers: string;
  joinedOn: string;
  earningsUsd: number;
  diamondTransactions: HostTransaction[];
  withdrawalHistory: HostWithdrawal[];
};

type ShareWithdrawalRequest = {
  id: string;
  routedTo: "Super Admin" | "Sub Admin";
  amountPkr: number;
  requestedOn: string;
  processedOn?: string;
  status: WithdrawalStatus;
  note?: string;
};

const DIAMOND_TO_PKR = 1.8;
const HOST_FORM_BASE = "https://globilive.app/public/host-apply";

const shareWithdrawalsSeed: ShareWithdrawalRequest[] = [
  { id: "SW-2098", routedTo: "Super Admin", amountPkr: 185000, requestedOn: "2025-11-08", processedOn: "2025-11-09", status: "Paid" },
  { id: "SW-2110", routedTo: "Sub Admin", amountPkr: 92000, requestedOn: "2025-11-12", status: "Pending", note: "Awaiting treasury clearance" },
  { id: "SW-2050", routedTo: "Super Admin", amountPkr: 156000, requestedOn: "2025-10-25", processedOn: "2025-10-27", status: "Paid" },
];

const formatPkr = (value: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(value);

const formatUsd = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  });

export default function AgencyDashboard() {
  const [hosts, setHosts] = useState<HostRecord[]>([]);
  const [selectedHost, setSelectedHost] = useState<HostRecord | null>(null);
  const { user, logout } = useAuth();
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [agencyCode, setAgencyCode] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadAgency = async () => {
      if (!user?.username) return;
      try {
        const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user.username));
        const snaps = await getDocs(q);
        if (!mounted) return;
        if (!snaps.empty) {
          const a = snaps.docs[0].data() as any;
          setAgencyName(a.name || a.agencyName || null);
          setAgencyCode(a.code || a.agencyCode || null);

          try {
            const hostIds: string[] = Array.isArray(a.agencyHosts) ? a.agencyHosts : [];
            if (hostIds.length === 0) {
              setHosts([]);
            } else {
              const fetched = await Promise.all(
                hostIds.map(async (hid) => {
                  try {
                    const uDoc = await getDoc(doc(db, "globiliveUsers", String(hid)));
                    if (!uDoc.exists()) return null;
                    const ud: any = uDoc.data();
                    return {
                      id: uDoc.id,
                      name: ud.name || ud.email || ud.username || "",
                      level: ud.level?.level ? `Level ${ud.level.level}` : (ud.level || ""),
                      status: ud.host?.isHost ? "Active" : "Auditing",
                      diamonds: Number(ud.diamonds || 0),
                      beans: Number(ud.beans || 0),
                      lastPayoutOn: ud.lastPayoutOn || "",
                      lastLiveAt: ud.lastSeen || "",
                      contact: ud.phone || ud.contact || ud.email || "",
                      location: ud.country || ud.location || "",
                      avgViewers: ud.avgViewers || "",
                      joinedOn: ud.joinedOn || ud.createdAt || "",
                      earningsUsd: Number(ud.earningsUsd || 0),
                      diamondTransactions: Array.isArray(ud.diamondTransactions) ? ud.diamondTransactions : [],
                      withdrawalHistory: Array.isArray(ud.withdrawalHistory) ? ud.withdrawalHistory : [],
                    } as HostRecord;
                  } catch (err) {
                    console.error("error loading host user", hid, err);
                    return null;
                  }
                }),
              );
              setHosts(fetched.filter(Boolean) as HostRecord[]);
            }
          } catch (err) {
            console.error("failed to load agency hosts", err);
          }
        }
      } catch (e) {
        console.error("load agency name failed", e);
      }
    };
    loadAgency();
    return () => { mounted = false; };
  }, [user]);

  const hostFormLink = useMemo(
    () => `${HOST_FORM_BASE}?agencyCode=${encodeURIComponent(agencyCode || "")}`,
    [agencyCode],
  );

  const displayLabel = user?.displayName || user?.username || "Agency";
  const emailLabel = user?.email || user?.username;

  const totals = useMemo(() => {
    const totalDiamonds = hosts.reduce((sum, host) => sum + host.diamonds, 0);
    const totalBeans = hosts.reduce((sum, host) => sum + host.beans, 0);
    const totalUsd = hosts.reduce((sum, host) => sum + host.earningsUsd, 0);
    const totalPkr = totalDiamonds * DIAMOND_TO_PKR;
    const agencySharePercent = 0.2;
    const agencySharePkr = totalPkr * agencySharePercent;
    const monthlyDiamondTarget = 50000;
    const diamondsProgress = Math.min(100, Math.round((totalDiamonds / monthlyDiamondTarget) * 100));

    return {
      totalDiamonds,
      totalBeans,
      totalUsd,
      totalPkr,
      agencySharePercent,
      agencySharePkr,
      monthlyDiamondTarget,
      diamondsProgress,
      totalHosts: hosts.length,
    };
  }, [hosts]);

  const hostWithdrawals = useMemo(() =>
    hosts.flatMap((host) =>
      host.withdrawalHistory.map((request) => ({
        hostId: host.id,
        hostName: host.name,
        ...request,
      })),
    ),
  [hosts]);

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(hostFormLink);
      toast({
        title: "Public host form copied",
        description: `Share the link with prospects. Agency code ${agencyCode} is pre-filled.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout role="agency">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manage Agency</h2>
            <p className="text-muted-foreground mt-1">
              Full visibility into your hosts, payouts, and agency performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 p-0 text-muted-foreground hover:text-primary transition-colors">
                  <User className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4 flex flex-col items-center gap-3 bg-card border-border/60 shadow-xl">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-base font-bold text-foreground">{displayLabel}</div>
                  {agencyName && <div className="text-[10px] uppercase font-black text-primary tracking-widest">{agencyName}</div>}
                  <div className="text-xs text-muted-foreground font-medium">{emailLabel}</div>
                </div>
                <div className="w-full border-t border-border/50 my-1" />
                <div className="w-full">
                  <Button variant="destructive" className="w-full h-9 gap-2" onClick={() => logout && logout()}>
                    Logout
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Active Hosts" value={totals.totalHosts} change="" icon={Mic2} variant="primary" />
          <MetricCard title="Total Diamonds" value={`${totals.totalDiamonds.toLocaleString()} 💎`} change="" icon={Gift} variant="default" />
          <MetricCard title="Value in PKR" value={formatPkr(totals.totalPkr)} change="" icon={DollarSign} variant="success" />
          <MetricCard title="Agency Share (20%)" value={formatPkr(totals.agencySharePkr)} change="" icon={TrendingUp} variant="warning" />
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">Host Roster</CardTitle>
                <p className="text-xs text-muted-foreground font-medium">Complete host list including diamonds and PKR conversion.</p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/40">
                <ShieldCheck className="h-3 w-3 text-success" />
                Rate: 1 💎 = {formatPkr(DIAMOND_TO_PKR)}
              </div>
            </div>
          </CardHeader>
          <EnhancedTable
            data={hosts}
            pageSize={10}
            searchKeys={["name", "level", "status", "contact"]}
            filterSchema={[
              { key: "name", label: "Host Name" },
              { key: "level", label: "Level" },
              { key: "status", label: "Status" },
            ]}
            columns={
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Host</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Level</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Diamonds</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Value (PKR)</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Payout</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(host: HostRecord) => (
              <TableRow key={host.id} className="hover:bg-muted/30 transition-colors border-border/40">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm">{host.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{host.contact}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-medium">{host.level}</TableCell>
                <TableCell className="text-xs font-bold">{host.diamonds.toLocaleString()}</TableCell>
                <TableCell className="text-xs font-medium">{formatPkr(host.diamonds * DIAMOND_TO_PKR)}</TableCell>
                <TableCell>
                  <Badge variant={host.status === "Active" ? "default" : host.status === "Suspended" ? "destructive" : "secondary"} className="text-[9px] font-bold px-2 h-5">
                    {host.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{host.lastPayoutOn ? formatDate(host.lastPayoutOn) : "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => setSelectedHost(host)} className="text-xs font-medium">View profile</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-premium bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Host Withdrawal Requests</CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Routed through Admin supervision</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-xl border border-border/40 overflow-hidden mx-4 mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Host</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">Amount (USD)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right border-none">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hostWithdrawals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs italic">
                            No withdrawal requests logged yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        hostWithdrawals.map((request) => (
                          <TableRow key={request.id} className="border-border/40 hover:bg-muted/20 transition-colors">
                            <TableCell className="font-semibold text-xs py-3">{request.hostName}</TableCell>
                            <TableCell className="text-center text-xs font-bold text-success">{formatUsd(request.amountUsd)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={request.status === "Pending" ? "secondary" : request.status === "Rejected" ? "destructive" : "default"} className="text-[9px] font-bold h-5 px-2">
                                {request.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Agency Payout History</CardTitle>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Track your agency share withdrawals</p>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="rounded-xl border border-border/40 overflow-hidden mx-4 mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Reference</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center">Amount (PKR)</TableHead>
                        <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right border-none">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shareWithdrawalsSeed.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs italic">
                            No requests submitted yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        shareWithdrawalsSeed.map((request) => (
                          <TableRow key={request.id} className="border-border/40 hover:bg-muted/20 transition-colors">
                            <TableCell className="font-bold text-[10px] font-mono py-3">{request.id}</TableCell>
                            <TableCell className="text-center text-xs font-bold text-success">{formatPkr(request.amountPkr)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={request.status === "Pending" ? "secondary" : request.status === "Rejected" ? "destructive" : "default"} className="text-[9px] font-bold h-5 px-2">
                                {request.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <TopAgencies />
            
            <Card className="border-none shadow-premium bg-card/50 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Agency Share Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-xl border border-border/40 p-4 bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Share percentage</span>
                    <span className="text-primary">{Math.round(totals.agencySharePercent * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-base mt-2">
                    <span className="text-xs text-muted-foreground font-medium">Estimated Value</span>
                    <span className="font-bold text-foreground">{formatPkr(totals.agencySharePkr)}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border/40 p-4 bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <span>Monthly Target</span>
                    <span>{totals.monthlyDiamondTarget.toLocaleString()} 💎</span>
                  </div>
                  <div className="mt-4">
                    <Progress value={totals.diamondsProgress} className="h-1.5 bg-muted/60" />
                    <div className="flex justify-between mt-2">
                       <p className="text-[10px] text-muted-foreground font-bold italic tracking-wide">
                        {totals.totalDiamonds.toLocaleString()} Collected
                      </p>
                      <p className="text-[10px] text-primary font-bold">{totals.diamondsProgress}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-premium bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Mic2 className="h-24 w-24" />
              </div>
              <CardHeader className="pb-0">
                <CardTitle className="text-white/90 text-sm font-bold uppercase tracking-widest">Agency Portal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 py-6 text-center relative z-10">
                <div className="space-y-1">
                  <p className="text-xs text-white/70 font-medium">Your Recruitment Code</p>
                  <p className="text-5xl font-black tracking-tighter drop-shadow-lg">{agencyCode || '—'}</p>
                </div>
                <Button variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] h-11 bg-white text-indigo-700 hover:bg-white/90 border-none shadow-lg transition-all active:scale-95" onClick={handleCopyPublicLink}>
                   <LinkIcon className="h-4 w-4 mr-2" />
                   Copy Magic Onboarding Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedHost} onOpenChange={(open) => !open && setSelectedHost(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedHost && (
            <div className="flex flex-col">
              <div className="bg-muted/30 p-6 border-b border-border/40">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                     </div>
                     <div className="space-y-0.5">
                        <DialogTitle className="text-2xl font-bold">{selectedHost.name}</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                           Joined {formatDate(selectedHost.joinedOn)} • {selectedHost.level}
                        </DialogDescription>
                     </div>
                  </div>
                </DialogHeader>
              </div>
              
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border/40 p-4 bg-muted/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <Badge variant={selectedHost.status === "Active" ? "default" : "destructive"} className="h-5 px-2 text-[10px] font-bold">
                       {selectedHost.status}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border/40 p-4 bg-muted/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Diamonds</p>
                    <p className="text-xl font-bold">{selectedHost.diamonds.toLocaleString()} 💎</p>
                  </div>
                  <div className="rounded-xl border border-border/40 p-4 bg-muted/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Current Value</p>
                    <p className="text-xl font-bold text-success">{formatPkr(selectedHost.diamonds * DIAMOND_TO_PKR)}</p>
                  </div>
                </div>

                <Tabs defaultValue="diamonds" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full max-w-sm mb-6 bg-muted/30 p-1">
                    <TabsTrigger value="diamonds" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Ledger</TabsTrigger>
                    <TabsTrigger value="withdrawals" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm">Withdrawals</TabsTrigger>
                  </TabsList>

                  <TabsContent value="diamonds" className="space-y-4">
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Type</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Source</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right">Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedHost.diamondTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-xs italic">
                                No activity recorded.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedHost.diamondTransactions.map((tx) => (
                              <TableRow key={tx.id} className="hover:bg-muted/20 border-border/40 transition-colors">
                                <TableCell>
                                   <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5">{tx.type}</Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold">{tx.amount.toLocaleString()} 💎</TableCell>
                                <TableCell className="text-xs font-medium">{tx.source}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{tx.date}</TableCell>
                                <TableCell className="text-right text-[10px] text-muted-foreground italic">{tx.note ?? "—"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>

                  <TabsContent value="withdrawals" className="space-y-4">
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Via</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Requested</TableHead>
                            <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedHost.withdrawalHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-10 text-xs italic">
                                No history found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedHost.withdrawalHistory.map((entry) => (
                              <TableRow key={entry.id} className="hover:bg-muted/20 border-border/40 transition-colors">
                                <TableCell className="text-xs font-bold text-success">{formatUsd(entry.amountUsd)}</TableCell>
                                <TableCell className="text-xs font-medium">{entry.requestedFrom}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(entry.requestedOn)}</TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={entry.status === "Pending" ? "secondary" : entry.status === "Rejected" ? "destructive" : "default"} className="text-[9px] font-bold h-5 px-2">
                                    {entry.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="bg-muted/10 p-4 border-t border-border/40 flex justify-end">
                <DialogClose asChild>
                  <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest h-10 px-6">
                    Close Profile
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
