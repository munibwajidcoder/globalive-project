import { useEffect, useState } from "react";
import { collection, onSnapshot, query as fbQuery, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertCircle, 
  Smartphone, 
  Globe, 
  User, 
  Download,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

type LogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  status: "Success" | "Failed" | "Warning";
  ipAddress: string;
  device: string;
};

// Seed data removed for Firestore integration

export default function CompanyLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = fbQuery(collection(db, "globilivePlatformAuditLogs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: (d.data() as any).timestamp?.toDate?.()?.toLocaleString() || (d.data() as any).timestamp
        })) as LogEntry[];
        setLogs(list);
        setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground mt-1">Monitor all platform activity and system changes</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-11 px-6 rounded-xl border-border/60 hover:bg-muted/50 gap-2">
                <Calendar className="h-4 w-4" /> Export Period
             </Button>
             <Button className="h-11 px-6 rounded-xl gradient-primary shadow-lg shadow-primary/20 gap-2">
                <Download className="h-4 w-4" /> Download CSV
             </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
           <Card className="border-none shadow-premium bg-card/50">
              <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Events (24h)</p>
                       <p className="text-3xl font-bold mt-1">1,284</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                       <History className="h-6 w-6 text-primary" />
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-premium bg-card/50">
              <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Security Alerts</p>
                       <p className="text-3xl font-bold mt-1 text-warning">12</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-warning/10 flex items-center justify-center">
                       <ShieldCheck className="h-6 w-6 text-warning" />
                    </div>
                 </div>
              </CardContent>
           </Card>
           <Card className="border-none shadow-premium bg-card/50">
              <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Anomalies Detected</p>
                       <p className="text-3xl font-bold mt-1 text-destructive">2</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                       <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>System Activity Ledger</CardTitle>
                <CardDescription>Real-time stream of all actions performed across the Globalive panel.</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                       placeholder="Search by actor or action..." 
                       className="pl-9 w-64 rounded-xl h-10 border-border/40"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/40">
                    <Filter className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          </CardHeader>
          <EnhancedTable
            data={logs}
            pageSize={10}
            searchKeys={["actor", "action", "status", "id"]}
            filterSchema={[
              { key: "status", label: "Event Status" },
              { key: "actorRole", label: "Origin Role" },
            ]}
            columns={
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actor</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Identifier</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(log: LogEntry) => (
              <TableRow key={log.id} className="hover:bg-muted/20 transition-colors border-border/40 group">
                <TableCell className="text-xs font-medium text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell>
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                         <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm font-bold">{log.actor}</span>
                         <span className="text-[9px] uppercase font-black text-primary/60 tracking-wider font-mono">{log.actorRole}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold">{log.action}</span>
                      <div className="flex items-center gap-2 opacity-60">
                         {log.device.includes("Mobile") ? <Smartphone className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                         <span className="text-[10px] font-medium">{log.device} • {log.ipAddress}</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-border/60">
                    {log.target}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={log.status === "Success" ? "default" : log.status === "Warning" ? "secondary" : "destructive"}
                    className="text-[9px] font-black uppercase tracking-widest h-5 px-2"
                  >
                    {log.status === "Success" && <ShieldCheck className="h-2.5 w-2.5 mr-1" />}
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <span className="font-mono text-[10px] font-bold text-muted-foreground p-1.5 rounded-lg bg-muted group-hover:bg-background transition-colors border border-transparent group-hover:border-border/40">
                      {log.id}
                   </span>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
