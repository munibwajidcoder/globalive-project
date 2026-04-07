import { DashboardLayout } from "@/components/DashboardLayout";
import { useMemo, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  ClipboardCopy,
  CheckCircle2,
  Clock,
  DollarSign,
  Link,
  Mail,
  Phone,
  TrendingUp,
  Users,
} from "lucide-react";

type ResellerStatus = "Active" | "Pending Approval";

type ResellerTransaction = {
  id: string;
  description: string;
  beans: number;
  payment: number;
  date: string;
  status: "Completed" | "Pending";
  slipName: string;
  slipUrl?: string;
};

type ResellerRecord = {
  id: string;
  code: string;
  name: string;
  commissionRate: number;
  walletBalance: number;
  beansHeld: number;
  beansTransferred: number;
  beanRequests: number;
  status: ResellerStatus;
  email: string;
  phone: string;
  inviteUrl: string;
  transactions: ResellerTransaction[];
};

const PUBLIC_RESELLER_FORM = "https://globilive.example/apply-reseller";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const formatBeans = (value: number) => `${numberFormatter.format(value)} beans`;
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDateTime = (value: string) => dateTimeFormatter.format(new Date(value));

const initialResellers: ResellerRecord[] = [
  {
    id: "RES-1101",
    code: "A001",
    name: "Velocity Digital",
    commissionRate: 0.12,
    walletBalance: 4850,
    beansHeld: 68000,
    beansTransferred: 54000,
    beanRequests: 12,
    status: "Active",
    email: "velocity.ops@example.com",
    phone: "+971 55 221 3344",
    inviteUrl: "https://globilive.example/apply-reseller?ref=A001",
    transactions: [
      {
        id: "TRX-8001",
        description: "Monthly host stipend",
        beans: 22000,
        payment: 490,
        date: "2025-11-12T10:05:00Z",
        status: "Completed",
        slipName: "Slip_TRX-8001.pdf",
        slipUrl: "https://assets.globilive.example/slips/Slip_TRX-8001.pdf",
      },
      {
        id: "TRX-7994",
        description: "Creator onboarding bundle",
        beans: 12000,
        payment: 260,
        date: "2025-11-10T15:35:00Z",
        status: "Completed",
        slipName: "Slip_TRX-7994.jpg",
      },
    ],
  },
  {
    id: "RES-1102",
    code: "A002",
    name: "Luminous Streams",
    commissionRate: 0.1,
    walletBalance: 3220,
    beansHeld: 45200,
    beansTransferred: 30100,
    beanRequests: 9,
    status: "Active",
    email: "finance@lstreams.io",
    phone: "+63 917 888 2233",
    inviteUrl: "https://globilive.example/apply-reseller?ref=A002",
    transactions: [
      {
        id: "TRX-8005",
        description: "Beans restock",
        beans: 15000,
        payment: 335,
        date: "2025-11-13T08:20:00Z",
        status: "Completed",
        slipName: "Slip_TRX-8005.png",
      },
      {
        id: "TRX-7989",
        description: "Agency reimbursement",
        beans: 7200,
        payment: 160,
        date: "2025-11-09T19:55:00Z",
        status: "Pending",
        slipName: "Slip_TRX-7989.pdf",
        slipUrl: "https://assets.globilive.example/slips/Slip_TRX-7989.pdf",
      },
    ],
  },
  {
    id: "RES-1103",
    code: "A003",
    name: "Nova Promotions",
    commissionRate: 0.08,
    walletBalance: 980,
    beansHeld: 18800,
    beansTransferred: 9700,
    beanRequests: 4,
    status: "Pending Approval",
    email: "hello@novapromo.co",
    phone: "+44 7700 900212",
    inviteUrl: "https://globilive.example/apply-reseller?ref=A003",
    transactions: [
      {
        id: "TRX-8007",
        description: "Initial deposit",
        beans: 5000,
        payment: 115,
        date: "2025-11-11T11:10:00Z",
        status: "Pending",
        slipName: "Slip_TRX-8007.pdf",
      },
    ],
  },
];

function copyToClipboard(value: string, successMessage: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    toast({ title: "Copy unavailable", description: "Clipboard access is not supported in this environment." });
    return;
  }
  navigator.clipboard
    .writeText(value)
    .then(() => toast({ title: "Link copied", description: successMessage }))
    .catch(() => toast({ title: "Copy failed", description: "Copy manually if needed." }));
}

export default function TopUpResellers() {
  const [resellers, setResellers] = useState<ResellerRecord[]>(initialResellers);
  const [viewing, setViewing] = useState<ResellerRecord | null>(null);

  const metrics = useMemo(() => {
    const active = resellers.filter((reseller) => reseller.status === "Active");
    const pending = resellers.filter((reseller) => reseller.status === "Pending Approval");
    const totalBeansHeld = resellers.reduce((sum, reseller) => sum + reseller.beansHeld, 0);
    const totalBeansTransferred = resellers.reduce((sum, reseller) => sum + reseller.beansTransferred, 0);
    const totalWallet = resellers.reduce((sum, reseller) => sum + reseller.walletBalance, 0);
    const totalRequests = resellers.reduce((sum, reseller) => sum + reseller.beanRequests, 0);
    return {
      activeCount: active.length,
      pendingCount: pending.length,
      totalBeansHeld,
      totalBeansTransferred,
      totalWallet,
      totalRequests,
    };
  }, [resellers]);

  const recentTransactions = useMemo(() => {
    return resellers
      .flatMap((reseller) =>
        reseller.transactions.map((txn) => ({
          ...txn,
          resellerCode: reseller.code,
          resellerName: reseller.name,
        })),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [resellers]);

  const approveReseller = (targetId: string) => {
    setResellers((prev) =>
      prev.map((reseller) =>
        reseller.id === targetId
          ? {
              ...reseller,
              status: "Active",
            }
          : reseller,
      ),
    );
    toast({ title: "Reseller approved", description: "They can now access the reseller panel." });
  };

  const tableColumns = (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead className="w-[200px]">Reseller</TableHead>
        <TableHead className="w-[100px]">Comm.</TableHead>
        <TableHead>Wallet</TableHead>
        <TableHead>Held</TableHead>
        <TableHead className="hidden md:table-cell text-center">Reqs</TableHead>
        <TableHead className="hidden lg:table-cell">Transferred</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );

  return (
    <DashboardLayout role="topup-agent">
      <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden p-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Resellers</h2>
            <p className="mt-1 text-muted-foreground">
              Track reseller balances, bean allocations, and approve incoming partnership requests.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => copyToClipboard(PUBLIC_RESELLER_FORM, "Reseller signup link copied." )}
          >
            <Link className="mr-2 h-4 w-4" /> Share reseller signup link
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <MetricCard 
            title="Active Resellers" 
            value={metrics.activeCount.toString()} 
            icon={CheckCircle2} 
            variant="success" 
            change="Currently trading"
          />
          <MetricCard 
            title="Pending Approvals" 
            value={metrics.pendingCount.toString()} 
            icon={Clock} 
            variant="warning" 
            change="Awaiting review"
          />
          <MetricCard 
            title="Beans Management" 
            value={formatBeans(metrics.totalBeansHeld)} 
            icon={Users} 
            variant="primary" 
            change="Total holdings"
          />
          <MetricCard 
            title="Beans Dispatched" 
            value={formatBeans(metrics.totalBeansTransferred)} 
            icon={TrendingUp} 
            variant="default" 
            change={`Across ${metrics.totalRequests} requests`}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,320px]">
          <Card className="order-1 min-w-0">
            <CardHeader>
              <CardTitle>Reseller roster</CardTitle>
              <CardDescription>
                Monitor balances, beans, and commission policy per reseller. Aggregate wallet balance {formatCurrency(metrics.totalWallet)}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedTable
                data={resellers}
                pageSize={6}
                searchKeys={["code", "name", "status"]}
                columns={tableColumns}
                renderRow={(reseller) => (
                  <TableRow key={reseller.id} className="text-xs sm:text-sm">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate max-w-[120px]">{reseller.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{reseller.code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-center">{Math.round(reseller.commissionRate * 100)}%</TableCell>
                    <TableCell className="font-bold">{formatCurrency(reseller.walletBalance)}</TableCell>
                    <TableCell className="font-bold text-primary">{formatBeans(reseller.beansHeld).replace(' beans', '')}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{reseller.beanRequests}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{formatBeans(reseller.beansTransferred).replace(' beans', '')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={reseller.status === "Active" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold py-0 h-5"
                      >
                        {reseller.status === "Active" ? "Active" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                             <div className="flex gap-0.5">
                               <div className="h-1 w-1 rounded-full bg-foreground" />
                               <div className="h-1 w-1 rounded-full bg-foreground" />
                               <div className="h-1 w-1 rounded-full bg-foreground" />
                             </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => setViewing(reseller)} className="rounded-lg">
                            <DollarSign className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(reseller.inviteUrl, `${reseller.name} invite link ready to share.`)}
                            className="rounded-lg"
                          >
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy invite link
                          </DropdownMenuItem>
                          {reseller.status === "Pending Approval" && (
                            <DropdownMenuItem onClick={() => approveReseller(reseller.id)} className="rounded-lg text-success">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve reseller
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )}
              />
            </CardContent>
          </Card>

          <Card className="order-2 xl:sticky xl:top-6 h-fit">
            <CardHeader className="pb-3 border-b mb-4">
              <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
              <CardDescription>Latest bean transfers and settlements.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[460px] pr-4 custom-scrollbar">
                <div className="space-y-4 px-1">
                  {recentTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No transactions recorded yet.</p>
                  ) : (
                    recentTransactions.map((txn) => (
                      <div key={txn.id} className="rounded-2xl border bg-muted/20 p-4 hover:bg-muted/30 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-sm">{txn.description}</span>
                          <Badge 
                            variant={txn.status === "Completed" ? "default" : "secondary"}
                            className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          >
                            {txn.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <p className="text-xs font-semibold">
                                {txn.resellerCode} • {txn.resellerName}
                              </p>
                           </div>
                           <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-background/50 rounded-lg p-2 border border-muted-foreground/5">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(txn.date)}</span>
                              <span className="font-bold text-primary">{formatBeans(txn.beans)}</span>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
          <DialogContent className="w-[96vw] max-w-3xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border bg-background">
            <div className="flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">{viewing?.name}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base font-medium text-primary">
                    {viewing ? `${viewing.code} • Commission ${Math.round(viewing.commissionRate * 100)}%` : ""}
                  </DialogDescription>
                </DialogHeader>

                {viewing && (
                  <div className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                       <div className="p-5 rounded-2xl bg-muted/30 border border-muted-foreground/5 space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                             <Mail className="h-3.5 w-3.5" /> <span>Direct Contact</span>
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center text-primary">
                                   <Mail className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{viewing.email}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center text-primary">
                                   <Phone className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{viewing.phone}</span>
                             </div>
                          </div>
                       </div>

                       <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                             <TrendingUp className="h-3.5 w-3.5" /> <span>Real-time Balances</span>
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Wallet balance</span>
                                <span className="font-bold text-sm">{formatCurrency(viewing.walletBalance)}</span>
                             </div>
                             <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Beans held</span>
                                <span className="font-bold text-sm text-primary">{formatBeans(viewing.beansHeld)}</span>
                             </div>
                             <div className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Beans transferred</span>
                                <span className="font-bold text-sm">{formatBeans(viewing.beansTransferred)}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground border-l-4 border-primary pl-3">Transaction History</h4>
                       <div className="rounded-2xl border bg-muted/10 divide-y overflow-hidden">
                          {viewing.transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground italic text-sm">No transactions recorded for this reseller.</div>
                          ) : (
                            viewing.transactions.map((txn) => (
                              <div key={txn.id} className="p-5 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-sm sm:text-base">{txn.description}</span>
                                  <Badge 
                                    variant={txn.status === "Completed" ? "default" : "secondary"}
                                    className="rounded-lg font-bold text-[10px] sm:text-xs"
                                  >
                                    {txn.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-3">
                                   <Clock className="h-3 w-3" />
                                   <span>{formatDateTime(txn.date)}</span>
                                   <span className="mx-1">•</span>
                                   <span className="font-mono">{txn.id}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                   <div className="px-3 py-1.5 rounded-xl bg-background border text-[10px] sm:text-xs font-bold text-primary">
                                      {formatBeans(txn.beans)}
                                   </div>
                                   <div className="px-3 py-1.5 rounded-xl bg-background border text-[10px] sm:text-xs font-bold">
                                      {formatCurrency(txn.payment)}
                                   </div>
                                   {txn.slipName && (
                                     <div className="px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 text-[10px] sm:text-xs font-bold text-success flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3 w-3" /> {txn.slipName}
                                     </div>
                                   )}
                                </div>
                                {!txn.slipUrl && (
                                  <p className="mt-3 text-[10px] text-muted-foreground italic">Offline record available only.</p>
                                )}
                              </div>
                            ))
                          )}
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-muted/20 text-[10px] sm:text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Requests handled: {viewing.beanRequests}</span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">Policy: {Math.round(viewing.commissionRate * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setViewing(null)} className="h-11 px-6 rounded-xl font-medium sm:flex-1 order-2 sm:order-1">
                  Close
                </Button>
                {viewing?.inviteUrl && (
                  <Button 
                    onClick={() => copyToClipboard(viewing.inviteUrl, `${viewing.name} invite link ready to share.`)}
                    className="h-11 px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex-1 order-1 sm:order-2"
                  >
                    Copy Invite Link
                  </Button>
                )}
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors sm:hidden" />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
