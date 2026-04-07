import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { FileText, RotateCcw } from "lucide-react";

const mockBeanTransactions = [
  { id: "TX-B1001", date: "2024-10-23T10:00:00Z", type: "Top-up", source: "Super Admin (Admin1)", amount: 100000, status: "Completed", hostName: "-", userId: "SA-001", agencyName: "-", agencyCode: "-", ip: "192.168.1.1" },
  { id: "TX-B1002", date: "2024-10-23T11:30:00Z", type: "Assigned", source: "Top-up Agent (AgentX)", amount: 50000, status: "Completed", hostName: "User123", userId: "U-001", agencyName: "Star Agency", agencyCode: "AG-100", ip: "10.0.0.5" },
  { id: "TX-B1003", date: "2024-10-23T14:15:00Z", type: "Generated", source: "Company Admin", amount: 1500000, status: "Completed", hostName: "-", userId: "-", agencyName: "-", agencyCode: "-", ip: "System" },
];

const mockDiamondTransactions = [
  { id: "TX-D2001", date: "2024-10-23T12:00:00Z", type: "Gift Sent", source: "User (Mike)", amount: 500, status: "Completed", hostName: "AliceLive", userId: "U-042", agencyName: "Galaxy Agency", agencyCode: "AG-102", ip: "172.16.0.4" },
  { id: "TX-D2002", date: "2024-10-23T13:00:00Z", type: "Gift Received", source: "User (Anonymous)", amount: 1000, status: "Completed", hostName: "BobStream", userId: "U-088", agencyName: "None", agencyCode: "None", ip: "172.16.1.9" },
];

const mockWithdrawalTransactions = [
  { id: "TX-W3001", date: "2024-10-22T15:00:00Z", type: "Cash-out", source: "Host (AliceLive)", amount: 500, status: "Pending", hostName: "AliceLive", userId: "U-042", agencyName: "Galaxy Agency", agencyCode: "AG-102", ip: "203.0.113.1" },
  { id: "TX-W3002", date: "2024-10-23T16:00:00Z", type: "Cash-out", source: "Agency (Star Agency)", amount: 1200, status: "Completed", hostName: "-", userId: "AG-100", agencyName: "Star Agency", agencyCode: "AG-100", ip: "198.51.100.5" },
];

const mockDiamondToBeanTransactions = [
  { id: "TX-C4001", date: "2024-10-23T18:00:00Z", type: "Conversion", source: "Host (AliceLive)", amount: 1000, beans: 800, commission: "20%", status: "Completed", hostName: "AliceLive", userId: "U-042", agencyName: "Galaxy Agency", agencyCode: "AG-102", ip: "203.0.113.1" },
];

export default function CompanyTransactions() {
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDetails = (tx: any) => {
    setSelectedTx(tx);
    setDialogOpen(true);
  };

  const handleRefund = (tx: any) => {
    toast({
      title: "Refund Initiated",
      description: `Refund for transaction ${tx.id} has been submitted for processing.`,
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "Completed":
        return <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-none dark:text-green-400">Completed</Badge>;
      case "Pending":
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-none dark:text-amber-400">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Platform transactions and financials</p>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardContent className="p-6">
            <Tabs defaultValue="beans" className="w-full">
              <TabsList className="grid w-full grid-cols-4 max-w-[600px] mb-6">
                <TabsTrigger value="beans">Beans Activity</TabsTrigger>
                <TabsTrigger value="diamonds">Diamond Activity</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                <TabsTrigger value="conversions">Conversions</TabsTrigger>
              </TabsList>

              <TabsContent value="beans" className="space-y-4">
                <EnhancedTable
                  data={mockBeanTransactions}
                  pageSize={10}
                  searchKeys={["source", "hostName", "userId", "agencyName", "agencyCode", "id"]}
                  filterSchema={[
                    { key: "type", label: "Type" },
                    { key: "agencyCode", label: "Agency Code" },
                  ]}
                  columns={
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Source / Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount (Beans)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  }
                  renderRow={(tx: any) => (
                    <TableRow key={tx.id} className="border-border/40">
                      <TableCell className="font-medium text-sm">{tx.type}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.source}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">+{tx.amount.toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleDetails(tx)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TabsContent>

              <TabsContent value="diamonds" className="space-y-4">
                 <EnhancedTable
                  data={mockDiamondTransactions}
                  pageSize={10}
                  searchKeys={["source", "hostName", "userId", "agencyName", "agencyCode", "id"]}
                  filterSchema={[
                    { key: "type", label: "Type" },
                    { key: "hostName", label: "Host" },
                  ]}
                  columns={
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Source / Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount (Diamonds)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  }
                  renderRow={(tx: any) => (
                    <TableRow key={tx.id} className="border-border/40">
                      <TableCell className="font-medium text-sm">{tx.type}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.source}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-cyan-500">+{tx.amount.toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleDetails(tx)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-4">
                 <EnhancedTable
                  data={mockWithdrawalTransactions}
                  pageSize={10}
                  searchKeys={["source", "hostName", "userId", "agencyName", "id"]}
                  filterSchema={[
                    { key: "status", label: "Status" },
                    { key: "agencyName", label: "Agency Name" },
                  ]}
                  columns={
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Withdrawal Source</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount (USD)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  }
                  renderRow={(tx: any) => (
                    <TableRow key={tx.id} className="border-border/40">
                      <TableCell className="font-medium text-sm">{tx.type}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.source}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-red-500">-${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleDetails(tx)}>
                            Details
                          </Button>
                          {tx.status === "Pending" && (
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all" size="sm" onClick={() => handleRefund(tx)}>
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TabsContent>

               <TabsContent value="conversions" className="space-y-4">
                 <EnhancedTable
                  data={mockDiamondToBeanTransactions}
                  pageSize={10}
                  searchKeys={["source", "hostName", "userId", "agencyName", "id"]}
                  columns={
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Source / Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Converted</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  }
                  renderRow={(tx: any) => (
                    <TableRow key={tx.id} className="border-border/40">
                      <TableCell className="font-medium text-sm">{tx.type}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.source}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-cyan-500 text-xs">-{tx.amount} Diamonds</span>
                          <span className="font-bold text-primary text-xs">+{tx.beans} Beans</span>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleDetails(tx)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto w-11/12 border-none shadow-premium bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Transaction Log Details
            </DialogTitle>
            <DialogDescription>
              Complete metadata and tracking log for this event.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTx && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-muted/50 p-3 rounded-lg border border-border/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Transaction ID</span>
                    <span className="font-medium">{selectedTx.id}</span>
                 </div>
                 <div className="bg-muted/50 p-3 rounded-lg border border-border/40">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Timestamp</span>
                    <span className="font-medium">{new Date(selectedTx.date).toLocaleString()}</span>
                 </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Event Overview</span>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Type:</span>
                     <span className="font-semibold">{selectedTx.type}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Source / Triggered By:</span>
                     <span className="font-semibold">{selectedTx.source}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Target User ID:</span>
                     <span className="font-semibold">{selectedTx.userId}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Target Host Name:</span>
                     <span className="font-semibold">{selectedTx.hostName}</span>
                  </div>
                  {selectedTx.commission && (
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm text-amber-500">Commission Deducted:</span>
                       <span className="font-semibold text-amber-500">{selectedTx.commission}</span>
                    </div>
                  )}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Agency Context</span>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Agency Code:</span>
                     <span className="font-semibold">{selectedTx.agencyCode}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Agency Name:</span>
                     <span className="font-semibold">{selectedTx.agencyName}</span>
                  </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">System Trace</span>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Logged IP:</span>
                     <span className="font-mono text-xs text-muted-foreground">{selectedTx.ip}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-sm">Status:</span>
                     <StatusBadge status={selectedTx.status} />
                  </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
