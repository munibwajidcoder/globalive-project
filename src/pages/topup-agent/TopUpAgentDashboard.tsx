import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query as fbQuery, where, orderBy, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { toast } from "@/components/ui/use-toast";
import {
  Wallet,
  Banknote,
  Coins,
  Percent,
  UploadCloud,
  Eye,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Package,
} from "lucide-react";
import { TopAgencies } from "@/components/TopAgencies";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type RequestStatus = "Completed" | "Pending Company Approval" | "Awaiting Payment Verification";

type BeanRequestRecord = {
  id: string;
  requestDate: string;
  beansRequested: number;
  walletSnapshot: number;
  paymentSent: number;
  beansReceived: number;
  receivedDate?: string;
  status: RequestStatus;
  slipName: string;
  slipUrl?: string;
  notes?: string;
};

const COMMISSION_RATE = 0.08; // 8% as per policy

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const beanFormatter = new Intl.NumberFormat("en-US");
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatBeans = (value: number) => `${beanFormatter.format(value)} beans`;
const formatDateTime = (value?: string) => (value ? dateTimeFormatter.format(new Date(value)) : "Pending");

const statusBadgeVariant: Record<RequestStatus, "default" | "secondary" | "outline"> = {
  Completed: "default",
  "Awaiting Payment Verification": "secondary",
  "Pending Company Approval": "outline",
};

// Removed initialRequests constants to use Firestore data

const generateRequestId = () => `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

export default function TopUpAgentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BeanRequestRecord[]>([]);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [beansInput, setBeansInput] = useState("");
  const [paymentInput, setPaymentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [detailRequest, setDetailRequest] = useState<BeanRequestRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createdSlipUrls = useRef<string[]>([]);

  useEffect(() => {
    if (!user?.username) return;

    // Fetch Agent Profile
    const profileQuery = fbQuery(collection(db, "globiliveTopUpAgents"), where("email", "==", user.username), limit(1));
    const unsubProfile = onSnapshot(profileQuery, (snapshot) => {
      if (!snapshot.empty) {
        setAgentProfile(snapshot.docs[0].data());
      }
    });

    // Fetch Requests
    const q = fbQuery(
        collection(db, "globiliveBeanRequests"), 
        where("agentEmail", "==", user.username),
        orderBy("requestDate", "desc")
    );
    const unsubRequests = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        requestDate: (d.data() as any).requestDate?.toDate?.()?.toISOString() || (d.data() as any).requestDate,
        receivedDate: (d.data() as any).receivedDate?.toDate?.()?.toISOString() || (d.data() as any).receivedDate,
      })) as BeanRequestRecord[];
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bean requests:", error);
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubRequests();
      createdSlipUrls.current.forEach((url) => URL.revokeObjectURL(url));
      createdSlipUrls.current = [];
    };
  }, [user]);

  const currentWalletBeans = agentProfile?.beans || 0;

  const totals = useMemo(() => {
    const totalBeansRequested = requests.reduce((sum, record) => sum + record.beansRequested, 0);
    const totalBeansReceived = requests.reduce((sum, record) => sum + record.beansReceived, 0);
    const totalPayments = requests.reduce((sum, record) => sum + record.paymentSent, 0);
    const totalCommission = requests.reduce((sum, record) => sum + record.paymentSent * COMMISSION_RATE, 0);
    const completed = requests.filter((record) => record.status === "Completed").length;
    return { totalBeansRequested, totalBeansReceived, totalPayments, totalCommission, completed };
  }, [requests]);

  const pendingCount = useMemo(
    () => requests.filter((record) => record.status !== "Completed").length,
    [requests],
  );

  const commissionPreview = useMemo(() => {
    const numeric = Number(paymentInput);
    return Number.isFinite(numeric) && !Number.isNaN(numeric) ? numeric * COMMISSION_RATE : 0;
  }, [paymentInput]);

  const resetForm = () => {
    setBeansInput("");
    setPaymentInput("");
    setNotesInput("");
    setSlipFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitRequest = async () => {
    const beansValue = parseInt(beansInput, 10);
    const paymentValue = parseFloat(paymentInput);

    if (!isFinite(beansValue) || isNaN(beansValue) || beansValue <= 0) {
      toast({ title: "Invalid beans quantity", description: "Enter how many beans you need." });
      return;
    }

    if (!isFinite(paymentValue) || isNaN(paymentValue) || paymentValue <= 0) {
      toast({ title: "Missing payment", description: "Enter the payment transferred." });
      return;
    }

    if (!slipFile) {
      toast({ title: "Transfer slip required", description: "Attach the proof." });
      return;
    }

    try {
        await addDoc(collection(db, "globiliveBeanRequests"), {
            agentEmail: user?.username,
            agentName: agentProfile?.name || user?.username,
            requestDate: serverTimestamp(),
            beansRequested: beansValue,
            walletSnapshot: currentWalletBeans,
            paymentSent: paymentValue,
            beansReceived: 0,
            status: "Awaiting Payment Verification",
            slipName: slipFile.name,
            notes: notesInput.trim() || "",
            createdAt: serverTimestamp()
        });

        toast({ title: "Request submitted", description: "Company admin has been alerted." });
        resetForm();
    } catch (err) {
        console.error("Submit request failed", err);
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
    }
  };

  const handleViewSlip = (record: BeanRequestRecord) => {
    // If the URL is a real Blob or a working external link, use it.
    // Otherwise (or if it's a known broken .example link), generate a professional document.
    const isPlaceholder = record.slipUrl?.includes(".example");
    
    if (record.slipUrl && !isPlaceholder) {
      window.open(record.slipUrl, "_blank");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Popup blocked", description: "Please allow popups to view the transfer slip.", variant: "destructive" });
      return;
    }

    const commissionAmount = record.paymentSent * COMMISSION_RATE;
    const totalAmount = record.paymentSent;

    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Slip - ${record.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 12px 20px 120px; background-color: #f1f5f9; color: #1e293b; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
            .receipt-card { 
               background: white; max-width: 580px; margin: 0 auto; 
               border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
               overflow: hidden; border: 1px solid #e2e8f0;
            }
            .brand-gradient { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); }
            @media print { body { background: white; padding: 0; } .receipt-card { box-shadow: none; border: 1px solid #eee; margin: 0; } .no-print { display: none; } }
            .btn-print { background: #7c3aed; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; margin-bottom: 20px; transition: opacity 0.2s; }
            .btn-print:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div style="text-align: center; width: 100%; position: fixed; top: 10px; z-index: 100;" class="no-print">
            <button class="btn-print" onclick="window.print()">Print Receipt</button>
          </div>
          <div class="receipt-card w-full">
            <div class="brand-gradient p-6 text-white text-center space-y-2">
               <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl mx-auto flex items-center justify-center border border-white/30">
                  <span class="text-xl font-black">GL</span>
               </div>
               <h1 class="text-xl font-bold tracking-tight">Globilive Network</h1>
               <div class="inline-flex px-3 py-1 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/20">Agent Refill Receipt</div>
            </div>

            <div class="p-6 sm:p-8 space-y-6">
               <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                  <div>
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Request ID</p>
                     <p class="text-lg font-mono font-bold text-slate-900">${record.id}</p>
                  </div>
                  <div class="text-right sm:text-right w-full sm:w-auto">
                     <p class="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-0.5">Submission Date</p>
                     <p class="text-xs font-semibold text-slate-700">${formatDateTime(record.requestDate)}</p>
                  </div>
               </div>
               <div class="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                  <div class="flex justify-between items-center text-sm">
                     <span class="font-medium text-slate-500">Beans Requested</span>
                     <span class="font-bold text-indigo-600">${beanFormatter.format(record.beansRequested)} Beans</span>
                  </div>
                  <div class="flex justify-between items-center text-sm">
                     <span class="font-medium text-slate-500">Sent Payment</span>
                     <span class="font-bold text-slate-900">${formatCurrency(record.paymentSent)}</span>
                  </div>
                  <div class="flex justify-between items-center border-t border-slate-200 pt-3">
                     <span class="font-semibold text-slate-900">Total Settlement</span>
                     <span class="text-lg font-black text-slate-900">${formatCurrency(record.paymentSent)}</span>
                  </div>
               </div>

               <div class="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wide">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Wallet Snapshot at request: ${beanFormatter.format(record.walletSnapshot)} Beans
               </div>

               <div class="pt-2 text-center space-y-3">
                  <div class="inline-flex items-center gap-1.5 text-indigo-600">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                     <span class="text-xs font-bold uppercase tracking-widest">Awaiting Verification</span>
                  </div>
                  <p class="text-[9px] text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                     This is a system-generated receipt. Assets are released only after rigorous verification of payment proof.
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
    printWindow.document.close();
  };

  return (
    <DashboardLayout role="topup-agent">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bean Request</h2>
          <p className="mt-1 text-muted-foreground">
            Pay the company admin, upload the transfer slip, and track every bean request you raise.
          </p>
        </div>

        <Alert variant="default" className="border-primary/40 bg-primary/5">
          <AlertTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" /> Bean transactions only
          </AlertTitle>
          <AlertDescription className="text-sm">
            Top-up agents maintain bean inventory for resellers and have no access to diamond controls or withdrawal
            approvals. Any withdrawal requests raised by users or hosts route directly to super admin and sub admin
            panels for settlement.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Current Wallet" value={formatBeans(currentWalletBeans)} icon={Wallet} variant="primary" />
          <MetricCard
            title="Total Beans Requested"
            value={formatBeans(totals.totalBeansRequested)}
            icon={Coins}
            variant="success"
          />
          <MetricCard
            title="Payments to Company"
            value={formatCurrency(totals.totalPayments)}
            icon={Banknote}
            variant="default"
          />
          <MetricCard
            title="Commission Earned"
            value={formatCurrency(totals.totalCommission)}
            change={pendingCount ? `Pending (${pendingCount})` : undefined}
            icon={Percent}
            variant="warning"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[360px,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Raise bean request</CardTitle>
              <CardDescription>
                Company commission policy: {Math.round(COMMISSION_RATE * 100)}% of your payment is earned back as agent
                commission. Every request must include a transfer slip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qty of beans required</label>
                <Input
                  type="number"
                  min={1}
                  value={beansInput}
                  onChange={(event) => setBeansInput(event.target.value)}
                  placeholder="e.g. 40,000"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment transferred to company admin (USD)</label>
                <Input
                  type="number"
                  min={1}
                  step="0.01"
                  value={paymentInput}
                  onChange={(event) => setPaymentInput(event.target.value)}
                  placeholder="e.g. 950"
                />
                <p className="text-xs text-muted-foreground">
                  Commission preview: {formatCurrency(commissionPreview)} (at {Math.round(COMMISSION_RATE * 100)}%).
                </p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="slip" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                   <span>Payment Screenshot</span>
                   <span className="text-[10px] text-destructive uppercase">Mandatory</span>
                </Label>
                <div className="relative group">
                   <Input 
                     id="slip" 
                     type="file" 
                     ref={fileInputRef}
                     onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                     className="hidden" 
                     accept="image/*,.pdf"
                   />
                   <Button 
                     variant="outline" 
                     className="w-full h-24 border-dashed border-2 flex flex-col gap-2 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all bg-muted/20"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {slipFile ? (
                        <>
                           <ShieldCheck className="h-6 w-6 text-success animate-bounce" />
                           <span className="text-xs font-bold text-foreground truncate max-w-[200px]">{slipFile.name}</span>
                        </>
                     ) : (
                        <>
                           <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                           <span className="text-xs font-bold text-muted-foreground">Click to upload transfer proof</span>
                        </>
                     )}
                   </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground italic">Required for verification by Company Admin.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes to company admin (optional)</label>
                <Textarea
                  rows={3}
                  placeholder="Mention campaign, urgency or settlement reference number."
                  value={notesInput}
                  onChange={(event) => setNotesInput(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={resetForm} className="sm:w-auto">
                  Reset
                </Button>
                <Button onClick={submitRequest} className="sm:w-auto">
                  Submit bean request
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request health</CardTitle>
              <CardDescription>Snapshot of your open tickets with the company admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open requests</span>
                  <Badge variant={pendingCount ? "secondary" : "default"}>{pendingCount}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold">{totals.completed}</span>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> All timestamps track both request and fulfilment moments for auditing.
                </p>
                <p>Keep your slips handy — finance will only release beans after verifying each payment.</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-1">
            <TopAgencies />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request history</CardTitle>
            <CardDescription>Every bean batch you've requested from the company admin, with slips and settlement status.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={requests}
              pageSize={6}
              searchKeys={["id", "status", "beansRequested", "paymentSent", "slipName"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Beans asked</TableHead>
                    <TableHead>Wallet snapshot</TableHead>
                    <TableHead>Payment sent</TableHead>
                    <TableHead>Beans received</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Proof</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(record) => {
                const commissionAmount = record.paymentSent * COMMISSION_RATE;
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{record.id}</span>
                        <Badge variant={statusBadgeVariant[record.status]}>{record.status}</Badge>
                        {record.notes && <p className="text-xs text-muted-foreground">{record.notes}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatBeans(record.beansRequested)}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatBeans(record.walletSnapshot)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(record.paymentSent)}</div>
                    </TableCell>
                    <TableCell>
                      {record.beansReceived > 0 ? (
                        <div>
                          <div className="font-medium text-success">{formatBeans(record.beansReceived)}</div>
                          <p className="text-xs text-muted-foreground">{formatDateTime(record.receivedDate)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Awaiting company release</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(commissionAmount)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Requested: {formatDateTime(record.requestDate)}</div>
                        <div>
                          Fulfilled: {record.beansReceived > 0 && record.receivedDate ? formatDateTime(record.receivedDate) : "Pending"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetailRequest(record)}>
                        <Eye className="mr-2 h-4 w-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }}
            />
          </CardContent>
        </Card>

        <Dialog open={Boolean(detailRequest)} onOpenChange={(open) => !open && setDetailRequest(null)}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border bg-background">
            <div className="flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">Bean request {detailRequest?.id}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    {detailRequest
                      ? `Requested ${formatBeans(detailRequest.beansRequested)} on ${formatDateTime(detailRequest.requestDate)}.`
                      : ""}
                  </DialogDescription>
                </DialogHeader>

                {detailRequest && (
                  <div className="space-y-8">
                    <div className="grid gap-6 sm:grid-cols-2">
                       <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/5 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Wallet snapshot</p>
                          <p className="text-lg font-bold">{formatBeans(detailRequest.walletSnapshot)}</p>
                       </div>
                       <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/5 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payment sent</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(detailRequest.paymentSent)}</p>
                       </div>
                       <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/5 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Beans received</p>
                          <p className="text-lg font-bold">{detailRequest.beansReceived ? formatBeans(detailRequest.beansReceived) : "Pending"}</p>
                       </div>
                       <div className="p-4 rounded-xl bg-muted/30 border border-muted-foreground/5 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Commission</p>
                          <p className="text-lg font-bold text-success">{formatCurrency(detailRequest.paymentSent * COMMISSION_RATE)}</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-l-2 border-primary pl-2 ml-1">Timeline</h4>
                       <div className="rounded-xl border p-4 space-y-3 bg-muted/5">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Request logged</span>
                             <span className="font-medium">{formatDateTime(detailRequest.requestDate)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-muted-foreground">Company approval</span>
                             <span className={detailRequest.beansReceived > 0 ? "font-medium text-success" : "text-muted-foreground italic"}>
                               {detailRequest.beansReceived > 0 && detailRequest.receivedDate ? formatDateTime(detailRequest.receivedDate) : "Pending Fulfillment"}
                             </span>
                          </div>
                       </div>
                    </div>

                    {detailRequest.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-l-2 border-primary pl-2 ml-1">Agent note</h4>
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 italic text-sm leading-relaxed">
                           "{detailRequest.notes}"
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-l-2 border-primary pl-2 ml-1">Transfer slip</h4>
                      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center">
                               <Banknote className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                               <p className="text-sm font-semibold truncate max-w-[200px]">{detailRequest.slipName}</p>
                               <p className="text-[10px] text-muted-foreground">Digital Transaction Record</p>
                            </div>
                         </div>
                         {!detailRequest.slipUrl && (
                           <span className="text-[10px] text-muted-foreground italic">stored offline</span>
                         )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setDetailRequest(null)} className="h-11 px-6 rounded-xl font-medium sm:flex-1 order-2 sm:order-1">
                  Close
                </Button>
                <Button 
                  onClick={() => detailRequest && handleViewSlip(detailRequest)}
                  className="h-11 px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex-1 order-1 sm:order-2"
                >
                  View Transfer Slip
                </Button>
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors sm:hidden" />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
