import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MiniAreaChart from "@/components/ui/MiniAreaChart";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Download, 
  FileText, 
  LayoutDashboard, 
  TrendingUp, 
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  CalendarDays
} from "lucide-react";

interface Report {
  id: number;
  period: string;
  resellers: number;
  totalVolume: string;
  status: "Processed" | "Pending" | "Rejected";
}

const initialReports: Report[] = [
  { id: 1, period: "2025-10", resellers: 24, totalVolume: "$24,560", status: "Processed" },
  { id: 2, period: "2025-09", resellers: 22, totalVolume: "$18,920", status: "Pending" },
  { id: 3, period: "2025-08", resellers: 28, totalVolume: "$31,200", status: "Processed" },
  { id: 4, period: "2025-07", resellers: 19, totalVolume: "$22,450", status: "Processed" },
];

export default function TopUpReports() {
  const [reports] = useState<Report[]>(initialReports);

  const statusVariant: Record<Report["status"], "default" | "secondary" | "destructive"> = {
    Processed: "default",
    Pending: "secondary",
    Rejected: "destructive",
  };

  const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((obj) => 
      Object.values(obj)
        .map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v)
        .join(",")
    ).join("\n");
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReport = (r: Report) => {
    const filename = `Globilive_Report_${r.period}.csv`;
    // Clean up the data for CSV
    const cleanData = {
      Id: r.id,
      Period: r.period,
      Resellers: r.resellers,
      "Total Volume": r.totalVolume.replace(/[$,]/g, ""),
      Status: r.status
    };
    exportToCSV([cleanData], filename);
    toast({ 
      title: "Export Success", 
      description: `Report for ${r.period} downloaded successfully.`,
      duration: 3000
    });
  };

  return (
    <DashboardLayout role="topup-agent">
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Statements</h2>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Monthly performance, commission and settlement reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden border-none shadow-2xl relative group bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900">
            <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110">
               <TrendingUp className="w-24 h-24 text-indigo-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Commission Earned
              </CardTitle>
              <CardDescription className="text-2xl font-black text-slate-900 dark:text-white">$12,450.00</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4 pt-4 border-t border-indigo-100/50 flex flex-col items-center">
                 <MiniAreaChart data={[200, 220, 210, 260, 300, 280, 320]} width={400} height={80} stroke="#4f46e5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-2xl relative group bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-slate-900">
            <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110">
               <LayoutDashboard className="w-24 h-24 text-purple-600" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-purple-600 flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Transaction Volume
              </CardTitle>
              <CardDescription className="text-2xl font-black text-slate-900 dark:text-white">$142,890.00</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-4 pt-4 border-t border-purple-100/50 flex flex-col items-center">
                 <MiniAreaChart data={[1500, 1400, 1600, 1700, 1650, 1800, 1900]} width={400} height={80} stroke="#7c3aed" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl dark:bg-slate-900/50">
          <CardHeader className="border-b bg-muted/5 p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" /> Report Ledger
                </CardTitle>
                <CardDescription className="mt-1">Access and download verified monthly cycles.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-background border rounded-2xl p-1.5 shadow-sm">
                <div className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">All Reports</div>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">YTD 2025</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnhancedTable
              data={reports}
              pageSize={10}
              searchKeys={["period", "status"]}
              columns={
                <TableHeader className="bg-muted/10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Period</TableHead>
                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-center">Resellers Active</TableHead>
                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Total Volume</TableHead>
                    <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                    <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(r: Report) => (
                <TableRow key={r.id} className="group hover:bg-muted/5 transition-colors border-b last:border-0 h-20">
                  <TableCell className="px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white tracking-tight">{r.period}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400">
                       <Users className="w-3.5 h-3.5" /> {r.resellers}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-indigo-600 dark:text-indigo-400">{r.totalVolume}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70 tracking-widest">Gross Settle</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]} className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-indigo-100">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-indigo-100 dark:border-indigo-950">
                        <DropdownMenuItem 
                          onSelect={() => exportReport(r)}
                          className="rounded-xl p-3 cursor-pointer group flex items-center gap-3 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-500/20 flex items-center justify-center text-indigo-600 group-hover:text-white">
                             <Download className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-sm">Export CSV</span>
                             <span className="text-[10px] opacity-70">Download for Microsoft Excel</span>
                          </div>
                        </DropdownMenuItem>
                        <div className="h-px bg-muted mx-1 my-1" />
                        <DropdownMenuItem className="rounded-xl p-3 cursor-pointer group flex items-center gap-3 hover:bg-muted/50 transition-all opacity-50">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <ShieldCheck className="h-4 w-4" />
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-sm">Audit details</span>
                             <span className="text-[10px] opacity-70">Internal verification log</span>
                           </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
