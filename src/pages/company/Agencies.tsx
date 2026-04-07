
import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader, Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, UserCheck, UserX, ArrowRightLeft, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



// Agencies are loaded from Firestore in realtime; no static seed data.

export default function CompanyAgencies() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [viewingAgency, setViewingAgency] = useState<any | null>(null);
  const [viewingHost, setViewingHost] = useState<any | null>(null);

  const openAgencyView = (agency: any) => {
      setViewingAgency(agency)
  }

  useEffect(() => {
    const colRef = collection(db, "globiliveAgencies");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name || data.agencyName || "",
          code: data.code || data.agencyCode || "",
          status: data.status || "Active",
          share: data.sharePercent != null ? `${data.sharePercent}%` : data.share || "N/A",
          targetAchieved: data.targetAchieved || "N/A",
          hostsCount: data.agencyHosts?.length ?? data.hostsCount ?? 0,
          hosts: data.agencyHosts || data.hosts || [],
          transactions: data.transactions || [],
          ...data,
        };
      });
      setAgencies(list);
    }, (err) => console.error("agencies onSnapshot error", err));

    return () => unsub();
  }, []);

  const openHostView = (host: any) => {
      setViewingHost(host)
  }

  const getStatusBadge = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "Active":
        return "default";
      case "Pending":
        return "secondary";
      case "Blocked":
      case "Inactive":
        return "destructive";
      case "Termination Requested":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleApproveHost = (hostId: number) => {
      const updatedAgency = { ...viewingAgency, hosts: viewingAgency.hosts.map((h:any) => h.id === hostId ? { ...h, status: 'Approved' } : h) };
      setAgencies(agencies.map(a => a.id === updatedAgency.id ? updatedAgency : a));
      setViewingAgency(updatedAgency);
      toast({title: "Host Approved"})
  }

    const handleBlockHost = (hostId: number) => {
      const updatedAgency = { ...viewingAgency, hosts: viewingAgency.hosts.map((h:any) => h.id === hostId ? { ...h, status: h.status === 'Blocked' ? 'Approved' : 'Blocked' } : h) };
      setAgencies(agencies.map(a => a.id === updatedAgency.id ? updatedAgency : a));
      setViewingAgency(updatedAgency);
      toast({title: `Host ${updatedAgency.hosts.find((h:any) => h.id === hostId)?.status === 'Blocked' ? 'Blocked' : 'Unblocked'}`})
  }

  

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Agencies</h2>
          <p className="text-muted-foreground mt-1">All agencies registered on the platform</p>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <EnhancedTable
            data={agencies}
            pageSize={10}
            searchKeys={["id", "name", "code", "status"]}
            filterSchema={[
              { key: "status", label: "Status" },
              { key: "hostsCount", label: "Min Hosts", type: "number" },
            ]}
            columns={
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Agency ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Agency Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Agency Code</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Hosts</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Share</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.id}</TableCell>
                <TableCell className="font-mono text-sm">{a.code}</TableCell>
                <TableCell><Badge variant={a.status === "Active" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                <TableCell>{a.share}</TableCell>
                
                <TableCell>{a.hostsCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openAgencyView(a)}><Eye className="mr-2 h-4 w-4" />View Agency</DropdownMenuItem>
                        {a.status !== "Terminated" && <DropdownMenuItem onClick={async () => {
                          const newStatus = a.status === 'Active' ? 'Inactive' : 'Active';
                          try {
                            await updateDoc(doc(db, 'globiliveAgencies', a.id), { status: newStatus });
                            setAgencies(agencies.map((x:any) => x.id === a.id ? { ...x, status: newStatus } : x));
                            toast({ title: `Agency ${a.name} is now ${newStatus}` });
                          } catch (err) {
                            console.error('Failed to update agency status', err);
                            toast({ title: 'Failed to update status', description: String(err) });
                          }
                        }}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />{a.status === 'Active' ? 'Inactive Agency' : 'Active Agency'}
                        </DropdownMenuItem>}
                      </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>
      </div>

      {/* View Agency Dialog */}
      <Dialog open={!!viewingAgency} onOpenChange={(isOpen) => !isOpen && setViewingAgency(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agency: {viewingAgency?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <div>
              <strong>Name:</strong> {viewingAgency?.name}
            </div>
            <div>
              <strong>Code:</strong> {viewingAgency?.code}
            </div>
            <div>
              <strong>Region:</strong> {viewingAgency?.region || viewingAgency?.region}
            </div>
            <div>
              <strong>Hosts:</strong> {viewingAgency?.hostsCount ?? viewingAgency?.hosts?.length ?? viewingAgency?.hosts ?? 0}
            </div>
            <div>
              <strong>Revenue:</strong> {viewingAgency?.totalRevenue || viewingAgency?.revenue || "N/A"}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <Badge variant={getStatusBadge(viewingAgency?.status)}>
                {viewingAgency?.status}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

       {/* View Host Dialog */}
       <Dialog open={!!viewingHost} onOpenChange={(isOpen) => !isOpen && setViewingHost(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>Host: {viewingHost?.name}</DialogTitle></DialogHeader>
                <Tabs defaultValue="bean_transactions">
                    <TabsList>
                        <TabsTrigger value="bean_transactions">Bean Transactions</TabsTrigger>
                        <TabsTrigger value="withdrawal_requests">Withdrawal Requests</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bean_transactions">
                         <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {viewingHost?.beanTransactions.map((tx: any) => <TableRow key={tx.id}><TableCell>{tx.date}</TableCell><TableCell>{tx.type}</TableCell><TableCell>{tx.amount}</TableCell><TableCell>{tx.from}</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </TabsContent>
                    <TabsContent value="withdrawal_requests">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {viewingHost?.withdrawalRequests.map((req: any) => <TableRow key={req.id}><TableCell>{req.date}</TableCell><TableCell>${req.amount}</TableCell><TableCell><Badge>{req.status}</Badge></TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </DialogContent>
       </Dialog>

      

    </DashboardLayout>
  );
}
