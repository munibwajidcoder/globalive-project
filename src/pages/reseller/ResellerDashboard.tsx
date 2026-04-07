import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query as fbQuery, where, orderBy, limit } from "firebase/firestore";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import {
  Building2,
  Download,
  Eye,
  Filter,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type TransactionStatus = "Completed" | "Pending Verification" | "Processing" | "Disputed";
type CounterpartyType = "Top-Up Agent" | "User" | "Host";
type TransactionDirection = "Inbound from Top-Up Agent" | "Outbound to Customer";

type ResellerTransaction = {
  id: string;
  direction: TransactionDirection;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyType: CounterpartyType;
  beans: number;
  amount: number;
  paymentMethod: "Bank" | "Wallet" | "Cash";
  initiatedAt: string;
  settledAt?: string;
  status: TransactionStatus;
  slipName: string;
  slipUrl?: string;
  note?: string;
};

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatBeans = (value: number) => `${numberFormatter.format(value)} beans`;
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDateTime = (value?: string) =>
  value ? dateTimeFormatter.format(new Date(value)) : "Pending";

const statusVariant: Record<TransactionStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Completed: "default",
  "Pending Verification": "secondary",
  Processing: "outline",
  Disputed: "destructive",
};

// Constants removed to use Firestore data

export default function ResellerDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<ResellerTransaction[]>([]);
  const [resellerProfile, setResellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user?.username) return;

    // Fetch Reseller Profile
    const profileQuery = fbQuery(collection(db, "globiliveResellers"), where("email", "==", user.username), limit(1));
    const unsubProfile = onSnapshot(profileQuery, (snapshot) => {
      if (!snapshot.empty) {
        setResellerProfile(snapshot.docs[0].data());
      }
    });

    // Fetch Transactions
    const transQuery = fbQuery(
        collection(db, "globiliveResellerTransactions"), 
        where("resellerEmail", "==", user.username),
        orderBy("initiatedAt", "desc")
    );
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ResellerTransaction[];
      setTransactions(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubTrans();
    };
  }, [user]);

  const beanWalletBalance = resellerProfile?.beans || 0;
  const cashWalletBalance = resellerProfile?.cashBalance || 0;
  const monthToDateOutbound = resellerProfile?.monthlyRevenue || 0;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CounterpartyType | "all">("all");
  const [directionFilter, setDirectionFilter] = useState<TransactionDirection | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<ResellerTransaction["paymentMethod"] | "all">("all");
  const [proofFilter, setProofFilter] = useState<"all" | "with-proof" | "missing-proof">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailRecord, setDetailRecord] = useState<ResellerTransaction | null>(null);

  const handleDownloadStatement = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: "No data to download",
        description: "The current filters return no transactions.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["ID", "Direction", "Counterparty ID", "Name", "Type", "Beans", "Amount", "Method", "Status", "Date"];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.direction,
      t.counterpartyId,
      t.counterpartyName,
      t.counterpartyType,
      t.beans,
      t.amount,
      t.paymentMethod,
      t.status,
      new Date(t.initiatedAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GlobiLive_Statement_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Statement downloaded",
      description: `Exported ${filteredTransactions.length} transactions to CSV.`,
    });
  };

  const handleViewSlip = (record: ResellerTransaction) => {
    // Only use the URL if it's a real external domain, not our placeholder example
    if (record.slipUrl && record.slipUrl.startsWith("http") && !record.slipUrl.includes("example")) {
      window.open(record.slipUrl, "_blank");
      return;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Slip - ${record.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; background: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
            .header { border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.025em; }
            .status { padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; background: #f3f4f6; }
            .status-completed { background: #dcfce7; color: #166534; }
            .section { margin-bottom: 24px; }
            .label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 16px; font-weight: 500; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
            .total-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
            @media print { body { background: white; padding: 0; } .container { box-shadow: none; border: none; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GLOBILIVE</div>
              <div class="status ${record.status === 'Completed' ? 'status-completed' : ''}">${record.status}</div>
            </div>
            
            <div class="section">
              <div class="label">Transaction ID</div>
              <div class="value">${record.id}</div>
            </div>

            <div class="grid">
              <div class="section">
                <div class="label">Date & Time</div>
                <div class="value">${new Date(record.initiatedAt).toLocaleString()}</div>
              </div>
              <div class="section">
                <div class="label">Payment Method</div>
                <div class="value">${record.paymentMethod}</div>
              </div>
            </div>

            <div class="section" style="border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 10px;">
              <div class="label">Counterparty</div>
              <div class="value">${record.counterpartyName}</div>
              <div style="font-size: 12px; color: #6b7280;">(${record.counterpartyId} - ${record.counterpartyType})</div>
            </div>

            <div class="total-box">
              <div class="total-row">
                <div style="font-weight: 600;">Inventory (Beans)</div>
                <div style="font-weight: 700; color: #7c3aed;">${record.beans.toLocaleString()}</div>
              </div>
              <div class="total-row" style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
                <div style="font-weight: 600;">Total Amount</div>
                <div style="font-size: 20px; font-weight: 800;">${formatCurrency(record.amount)}</div>
              </div>
            </div>

            <div class="footer">
              <p>This is a computer-generated digital receipt for GlobiLive Resellers.</p>
              <button onclick="window.print()" class="no-print" style="margin-top: 20px; padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print to PDF</button>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (typeFilter !== "all" && record.counterpartyType !== typeFilter) return false;
      if (directionFilter !== "all" && record.direction !== directionFilter) return false;
      if (paymentFilter !== "all" && record.paymentMethod !== paymentFilter) return false;
      if (proofFilter === "with-proof" && !record.slipUrl) return false;
      if (proofFilter === "missing-proof" && record.slipUrl) return false;

      if (fromDate) {
        const from = new Date(fromDate);
        if (new Date(record.initiatedAt) < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (new Date(record.initiatedAt) > to) return false;
      }

      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return [
        record.id,
        record.counterpartyId,
        record.counterpartyName,
        record.direction,
        record.paymentMethod,
        record.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    transactions,
    statusFilter,
    typeFilter,
    directionFilter,
    paymentFilter,
    proofFilter,
    fromDate,
    toDate,
    searchTerm,
  ]);

  const totals = useMemo(() => {
    const outbound = filteredTransactions.filter(
      (record) => record.direction === "Outbound to Customer"
    );
    const inbound = filteredTransactions.filter(
      (record) => record.direction === "Inbound from Top-Up Agent"
    );
    const outboundBeans = outbound.reduce((sum, record) => sum + record.beans, 0);
    const inboundBeans = inbound.reduce((sum, record) => sum + record.beans, 0);
    const outboundAmount = outbound.reduce((sum, record) => sum + record.amount, 0);
    const inboundAmount = inbound.reduce((sum, record) => sum + record.amount, 0);
    const pendingCount = filteredTransactions.filter(
      (record) => record.status !== "Completed"
    ).length;

    return {
      outboundBeans,
      inboundBeans,
      outboundAmount,
      inboundAmount,
      pendingCount,
    };
  }, [filteredTransactions]);

  return (
    <DashboardLayout role="reseller">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">Reseller Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor bean balances, view your profile, and audit every inbound and outbound transfer.
          </p>
        </div>

        <Alert variant="default" className="border-primary/40 bg-primary/5">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" /> Bean transactions only
          </AlertTitle>
          <AlertDescription className="text-sm">
            This portal is limited to buying beans from authorised top-up agents and selling them to users or hosts.
            Diamonds, cash withdrawals, and payout approvals remain under super admin and sub admin control.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Bean wallet balance"
            value={formatBeans(beanWalletBalance)}
            change="Updated in real-time"
            icon={Package}
            variant="primary"
          />
          <MetricCard
            title="Cash wallet (PKR)"
            value={formatCurrency(cashWalletBalance)}
            change="Bean sale proceeds"
            icon={Wallet}
            variant="success"
          />
          <MetricCard
            title="Month to date revenue"
            value={formatCurrency(monthToDateOutbound)}
            change="Beans sold (PKR)"
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Pending verifications"
            value={`${totals.pendingCount}`}
            change="Awaiting finance"
            icon={RefreshCw}
            variant="warning"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          <Card>
            <CardHeader>
              <CardTitle>Reseller profile</CardTitle>
              <CardDescription>
                Verified reseller identity and compliance checkpoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Reseller name</p>
                  <p className="font-semibold">{resellerProfile?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reseller code</p>
                  <p className="font-semibold">{resellerProfile?.code || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Primary contact</p>
                  <p className="font-semibold">{resellerProfile?.contact || resellerProfile?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-semibold">{resellerProfile?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-semibold">{resellerProfile?.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Region</p>
                  <p className="font-semibold">{resellerProfile?.region || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account created</p>
                  <p className="font-semibold">{resellerProfile?.createdAt ? new Date(resellerProfile.createdAt.seconds * 1000).toLocaleDateString() : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">License</p>
                  <p className="font-semibold">{resellerProfile?.license || "GLOBI-RES-ACTIVE"}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-sm">
                <div>
                  <p className="font-semibold">Compliance certified</p>
                  <p className="text-muted-foreground">Status: {resellerProfile?.status || "Active"}</p>
                </div>
                <Badge variant="outline" className="gap-2">
                  <ShieldCheck className="h-4 w-4" /> {resellerProfile?.status || "Active"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet snapshot</CardTitle>
              <CardDescription>Track beans moving in and out of inventory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="text-muted-foreground">Outbound beans (filtered)</p>
                  <p className="mt-1 text-lg font-semibold">{formatBeans(totals.outboundBeans)}</p>
                  <p className="text-xs text-muted-foreground">Value {formatCurrency(totals.outboundAmount)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="text-muted-foreground">Inbound beans (filtered)</p>
                  <p className="mt-1 text-lg font-semibold">{formatBeans(totals.inboundBeans)}</p>
                  <p className="text-xs text-muted-foreground">Value {formatCurrency(totals.inboundAmount)}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Purchase from top-up agent
                </Button>
                <Button className="w-full" variant="outline" onClick={handleDownloadStatement}>
                  <Download className="mr-2 h-4 w-4" /> Download statement
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Statements include every verified proof. Discrepancies should be raised within 24 hours.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
            <CardDescription>Slice your ledger by counterparty, status, payment method, or proof availability.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                  placeholder="Search by transaction, counterparty, status"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Counterparty</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All counterparties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Top-up agents, users & hosts</SelectItem>
                  <SelectItem value="Top-Up Agent">Top-up agents</SelectItem>
                  <SelectItem value="User">Users</SelectItem>
                  <SelectItem value="Host">Hosts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={directionFilter} onValueChange={(value) => setDirectionFilter(value as typeof directionFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Inbound & outbound</SelectItem>
                  <SelectItem value="Inbound from Top-Up Agent">Inbound from top-up agent</SelectItem>
                  <SelectItem value="Outbound to Customer">Outbound to customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as typeof paymentFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="Bank">Bank</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proof</Label>
              <Select value={proofFilter} onValueChange={(value) => setProofFilter(value as typeof proofFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All proofs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="with-proof">Proof attached</SelectItem>
                  <SelectItem value="missing-proof">Missing proof</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bean transfer history</CardTitle>
            <CardDescription>Complete log of purchases from top-up agents and sales to end users.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={filteredTransactions}
              pageSize={8}
              searchKeys={["id", "counterpartyId", "counterpartyName", "status"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Beans</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Proof</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(record) => {
                const icon =
                  record.counterpartyType === "Host" ? (
                    <Users className="h-4 w-4" />
                  ) : record.counterpartyType === "Top-Up Agent" ? (
                    <Building2 className="h-4 w-4" />
                  ) : (
                    <UserCircle className="h-4 w-4" />
                  );

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Badge variant="outline">{record.direction}</Badge>
                      {record.note && (
                        <p className="mt-1 text-xs text-muted-foreground">{record.note}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-medium">
                          {icon}
                          <span>{record.counterpartyName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {record.counterpartyId} • {record.counterpartyType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatBeans(record.beans)}</TableCell>
                    <TableCell>{formatCurrency(record.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.paymentMethod}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="space-y-1 text-xs text-muted-foreground">
                      <p>Initiated: {formatDateTime(record.initiatedAt)}</p>
                      <p>Settled: {record.settledAt ? formatDateTime(record.settledAt) : "Pending"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetailRecord(record)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }}
            />
          </CardContent>
        </Card>

        <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border">
            <div className="flex flex-col max-h-[90vh] bg-background">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">Transaction Details</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    {detailRecord
                      ? `${detailRecord.direction} • ${formatBeans(detailRecord.beans)}`
                      : ""}
                  </DialogDescription>
                </DialogHeader>

                {detailRecord && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-3 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Counterparty</p>
                        <p className="font-semibold text-sm">
                          {detailRecord.counterpartyName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">{detailRecord.counterpartyId}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Counterparty type</p>
                        <p className="font-semibold text-sm">{detailRecord.counterpartyType}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold uppercase text-primary/70 tracking-widest mb-1">Beans</p>
                        <p className="font-bold text-sm text-primary">{formatBeans(detailRecord.beans)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-success/5 border border-success/10">
                        <p className="text-[10px] font-bold uppercase text-success/70 tracking-widest mb-1">Amount</p>
                        <p className="font-bold text-sm text-success">{formatCurrency(detailRecord.amount)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Payment method</p>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3 text-muted-foreground" />
                          <p className="font-semibold text-sm">{detailRecord.paymentMethod}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Status</p>
                        <Badge variant={statusVariant[detailRecord.status]} className="text-[10px] uppercase">{detailRecord.status}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border-l-2 border-primary/20 pl-4 py-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">Timeline</p>
                        <ul className="space-y-2 text-xs">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Initiated:</span>
                            <span className="font-medium">{formatDateTime(detailRecord.initiatedAt)}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Settled:</span>
                            <span className="font-medium">{detailRecord.settledAt ? formatDateTime(detailRecord.settledAt) : "Pending"}</span>
                          </li>
                        </ul>
                      </div>

                      {detailRecord.note && (
                        <div className="p-3 rounded-xl bg-warning/5 border border-warning/10">
                          <p className="text-[10px] font-bold uppercase text-warning/70 tracking-widest mb-1">Note</p>
                          <p className="text-xs italic leading-relaxed text-foreground/80">"{detailRecord.note}"</p>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-muted/20 border border-muted-foreground/10 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Proof Attachment</p>
                          <p className="font-medium text-xs truncate max-w-[200px]">{detailRecord.slipName}</p>
                        </div>
                        <ShieldCheck className="h-5 w-5 text-success/60" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto h-11 px-6">Close</Button>
                </DialogClose>
                {detailRecord && (
                  <Button 
                    className="w-full sm:w-auto h-11 px-8 font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={() => handleViewSlip(detailRecord)}
                  >
                    <Download className="mr-2 h-4 w-4" /> View Slip
                  </Button>
                )}
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4" />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
