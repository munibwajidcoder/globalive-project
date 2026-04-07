import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  Eye,
  Filter,
  Search,
  UploadCloud,
  UserCircle,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileText
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TransferStatus = "Completed" | "Pending Verification" | "Processing" | "Rejected";
type BeneficiaryType = "User" | "Host" | "Reseller";
type TransactionDirection = "Reseller Purchase" | "Top-Up Agent Issuance";

type BeanTransferRecord = {
  id: string;
  resellerCode: string;
  resellerName: string;
  direction: TransactionDirection;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryType: BeneficiaryType;
  beansGranted: number;
  paymentAmount: number;
  paymentMethod: "Bank" | "Wallet" | "Cash";
  requestDate: string;
  fulfilmentDate?: string;
  status: TransferStatus;
  slipName: string;
  slipUrl?: string;
  note?: string;
};

const COMMISSION_RATE = 0.05;

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const formatBeans = (value: number) => `${numberFormatter.format(value)} beans`;
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatDateTime = (value?: string) => (value ? dateTimeFormatter.format(new Date(value)) : "Pending");

const statusVariant: Record<TransferStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Completed: "default",
  "Pending Verification": "secondary",
  Processing: "outline",
  Rejected: "destructive",
};

const initialTransfers: BeanTransferRecord[] = [
  {
    id: "BT-9218",
    resellerCode: "A001",
    resellerName: "Velocity Digital",
    direction: "Reseller Purchase",
    beneficiaryId: "RES-1101",
    beneficiaryName: "Velocity Digital Wallet",
    beneficiaryType: "Reseller",
    beansGranted: 28000,
    paymentAmount: 620,
    paymentMethod: "Bank",
    requestDate: "2025-11-14T02:15:00Z",
    fulfilmentDate: "2025-11-14T02:45:00Z",
    status: "Completed",
    slipName: "TransferSlip_BT-9218.pdf",
    slipUrl: "https://assets.globilive.example/slips/TransferSlip_BT-9218.pdf",
    note: "Monthly reseller replenishment",
  },
  {
    id: "BT-9217",
    resellerCode: "A003",
    resellerName: "Nova Promotions",
    direction: "Reseller Purchase",
    beneficiaryId: "RES-1103",
    beneficiaryName: "Nova Promotions",
    beneficiaryType: "Reseller",
    beansGranted: 12000,
    paymentAmount: 265,
    paymentMethod: "Wallet",
    requestDate: "2025-11-13T21:05:00Z",
    status: "Pending Verification",
    slipName: "TransferSlip_BT-9217.png",
    note: "Awaiting wallet settlement screenshot",
  },
  {
    id: "BT-9215",
    resellerCode: "A001",
    resellerName: "Velocity Digital",
    direction: "Top-Up Agent Issuance",
    beneficiaryId: "USR-1321",
    beneficiaryName: "Amira Farooq",
    beneficiaryType: "User",
    beansGranted: 12500,
    paymentAmount: 280,
    paymentMethod: "Bank",
    requestDate: "2025-11-13T13:45:00Z",
    fulfilmentDate: "2025-11-13T14:15:00Z",
    status: "Completed",
    slipName: "TransferSlip_BT-9215.pdf",
    slipUrl: "https://assets.globilive.example/slips/TransferSlip_BT-9215.pdf",
    note: "November promo top-up",
  },
  {
    id: "BT-9214",
    resellerCode: "A002",
    resellerName: "Luminous Streams",
    direction: "Top-Up Agent Issuance",
    beneficiaryId: "HST-8842",
    beneficiaryName: "Liu Mei",
    beneficiaryType: "Host",
    beansGranted: 32000,
    paymentAmount: 720,
    paymentMethod: "Wallet",
    requestDate: "2025-11-12T18:25:00Z",
    fulfilmentDate: "2025-11-12T19:10:00Z",
    status: "Completed",
    slipName: "TransferSlip_BT-9214.jpg",
    slipUrl: "https://assets.globilive.example/slips/TransferSlip_BT-9214.jpg",
  },
  {
    id: "BT-9213",
    resellerCode: "A001",
    resellerName: "Velocity Digital",
    direction: "Top-Up Agent Issuance",
    beneficiaryId: "USR-1288",
    beneficiaryName: "Carlos Mendez",
    beneficiaryType: "User",
    beansGranted: 8500,
    paymentAmount: 190,
    paymentMethod: "Bank",
    requestDate: "2025-11-12T09:10:00Z",
    status: "Pending Verification",
    slipName: "TransferSlip_BT-9213.png",
    note: "Awaiting bank confirmation",
  },
  {
    id: "BT-9212",
    resellerCode: "A003",
    resellerName: "Nova Promotions",
    direction: "Top-Up Agent Issuance",
    beneficiaryId: "HST-8700",
    beneficiaryName: "Jade Winters",
    beneficiaryType: "Host",
    beansGranted: 5000,
    paymentAmount: 110,
    paymentMethod: "Cash",
    requestDate: "2025-11-11T16:35:00Z",
    fulfilmentDate: "2025-11-11T17:50:00Z",
    status: "Processing",
    slipName: "Receipt_BT-9212.pdf",
  },
  {
    id: "BT-9211",
    resellerCode: "A002",
    resellerName: "Luminous Streams",
    direction: "Top-Up Agent Issuance",
    beneficiaryId: "USR-1201",
    beneficiaryName: "Noor Al Sabah",
    beneficiaryType: "User",
    beansGranted: 15000,
    paymentAmount: 330,
    paymentMethod: "Bank",
    requestDate: "2025-11-10T11:05:00Z",
    fulfilmentDate: "2025-11-10T12:20:00Z",
    status: "Rejected",
    slipName: "TransferSlip_BT-9211.pdf",
    note: "Payment reversed by bank. Awaiting re-submission.",
  },
];

const generateTransferId = () => `BT-${Math.floor(1000 + Math.random() * 9000)}`;

export default function TopUpTransactions() {
  const [transfers, setTransfers] = useState<BeanTransferRecord[]>(initialTransfers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<BeneficiaryType | "all">("all");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<BeanTransferRecord["paymentMethod"] | "all">("all");
  const [directionFilter, setDirectionFilter] = useState<TransactionDirection | "all">("all");
  const [proofFilter, setProofFilter] = useState<"all" | "with-proof" | "missing-proof">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [detailRecord, setDetailRecord] = useState<BeanTransferRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resellerCode, setResellerCode] = useState("");
  const [resellerName, setResellerName] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("Reseller Purchase");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>("User");
  const [beansGranted, setBeansGranted] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BeanTransferRecord["paymentMethod"]>("Bank");
  const [noteInput, setNoteInput] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdSlipUrls = useRef<string[]>([]);

  useEffect(() => () => {
    createdSlipUrls.current.forEach((url) => URL.revokeObjectURL(url));
    createdSlipUrls.current = [];
  }, []);

  const resellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    transfers.forEach((record) => {
      if (!map.has(record.resellerCode)) {
        map.set(record.resellerCode, record.resellerName);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [transfers]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (typeFilter !== "all" && record.beneficiaryType !== typeFilter) return false;
      if (resellerFilter !== "all" && record.resellerCode !== resellerFilter) return false;
      if (paymentFilter !== "all" && record.paymentMethod !== paymentFilter) return false;
      if (directionFilter !== "all" && record.direction !== directionFilter) return false;
      if (proofFilter === "with-proof" && !record.slipUrl) return false;
      if (proofFilter === "missing-proof" && record.slipUrl) return false;

      if (fromDate) {
        const from = new Date(fromDate);
        if (new Date(record.requestDate) < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        if (new Date(record.requestDate) > to) return false;
      }

      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return [
        record.id,
        record.resellerCode,
        record.resellerName,
        record.beneficiaryId,
        record.beneficiaryName,
        record.paymentMethod,
        record.status,
        record.direction,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    transfers,
    statusFilter,
    typeFilter,
    resellerFilter,
    paymentFilter,
    directionFilter,
    proofFilter,
    fromDate,
    toDate,
    searchTerm,
  ]);

  const totals = useMemo(() => {
    const overallBeans = filteredTransfers.reduce((sum, record) => sum + record.beansGranted, 0);
    const overallPayments = filteredTransfers.reduce((sum, record) => sum + record.paymentAmount, 0);
    const overallCommission = overallPayments * COMMISSION_RATE;
    const completedCount = filteredTransfers.filter((record) => record.status === "Completed").length;
    const uniqueResellers = new Set(filteredTransfers.map((record) => record.resellerCode)).size;
    return { overallBeans, overallPayments, overallCommission, completedCount, uniqueResellers };
  }, [filteredTransfers]);

  const resetCreateForm = () => {
    setResellerCode("");
    setResellerName("");
    setDirection("Reseller Purchase");
    setBeneficiaryId("");
    setBeneficiaryName("");
    setBeneficiaryType("User");
    setBeansGranted("");
    setPaymentAmount("");
    setPaymentMethod("Bank");
    setNoteInput("");
    setSlipFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const commissionPreview = useMemo(() => {
    const numeric = Number(paymentAmount);
    return Number.isFinite(numeric) && !Number.isNaN(numeric) ? numeric * COMMISSION_RATE : 0;
  }, [paymentAmount]);

  const submitTransfer = () => {
    const beansNumeric = Number.parseInt(beansGranted, 10);
    const paymentNumeric = Number.parseFloat(paymentAmount);

    if (!resellerCode.trim() || !resellerName.trim()) {
      toast({ title: "Reseller details required", description: "Provide the reseller code and name." });
      return;
    }

    if (!beneficiaryId.trim()) {
      toast({ title: "Beneficiary ID required", description: "Capture the user, host, or reseller ID for auditing." });
      return;
    }

    if (!beneficiaryName.trim()) {
      toast({ title: "Name missing", description: "Add the beneficiary name." });
      return;
    }

    if (!Number.isFinite(beansNumeric) || beansNumeric <= 0) {
      toast({ title: "Invalid bean quantity", description: "Enter how many beans were granted." });
      return;
    }

    if (!Number.isFinite(paymentNumeric) || paymentNumeric <= 0) {
      toast({ title: "Invalid payment", description: "Enter the amount received for the beans." });
      return;
    }

    if (!slipFile) {
      toast({ title: "Transfer slip required", description: "Attach the bank receipt or screenshot." });
      return;
    }

    const slipUrl = URL.createObjectURL(slipFile);
    createdSlipUrls.current.push(slipUrl);

    const newRecord: BeanTransferRecord = {
      id: generateTransferId(),
      resellerCode: resellerCode.trim(),
      resellerName: resellerName.trim(),
      direction,
      beneficiaryId: beneficiaryId.trim(),
      beneficiaryName: beneficiaryName.trim(),
      beneficiaryType,
      beansGranted: beansNumeric,
      paymentAmount: paymentNumeric,
      paymentMethod,
      requestDate: new Date().toISOString(),
      status: "Pending Verification",
      slipName: slipFile.name,
      slipUrl,
      note: noteInput.trim() || undefined,
    };

    setTransfers((prev) => [newRecord, ...prev]);
    toast({ title: "Transfer recorded", description: "Finance will verify the slip and release beans." });
    resetCreateForm();
    setCreateOpen(false);
  };

  const handleViewSlip = (record: BeanTransferRecord) => {
    const slipWindow = window.open('', '_blank');
    if (!slipWindow) return;

    const commission = record.paymentAmount * COMMISSION_RATE;
    const dateStr = record.fulfilmentDate ? formatDateTime(record.fulfilmentDate) : formatDateTime(record.requestDate);
    
    slipWindow.document.write(`
      <html>
        <head>
          <title>Transfer Receipt - ${record.id}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: #f1f5f9; padding: 12px 20px 120px; margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
            .receipt-card { 
               background: white; max-width: 580px; margin: 0 auto; 
               border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
               overflow: hidden; border: 1px solid #e2e8f0;
            }
            .brand-gradient { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); }
            @media print { body { background: white; padding: 0; } .receipt-card { box-shadow: none; border: 1px solid #eee; margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="receipt-card w-full">
            <div class="brand-gradient p-6 text-white text-center space-y-2">
               <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl mx-auto flex items-center justify-center border border-white/30">
                  <span class="text-xl font-black">GL</span>
               </div>
               <h1 class="text-xl font-bold tracking-tight">Globilive Network</h1>
               <div class="inline-flex px-3 py-1 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/20">Official Transfer Receipt</div>
            </div>

            <div class="p-6 sm:p-8 space-y-6">
               <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                  <div>
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Transaction ID</p>
                     <p class="text-lg font-mono font-bold text-slate-900">${record.id}</p>
                  </div>
                  <div class="text-right sm:text-right w-full sm:w-auto">
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Issue Date</p>
                     <p class="text-xs font-semibold text-slate-700">${dateStr}</p>
                  </div>
               </div>

               <div class="grid grid-cols-2 gap-6 py-1">
                  <div class="space-y-0.5">
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400">Reseller</p>
                     <p class="text-sm font-bold text-slate-900 line-clamp-1">${record.resellerName}</p>
                     <p class="text-[10px] text-slate-500 font-medium">${record.resellerCode}</p>
                  </div>
                  <div class="space-y-0.5 text-right">
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400">Beneficiary</p>
                     <p class="text-sm font-bold text-slate-900 line-clamp-1">${record.beneficiaryName}</p>
                     <p class="text-[10px] text-slate-500 font-medium">${record.beneficiaryId} • ${record.beneficiaryType}</p>
                  </div>
               </div>

               <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                  <div class="flex justify-between items-center text-sm">
                     <span class="font-medium text-slate-500">Beans Quantity</span>
                     <span class="font-bold text-indigo-600">${numberFormatter.format(record.beansGranted)} Beans</span>
                  </div>
                  <div class="flex justify-between items-center text-sm">
                     <span class="font-medium text-slate-500">Payment Amount</span>
                     <span class="font-bold text-slate-900">${formatCurrency(record.paymentAmount)}</span>
                  </div>
                  <div class="flex justify-between items-center border-t border-slate-200 pt-3">
                     <span class="font-semibold text-slate-900">Total Settlement</span>
                     <span class="text-lg font-black text-slate-900">${formatCurrency(record.paymentAmount)}</span>
                  </div>
               </div>

               <div class="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wide">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Channel: ${record.direction} (${record.paymentMethod})
               </div>

               <div class="pt-2 text-center space-y-3">
                  <div class="inline-flex items-center gap-1.5 text-emerald-600">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                     <span class="text-xs font-bold uppercase tracking-widest">Transaction Verified</span>
                  </div>
                  <p class="text-[9px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                     Digital receipt generated from Globilive Core. Assets released after payment verification.
                  </p>
               </div>
            </div>

            <div class="bg-slate-50 p-5 no-print flex flex-col sm:flex-row gap-2.5 border-t">
               <button onclick="window.print()" class="flex-1 bg-slate-900 text-white rounded-lg py-2.5 text-xs font-bold shadow-md hover:bg-slate-800 transition-all">Print Receipt</button>
               <button onclick="window.close()" class="flex-1 bg-white border border-slate-200 text-slate-600 rounded-lg py-2.5 text-xs font-bold hover:bg-slate-50 transition-all">Close</button>
            </div>
          </div>
        </body>
      </html>
    `);
    slipWindow.document.close();
  };

  return (
    <DashboardLayout role="topup-agent">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold">Bean Transfers</h2>
          <p className="text-muted-foreground">
            Every transaction between your resellers and their users or hosts with payment proofs attached.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Beans dispatched</CardTitle>
              <CardDescription>Filtered total</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">{formatBeans(totals.overallBeans)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Payments collected</CardTitle>
              <CardDescription>Across filtered transfers</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">{formatCurrency(totals.overallPayments)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Commission (policy {Math.round(COMMISSION_RATE * 100)}%)</CardTitle>
              <CardDescription>Pending + received</CardDescription>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between pt-0">
              <p className="text-2xl font-bold">{formatCurrency(totals.overallCommission)}</p>
              <Badge variant={totals.completedCount ? "default" : "secondary"}>{totals.completedCount} settled</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Resellers in view</CardTitle>
              <CardDescription>Unique resellers filtered</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">{totals.uniqueResellers}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" /> Filters
            </CardTitle>
            <CardDescription>Apply granular filters across resellers, beneficiaries, timeline, and proofs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                  placeholder="Search by transfer, reseller, beneficiary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Beneficiary type</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Users, hosts & resellers</SelectItem>
                  <SelectItem value="User">Users</SelectItem>
                  <SelectItem value="Host">Hosts</SelectItem>
                  <SelectItem value="Reseller">Resellers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reseller</Label>
              <Select value={resellerFilter} onValueChange={(value) => setResellerFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All resellers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resellers</SelectItem>
                  {resellerOptions.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.code} · {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment method</Label>
              <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as typeof paymentFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
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
              <Label className="text-sm font-medium">Channel</Label>
              <Select value={directionFilter} onValueChange={(value) => setDirectionFilter(value as typeof directionFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="Reseller Purchase">Reseller purchases</SelectItem>
                  <SelectItem value="Top-Up Agent Issuance">Agent issuances</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Proof</Label>
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
              <Label className="text-sm font-medium">Date range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {filteredTransfers.length} transfers in view
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            Log bean transfer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transfer register</CardTitle>
            <CardDescription>Complete ledger of reseller purchases and agent issuances with proofs on file.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={filteredTransfers}
              pageSize={8}
              searchKeys={["id", "beneficiaryId", "beneficiaryName", "status", "resellerCode", "resellerName"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Reseller</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Beans</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Proof</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(record) => {
                const icon = record.beneficiaryType === "Host" ? <Users className="h-4 w-4" /> : record.beneficiaryType === "Reseller" ? <Building2 className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />;
                const commission = record.paymentAmount * COMMISSION_RATE;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-semibold">{record.resellerName}</span>
                        <span className="text-xs text-muted-foreground">{record.resellerCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.direction}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 font-medium">
                          {icon}
                          <span>{record.beneficiaryName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{record.beneficiaryId} • {record.beneficiaryType}</div>
                        {record.note && <p className="text-xs text-muted-foreground">{record.note}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-primary">{formatBeans(record.beansGranted)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(record.paymentAmount)}</div>
                      <p className="text-xs text-muted-foreground">{record.paymentMethod} transfer</p>
                    </TableCell>
                    <TableCell>{formatCurrency(commission)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="space-y-1 text-xs text-muted-foreground">
                      <p>Requested: {formatDateTime(record.requestDate)}</p>
                      <p>Fulfilled: {record.fulfilmentDate ? formatDateTime(record.fulfilmentDate) : "Pending"}</p>
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
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border bg-background">
            <div className="flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant[detailRecord?.status || "Processing"]} className="rounded-lg font-bold text-[10px] uppercase">
                      {detailRecord?.status}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">Transfer {detailRecord?.id}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base font-medium text-primary flex items-center gap-2 flex-wrap">
                    {detailRecord?.resellerName}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {detailRecord?.beneficiaryName}
                  </DialogDescription>
                </DialogHeader>

                {detailRecord && (
                  <div className="space-y-8 text-sm">
                    <div className="grid gap-6 sm:grid-cols-2">
                       <div className="p-5 rounded-2xl bg-muted/30 border border-muted-foreground/5 space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                             <Users className="h-3.5 w-3.5" /> <span>Participants</span>
                          </div>
                          <div className="space-y-3">
                             <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground">Reseller</span>
                                <span className="font-bold">{detailRecord.resellerName}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{detailRecord.resellerCode}</span>
                             </div>
                             <div className="flex flex-col border-t pt-3">
                                <span className="text-[10px] text-muted-foreground">Beneficiary</span>
                                <span className="font-bold">{detailRecord.beneficiaryName}</span>
                                <span className="text-[10px] text-muted-foreground">{detailRecord.beneficiaryId} • {detailRecord.beneficiaryType}</span>
                             </div>
                          </div>
                       </div>

                       <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                             <ShieldCheck className="h-3.5 w-3.5" /> <span>Financial Snapshot</span>
                          </div>
                          <div className="space-y-3">
                             <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Beans Released</span>
                                <span className="font-bold text-primary">{formatBeans(detailRecord.beansGranted)}</span>
                             </div>
                             <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Payment Amount</span>
                                <span className="font-bold">{formatCurrency(detailRecord.paymentAmount)}</span>
                             </div>
                             <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-muted-foreground/5">
                                <span className="text-xs text-muted-foreground">Estimated Commission</span>
                                <span className="font-bold">{formatCurrency(detailRecord.paymentAmount * COMMISSION_RATE)}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground pl-1">Process Analytics</h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                           <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Receipt className="h-4 w-4 text-muted-foreground" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase">Payment Channel</span>
                              <span className="font-medium text-sm">{detailRecord.direction} ({detailRecord.paymentMethod})</span>
                           </div>
                        </div>
                        <div className="flex items-start gap-3">
                           <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-bold uppercase">Transaction Timeline</span>
                              <div className="text-xs space-y-0.5">
                                 <p><span className="text-muted-foreground italic">Requested:</span> {formatDateTime(detailRecord.requestDate)}</p>
                                 <p><span className="text-muted-foreground italic">Fulfilled:</span> {detailRecord.fulfilmentDate ? formatDateTime(detailRecord.fulfilmentDate) : "Awaiting Verification"}</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {detailRecord.note && (
                      <div className="p-4 rounded-xl bg-muted/40 border-l-4 border-muted-foreground/20 italic text-muted-foreground">
                        <p className="text-[10px] uppercase font-bold not-italic mb-1 opacity-50">Auditor's Note</p>
                        "{detailRecord.note}"
                      </div>
                    )}

                    <div className="p-4 rounded-2xl border-2 border-dashed bg-muted/5 space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" /> <span>Proof of Settlement</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="font-mono text-xs">{detailRecord.slipName}</span>
                          {!detailRecord.slipUrl && (
                            <span className="text-[10px] text-orange-600 font-bold uppercase bg-orange-100 px-2 py-0.5 rounded-full">Offline Record</span>
                          )}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setDetailRecord(null)} className="h-11 px-6 rounded-xl font-medium sm:flex-1 order-2 sm:order-1">
                  Close
                </Button>
                <Button 
                  onClick={() => detailRecord && handleViewSlip(detailRecord)}
                  className="h-11 px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex-1 order-1 sm:order-2 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 active:scale-95"
                >
                  <FileText className="mr-2 h-4 w-4" /> View Digital Receipt
                </Button>
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors sm:hidden" />
          </DialogContent>
        </Dialog>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogContent className="max-w-xl p-0 overflow-hidden border-none sm:border rounded-2xl shadow-2xl">
            <div className="flex flex-col max-h-[85vh]">
              <div className="p-6 pb-0">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Log bean transfer</DialogTitle>
                  <DialogDescription>Capture reseller payment, beans released, and the supporting slip.</DialogDescription>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reseller-code">Reseller code</Label>
                      <Input
                        id="reseller-code"
                        value={resellerCode}
                        onChange={(event) => setResellerCode(event.target.value)}
                        placeholder="e.g. A001"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reseller-name">Reseller name</Label>
                      <Input
                        id="reseller-name"
                        value={resellerName}
                        onChange={(event) => setResellerName(event.target.value)}
                        placeholder="Company name"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select value={direction} onValueChange={(value) => setDirection(value as TransactionDirection)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Reseller Purchase">Reseller Purchase</SelectItem>
                          <SelectItem value="Top-Up Agent Issuance">Top-Up Agent Issuance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary-id">Beneficiary ID</Label>
                      <Input
                        id="beneficiary-id"
                        value={beneficiaryId}
                        onChange={(event) => setBeneficiaryId(event.target.value)}
                        placeholder="USR-0000 / HST-0000 / RES-0000"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="beneficiary-name">Beneficiary name</Label>
                      <Input
                        id="beneficiary-name"
                        value={beneficiaryName}
                        onChange={(event) => setBeneficiaryName(event.target.value)}
                        placeholder="Full name or wallet"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Beneficiary type</Label>
                      <Select value={beneficiaryType} onValueChange={(value) => setBeneficiaryType(value as BeneficiaryType)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Host">Host</SelectItem>
                          <SelectItem value="Reseller">Reseller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="beans-granted">Beans granted</Label>
                      <Input
                        id="beans-granted"
                        type="number"
                        min={1}
                        value={beansGranted}
                        onChange={(event) => setBeansGranted(event.target.value)}
                        placeholder="e.g. 12,000"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-amount">Payment amount (USD)</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        min={1}
                        step="0.01"
                        value={paymentAmount}
                        onChange={(event) => setPaymentAmount(event.target.value)}
                        placeholder="e.g. 250"
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground pl-1">Commission preview: {formatCurrency(commissionPreview)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment method</Label>
                    <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as BeanTransferRecord["paymentMethod"])}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Wallet">Wallet</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-slip">Transfer slip / screenshot</Label>
                    <Input
                      ref={fileInputRef}
                      id="transfer-slip"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => setSlipFile(event.target.files?.[0] ?? null)}
                      className="rounded-xl cursor-pointer"
                    />
                    {slipFile ? (
                      <p className="flex items-center gap-2 text-xs text-indigo-600 font-medium pl-1">
                        <UploadCloud className="h-3.5 w-3.5" /> {slipFile.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground pl-1">Proof is mandatory before saving the transaction.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Internal note (optional)</Label>
                    <Textarea
                      id="note"
                      rows={3}
                      placeholder="Campaign, promo code, or settlement reference"
                      value={noteInput}
                      onChange={(event) => setNoteInput(event.target.value)}
                      className="rounded-xl resize-none"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-xl flex-1">Cancel</Button>
                </DialogClose>
                <Button onClick={submitTransfer} className="rounded-xl flex-1 bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 transition-all shadow-md">Save transfer</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
