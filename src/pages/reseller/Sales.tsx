import { DashboardLayout } from "@/components/DashboardLayout";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { MetricCard } from "@/components/MetricCard";
import { toast } from "@/components/ui/use-toast";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Coins,
  Download,
  Eye,
  Filter,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  Wallet,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type BeanSaleStatus = "Completed" | "Pending Verification" | "Processing" | "Disputed";
type CustomerType = "User" | "Host";
type SaleDirection = "Sale to Customer" | "Purchase from Top-Up Agent";

type BeanSaleRecord = {
  id: string;
  direction: SaleDirection;
  customerId: string;
  customerName: string;
  customerType: CustomerType | "Top-Up Agent";
  beans: number;
  amountPKR: number;
  paymentMethod: "Bank" | "Wallet" | "Cash" | "EasyPaisa" | "JazzCash";
  initiatedAt: string;
  settledAt?: string;
  status: BeanSaleStatus;
  slipName: string;
  slipUrl?: string;
  note?: string;
};

// ─── Formatters ──────────────────────────────────────────────────────────────

const n = new Intl.NumberFormat("en-PK");
const dt = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" });
const formatBeans = (v: number) => `${n.format(v)} Beans`;
const formatPKR = (v: number) => `PKR ${n.format(v)}`;
const formatDateTime = (v?: string) => (v ? dt.format(new Date(v)) : "Pending");

const statusVariant: Record<BeanSaleStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    Completed: "default",
    "Pending Verification": "secondary",
    Processing: "outline",
    Disputed: "destructive",
  };

// ─── Seed Data ────────────────────────────────────────────────────────────────

const initialSales: BeanSaleRecord[] = [
  {
    id: "RSB-3071",
    direction: "Purchase from Top-Up Agent",
    customerId: "TPA-009",
    customerName: "GlobiLive Regional Ops",
    customerType: "Top-Up Agent",
    beans: 50000,
    amountPKR: 125000,
    paymentMethod: "Bank",
    initiatedAt: "2025-11-13T22:10:00Z",
    settledAt: "2025-11-13T22:40:00Z",
    status: "Completed",
    slipName: "Invoice_RSB-3071.pdf",
    note: "Monthly stock replenishment",
  },
  {
    id: "RSB-3069",
    direction: "Sale to Customer",
    customerId: "USR-5402",
    customerName: "Sasha Lin",
    customerType: "User",
    beans: 12000,
    amountPKR: 30000,
    paymentMethod: "EasyPaisa",
    initiatedAt: "2025-11-13T18:55:00Z",
    settledAt: "2025-11-13T19:10:00Z",
    status: "Completed",
    slipName: "Receipt_RSB-3069.jpg",
    note: "Creator bundle package",
  },
  {
    id: "RSB-3066",
    direction: "Sale to Customer",
    customerId: "HST-7720",
    customerName: "Mira Flores",
    customerType: "Host",
    beans: 22000,
    amountPKR: 55000,
    paymentMethod: "Bank",
    initiatedAt: "2025-11-12T15:20:00Z",
    status: "Pending Verification",
    slipName: "Receipt_RSB-3066.png",
    note: "Awaiting bank confirmation",
  },
  {
    id: "RSB-3060",
    direction: "Purchase from Top-Up Agent",
    customerId: "TPA-011",
    customerName: "Metro Bean Desk",
    customerType: "Top-Up Agent",
    beans: 30000,
    amountPKR: 72000,
    paymentMethod: "Wallet",
    initiatedAt: "2025-11-11T11:00:00Z",
    settledAt: "2025-11-11T11:25:00Z",
    status: "Completed",
    slipName: "Invoice_RSB-3060.pdf",
  },
  {
    id: "RSB-3055",
    direction: "Sale to Customer",
    customerId: "USR-5210",
    customerName: "Noah Peters",
    customerType: "User",
    beans: 6500,
    amountPKR: 16250,
    paymentMethod: "JazzCash",
    initiatedAt: "2025-11-10T19:40:00Z",
    settledAt: "2025-11-10T19:55:00Z",
    status: "Completed",
    slipName: "Receipt_RSB-3055.pdf",
  },
];

const beanBalance = 39500;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResellerBeanLedger() {
  const { toast: showToast } = toast as any;
  const [sales, setSales] = useState<BeanSaleRecord[]>(initialSales);
  const [detailRecord, setDetailRecord] = useState<BeanSaleRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeanSaleStatus | "all">("all");
  const [directionFilter, setDirectionFilter] = useState<SaleDirection | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // New sale form
  const [formCustomer, setFormCustomer] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formCustomerType, setFormCustomerType] = useState<CustomerType>("User");
  const [formBeans, setFormBeans] = useState("");
  const [formAmountPKR, setFormAmountPKR] = useState("");
  const [formPayment, setFormPayment] = useState<BeanSaleRecord["paymentMethod"]>("EasyPaisa");
  const [formSlip, setFormSlip] = useState<File | null>(null);
  const [formNote, setFormNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return sales.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (directionFilter !== "all" && r.direction !== directionFilter) return false;
      if (paymentFilter !== "all" && r.paymentMethod !== paymentFilter) return false;
      if (fromDate && new Date(r.initiatedAt) < new Date(fromDate)) return false;
      if (toDate && new Date(r.initiatedAt) > new Date(toDate)) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [r.id, r.customerId, r.customerName, r.status].join(" ").toLowerCase().includes(q);
    });
  }, [sales, statusFilter, directionFilter, paymentFilter, fromDate, toDate, search]);

  const totals = useMemo(() => {
    const sales_out = filtered.filter((r) => r.direction === "Sale to Customer");
    const purchases = filtered.filter((r) => r.direction === "Purchase from Top-Up Agent");
    return {
      soldBeans: sales_out.reduce((s, r) => s + r.beans, 0),
      soldPKR: sales_out.reduce((s, r) => s + r.amountPKR, 0),
      purchasedBeans: purchases.reduce((s, r) => s + r.beans, 0),
      pendingCount: filtered.filter((r) => r.status !== "Completed").length,
    };
  }, [filtered]);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleAddSale = () => {
    if (!formCustomer || !formCustomerId || !formBeans || !formAmountPKR) {
      toast({ title: "Missing fields", description: "Fill all required fields before submitting." });
      return;
    }
    if (!formSlip) {
      toast({ title: "Payment slip required", description: "Upload the transfer proof before recording." });
      return;
    }
    const slipUrl = URL.createObjectURL(formSlip);
    const record: BeanSaleRecord = {
      id: `RSB-${3072 + sales.length}`,
      direction: "Sale to Customer",
      customerId: formCustomerId,
      customerName: formCustomer,
      customerType: formCustomerType,
      beans: Number(formBeans),
      amountPKR: Number(formAmountPKR),
      paymentMethod: formPayment,
      initiatedAt: new Date().toISOString(),
      status: "Pending Verification",
      slipName: formSlip.name,
      slipUrl,
      note: formNote || undefined,
    };
    setSales((prev) => [record, ...prev]);
    setAddOpen(false);
    setFormCustomer(""); setFormCustomerId(""); setFormBeans(""); setFormAmountPKR(""); setFormNote(""); setFormSlip(null);
    toast({ title: "Sale recorded", description: `${formatBeans(record.beans)} issued to ${record.customerName}.` });
  };

  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      toast({ title: "No data", description: "No records match the current filters.", variant: "destructive" });
      return;
    }
    const headers = ["ID", "Direction", "Customer", "Customer ID", "Type", "Beans", "Amount (PKR)", "Payment", "Status", "Date"];
    const rows = filtered.map((r) => [r.id, r.direction, r.customerName, r.customerId, r.customerType, r.beans, r.amountPKR, r.paymentMethod, r.status, new Date(r.initiatedAt).toLocaleDateString()]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Reseller_Ledger_${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "Ledger exported", description: `${filtered.length} records downloaded as CSV.` });
  };

  const handleViewSlip = (record: BeanSaleRecord) => {
    if (record.slipUrl) { window.open(record.slipUrl, "_blank"); return; }
    toast({ title: "No slip attached", description: "This record has no uploaded proof." });
  };

  return (
    <DashboardLayout role="reseller">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bean Ledger</h2>
            <p className="text-muted-foreground mt-1">
              Complete log of bean purchases and sales — beans only, no diamonds or withdrawals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadCSV} className="h-11 px-5 gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => setAddOpen(true)} className="gradient-primary h-11 px-5 gap-2 shadow-lg shadow-primary/20 font-semibold">
              <PlusCircle className="h-4 w-4" /> New Bean Sale
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="border-primary/30 bg-primary/5">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Bean transactions only</AlertTitle>
          <AlertDescription className="text-xs">
            Resellers can only buy beans from authorised top-up agents and sell them to users/hosts via their mobile app.
            All diamond handling and cash withdrawals are managed by Super Admin and Sub Admins.
          </AlertDescription>
        </Alert>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Bean wallet balance" value={formatBeans(beanBalance)} change="Live inventory" icon={Package} variant="primary" />
          <MetricCard title="Beans sold (filtered)" value={formatBeans(totals.soldBeans)} change={formatPKR(totals.soldPKR)} icon={ArrowUpFromLine} variant="success" />
          <MetricCard title="Beans purchased (filtered)" value={formatBeans(totals.purchasedBeans)} change="From top-up agent" icon={ArrowDownToLine} variant="default" />
          <MetricCard title="Pending verifications" value={`${totals.pendingCount}`} change="Awaiting confirmation" icon={RefreshCw} variant="warning" />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" /> Filter Ledger
            </CardTitle>
            <CardDescription>Narrow down by direction, status, payment method or date range.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, customer name, status…" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="All directions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All directions</SelectItem>
                  <SelectItem value="Sale to Customer">Sale to Customer</SelectItem>
                  <SelectItem value="Purchase from Top-Up Agent">Purchase from Top-Up Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
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
              <Label>Payment method</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger><SelectValue placeholder="All methods" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                  <SelectItem value="JazzCash">JazzCash</SelectItem>
                  <SelectItem value="Wallet">Wallet</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Date range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bean Transfer History</CardTitle>
            <CardDescription>All inbound purchases and outbound sales with proof of payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={filtered}
              pageSize={8}
              searchKeys={["id", "customerName", "customerId", "status"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Beans</TableHead>
                    <TableHead>Amount (PKR)</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Proof</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(r: BeanSaleRecord) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground">{r.id}</TableCell>
                  <TableCell>
                    <Badge variant={r.direction === "Sale to Customer" ? "default" : "outline"} className="gap-1 text-[10px]">
                      {r.direction === "Sale to Customer"
                        ? <ArrowUpFromLine className="h-3 w-3" />
                        : <ArrowDownToLine className="h-3 w-3" />}
                      {r.direction === "Sale to Customer" ? "Sale" : "Purchase"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{r.customerName}</span>
                      <span className="text-[10px] text-muted-foreground">{r.customerId} · {r.customerType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{formatBeans(r.beans)}</TableCell>
                  <TableCell className="font-semibold">{formatPKR(r.amountPKR)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.paymentMethod}</TableCell>
                  <TableCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(r.initiatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setDetailRecord(r)}>
                      <Eye className="mr-2 h-3.5 w-3.5" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border">
            <div className="flex flex-col max-h-[90vh] bg-background">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl font-bold">Transaction Details</DialogTitle>
                  <DialogDescription>{detailRecord ? `${detailRecord.direction} · ${formatBeans(detailRecord.beans)}` : ""}</DialogDescription>
                </DialogHeader>
                {detailRecord && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Transaction ID", value: detailRecord.id },
                        { label: "Direction", value: detailRecord.direction },
                        { label: "Customer", value: detailRecord.customerName },
                        { label: "Customer ID", value: detailRecord.customerId },
                        { label: "Customer Type", value: detailRecord.customerType },
                        { label: "Payment Method", value: detailRecord.paymentMethod },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-muted/30 border border-muted-foreground/10 p-3">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
                          <p className="font-semibold text-sm">{value}</p>
                        </div>
                      ))}
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                        <p className="text-[10px] font-bold uppercase text-primary/70 tracking-widest mb-1">Beans</p>
                        <p className="font-bold text-primary">{formatBeans(detailRecord.beans)}</p>
                      </div>
                      <div className="rounded-xl bg-success/5 border border-success/10 p-3">
                        <p className="text-[10px] font-bold uppercase text-success/70 tracking-widest mb-1">Amount</p>
                        <p className="font-bold text-success">{formatPKR(detailRecord.amountPKR)}</p>
                      </div>
                    </div>

                    <div className="border-l-2 border-primary/20 pl-4 space-y-2 text-xs">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Timeline</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Initiated</span><span className="font-medium">{formatDateTime(detailRecord.initiatedAt)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Settled</span><span className="font-medium">{formatDateTime(detailRecord.settledAt)}</span></div>
                    </div>

                    {detailRecord.note && (
                      <div className="rounded-xl bg-warning/5 border border-warning/10 p-3">
                        <p className="text-[10px] font-bold uppercase text-warning/70 tracking-widest mb-1">Note</p>
                        <p className="text-xs italic">"{detailRecord.note}"</p>
                      </div>
                    )}

                    <div className="rounded-xl bg-muted/20 border border-muted-foreground/10 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Payment Proof</p>
                        <p className="font-medium text-xs truncate max-w-[240px]">{detailRecord.slipName}</p>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-success/60" />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto h-11 px-6">Close</Button>
                </DialogClose>
                {detailRecord && (
                  <Button className="w-full sm:w-auto h-11 px-8 font-bold" onClick={() => handleViewSlip(detailRecord)}>
                    <Eye className="mr-2 h-4 w-4" /> View Slip
                  </Button>
                )}
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4" />
          </DialogContent>
        </Dialog>

        {/* New Sale Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
            <div className="bg-muted/30 p-6 border-b border-border/40">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" /> New Bean Sale
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">
                  Record a bean sale to a user or host. Upload mandatory payment proof.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer Name</Label>
                  <Input placeholder="Full name" value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer ID</Label>
                  <Input placeholder="USR-1234" value={formCustomerId} onChange={(e) => setFormCustomerId(e.target.value)} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer Type</Label>
                <Select value={formCustomerType} onValueChange={(v) => setFormCustomerType(v as CustomerType)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Host">Host</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Beans</Label>
                  <Input type="number" placeholder="10000" value={formBeans} onChange={(e) => setFormBeans(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount (PKR)</Label>
                  <Input type="number" placeholder="25000" value={formAmountPKR} onChange={(e) => setFormAmountPKR(e.target.value)} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
                <Select value={formPayment} onValueChange={(v) => setFormPayment(v as any)}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EasyPaisa">EasyPaisa</SelectItem>
                    <SelectItem value="JazzCash">JazzCash</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                    <SelectItem value="Wallet">Wallet</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Note (optional)</Label>
                <Input placeholder="Any contextual details…" value={formNote} onChange={(e) => setFormNote(e.target.value)} className="h-11 rounded-xl" />
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  <span>Payment Proof / Slip</span>
                  <span className="text-[10px] text-destructive uppercase">Mandatory</span>
                </Label>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFormSlip(e.target.files?.[0] || null)} />
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed border-2 flex flex-col gap-2 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  {formSlip ? (
                    <><CheckCircle2 className="h-6 w-6 text-success" /><span className="text-xs font-bold truncate max-w-[220px]">{formSlip.name}</span></>
                  ) : (
                    <><UploadCloud className="h-6 w-6 text-muted-foreground" /><span className="text-xs font-bold text-muted-foreground">Click to upload transfer proof</span></>
                  )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">Accepted: JPG, PNG, PDF (Max 5 MB)</p>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/10 border-t gap-3">
              <DialogClose asChild>
                <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddSale} className="flex-1 gradient-primary rounded-xl font-bold h-11 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                Record Sale
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
