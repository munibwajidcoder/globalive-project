import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/components/ui/use-toast";
import {
  CalendarDays,
  Coins,
  Download,
  Eye,
  FileText,
  Package,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodStatus = "Submitted" | "Pending" | "Under Review";

type StatementRecord = {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  totalBeansSold: number;
  totalBeansReceived: number;
  totalRevenuePKR: number;
  netBeans: number;
  transactionCount: number;
  status: PeriodStatus;
  generatedAt: string;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedStatements: StatementRecord[] = [
  {
    id: "STMT-2025-11",
    period: "November 2025",
    periodStart: "2025-11-01",
    periodEnd: "2025-11-30",
    totalBeansSold: 40500,
    totalBeansReceived: 80000,
    totalRevenuePKR: 101250,
    netBeans: 39500,
    transactionCount: 14,
    status: "Pending",
    generatedAt: "2025-11-14T08:00:00Z",
  },
  {
    id: "STMT-2025-10",
    period: "October 2025",
    periodStart: "2025-10-01",
    periodEnd: "2025-10-31",
    totalBeansSold: 62000,
    totalBeansReceived: 70000,
    totalRevenuePKR: 155000,
    netBeans: 8000,
    transactionCount: 21,
    status: "Submitted",
    generatedAt: "2025-11-01T08:00:00Z",
  },
  {
    id: "STMT-2025-09",
    period: "September 2025",
    periodStart: "2025-09-01",
    periodEnd: "2025-09-30",
    totalBeansSold: 48000,
    totalBeansReceived: 55000,
    totalRevenuePKR: 120000,
    netBeans: 7000,
    transactionCount: 17,
    status: "Submitted",
    generatedAt: "2025-10-01T08:00:00Z",
  },
  {
    id: "STMT-2025-08",
    period: "August 2025",
    periodStart: "2025-08-01",
    periodEnd: "2025-08-31",
    totalBeansSold: 35000,
    totalBeansReceived: 40000,
    totalRevenuePKR: 87500,
    netBeans: 5000,
    transactionCount: 12,
    status: "Under Review",
    generatedAt: "2025-09-01T08:00:00Z",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const n = new Intl.NumberFormat("en-PK");
const dt = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" });
const formatBeans = (v: number) => `${n.format(v)} Beans`;
const formatPKR = (v: number) => `PKR ${n.format(v)}`;
const formatDate = (v: string) => dt.format(new Date(v));

const statusVariant: Record<PeriodStatus, "default" | "secondary" | "outline"> = {
  Submitted: "default",
  Pending: "secondary",
  "Under Review": "outline",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResellerStatements() {
  const [statements, setStatements] = useState<StatementRecord[]>(seedStatements);
  const [statusFilter, setStatusFilter] = useState<PeriodStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [detailRecord, setDetailRecord] = useState<StatementRecord | null>(null);

  const filtered = useMemo(() => {
    return statements.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      return r.period.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    });
  }, [statements, statusFilter, search]);

  const totals = useMemo(() => ({
    totalSold: statements.reduce((s, r) => s + r.totalBeansSold, 0),
    totalRevenuePKR: statements.reduce((s, r) => s + r.totalRevenuePKR, 0),
    periods: statements.length,
  }), [statements]);

  const downloadCSV = (record: StatementRecord) => {
    const headers = ["Field", "Value"];
    const rows = [
      ["Statement ID", record.id],
      ["Period", record.period],
      ["Period Start", record.periodStart],
      ["Period End", record.periodEnd],
      ["Beans Sold", record.totalBeansSold],
      ["Beans Received", record.totalBeansReceived],
      ["Net Beans", record.netBeans],
      ["Revenue (PKR)", record.totalRevenuePKR],
      ["Total Transactions", record.transactionCount],
      ["Status", record.status],
      ["Generated At", new Date(record.generatedAt).toLocaleDateString()],
    ];
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${record.id}_Statement.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Statement downloaded", description: `${record.id} exported to CSV.` });
  };

  const downloadAllCSV = () => {
    if (filtered.length === 0) {
      toast({ title: "No data", description: "No statements match the current filters.", variant: "destructive" });
      return;
    }
    const headers = ["ID", "Period", "Beans Sold", "Beans Received", "Net Beans", "Revenue (PKR)", "Transactions", "Status"];
    const rows = filtered.map((r) => [r.id, r.period, r.totalBeansSold, r.totalBeansReceived, r.netBeans, r.totalRevenuePKR, r.transactionCount, r.status]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reseller_All_Statements_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "All statements downloaded", description: `${filtered.length} periods exported.` });
  };

  const markAsSubmitted = (id: string) => {
    setStatements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Submitted" as PeriodStatus } : r))
    );
    toast({ title: "Statement submitted", description: "Marked as submitted to your top-up agent." });
  };

  return (
    <DashboardLayout role="reseller">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Statements</h2>
            <p className="text-muted-foreground mt-1">
              Monthly bean transaction summaries — download and submit to your top-up agent.
            </p>
          </div>
          <Button onClick={downloadAllCSV} className="gradient-primary h-11 px-5 gap-2 shadow-lg shadow-primary/20 font-semibold">
            <Download className="h-4 w-4" /> Export All
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Total beans sold" value={formatBeans(totals.totalSold)} change="All periods" icon={Package} variant="primary" />
          <MetricCard title="Total revenue" value={formatPKR(totals.totalRevenuePKR)} change="Bean sales only" icon={TrendingUp} variant="success" />
          <MetricCard title="Statement periods" value={`${totals.periods}`} change="Tracked monthly" icon={CalendarDays} variant="default" />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filter Statements</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Search by period or ID</Label>
              <Input placeholder="November 2025 or STMT-2025-11" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Monthly Bean Statements
            </CardTitle>
            <CardDescription>Bean-only summaries per billing period. No diamonds or cash withdrawals included.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={filtered}
              pageSize={8}
              searchKeys={["id", "period", "status"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Beans Sold</TableHead>
                    <TableHead>Beans In</TableHead>
                    <TableHead>Net Balance</TableHead>
                    <TableHead>Revenue (PKR)</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(r: StatementRecord) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground">{r.id}</TableCell>
                  <TableCell className="font-semibold text-sm">{r.period}</TableCell>
                  <TableCell className="text-primary font-bold">{formatBeans(r.totalBeansSold)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatBeans(r.totalBeansReceived)}</TableCell>
                  <TableCell>
                    <span className={r.netBeans > 0 ? "text-success font-bold" : "text-destructive font-bold"}>
                      {formatBeans(r.netBeans)}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">{formatPKR(r.totalRevenuePKR)}</TableCell>
                  <TableCell className="text-center">{r.transactionCount}</TableCell>
                  <TableCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDetailRecord(r)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadCSV(r)}>
                        <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                      </Button>
                      {r.status === "Pending" && (
                        <Button size="sm" className="gradient-primary font-semibold" onClick={() => markAsSubmitted(r.id)}>
                          Submit
                        </Button>
                      )}
                    </div>
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
                  <DialogTitle className="text-xl font-bold">Statement Details</DialogTitle>
                  <DialogDescription>{detailRecord?.period} · {detailRecord?.id}</DialogDescription>
                </DialogHeader>

                {detailRecord && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                        <p className="text-[10px] font-bold uppercase text-primary/70 tracking-widest mb-1 flex items-center gap-1"><Coins className="h-3 w-3" /> Beans Sold</p>
                        <p className="text-xl font-bold text-primary">{formatBeans(detailRecord.totalBeansSold)}</p>
                      </div>
                      <div className="rounded-xl bg-success/5 border border-success/10 p-4">
                        <p className="text-[10px] font-bold uppercase text-success/70 tracking-widest mb-1">Revenue (PKR)</p>
                        <p className="text-xl font-bold text-success">{formatPKR(detailRecord.totalRevenuePKR)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 border border-muted-foreground/10 p-4">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Beans Received In</p>
                        <p className="text-lg font-bold">{formatBeans(detailRecord.totalBeansReceived)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/30 border border-muted-foreground/10 p-4">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Net Bean Balance</p>
                        <p className={`text-lg font-bold ${detailRecord.netBeans > 0 ? "text-success" : "text-destructive"}`}>{formatBeans(detailRecord.netBeans)}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Statement ID", value: detailRecord.id },
                        { label: "Transactions", value: detailRecord.transactionCount.toString() },
                        { label: "Status", value: detailRecord.status },
                        { label: "Period Start", value: formatDate(detailRecord.periodStart) },
                        { label: "Period End", value: formatDate(detailRecord.periodEnd) },
                        { label: "Generated", value: formatDate(detailRecord.generatedAt) },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-muted/30 border p-3">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
                          <p className="font-semibold text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-muted-foreground/10 bg-muted/10 p-4 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">⚠️ Important Notice</p>
                      This statement covers bean transactions only. Diamond earnings and cash withdrawals are not handled by resellers — they are managed directly by Super Admin and Sub Admins on behalf of users and hosts.
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="p-6 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                  <Button variant="outline" className="w-full sm:w-auto h-11 px-6">Close</Button>
                </DialogClose>
                {detailRecord && (
                  <Button className="w-full sm:w-auto h-11 px-8 font-bold gradient-primary" onClick={() => downloadCSV(detailRecord)}>
                    <Download className="mr-2 h-4 w-4" /> Download CSV
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
