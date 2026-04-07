import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader, Table, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Eye } from "lucide-react";

const initialHostsData = [
  { id: 1, name: "Host A", agency: "Golden Stars", agencyId: 1, earnings: 1200, status: "Active", beanTransactions: [{id: 1, type: 'purchase', amount: 5000, from: 'SuperAdmin', date: '2023-10-26'}], diamondTransactions: [], withdrawalRequests: [{id: 1, amount: 100, status: 'Completed', date: '2023-10-25'}] },
  { id: 2, name: "Host B", agency: "Dream Team", agencyId: 2, earnings: 850, status: "Inactive", beanTransactions: [], diamondTransactions: [], withdrawalRequests: [] },
  { id: 3, name: "Host C", agency: "Golden Stars", agencyId: 1, earnings: 2500, status: "Active", beanTransactions: [], diamondTransactions: [], withdrawalRequests: [] },
  { id: 4, name: "Host D", agency: "Galaxy", agencyId: 3, earnings: 500, status: "Blocked", beanTransactions: [], diamondTransactions: [], withdrawalRequests: [] },
];

const initialAgenciesData = [
    { id: 1, name: "Golden Stars"},
    { id: 2, name: "Dream Team"},
    { id: 3, name: "Galaxy" },
    { id: 4, name: "Universe" },
];

export default function CompanyHosts() {
  const [hosts, setHosts] = useState(initialHostsData);
  const [agencies] = useState(initialAgenciesData);
  const [viewingHost, setViewingHost] = useState<any | null>(null);
  const [transferringHost, setTransferringHost] = useState<any | null>(null);
  const [transferTarget, setTransferTarget] = useState<string>("");

  const handleApproveHost = (hostId: number) => {
      setHosts(hosts.map(h => h.id === hostId ? { ...h, status: 'Active' } : h));
      toast({title: "Host Approved"});
  };

  const handleBlockHost = (hostId: number, currentStatus: string) => {
      const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
      setHosts(hosts.map(h => h.id === hostId ? { ...h, status: newStatus } : h));
      toast({title: `Host ${newStatus}`});
  };

  const handleTransfer = () => {
      if (!transferringHost || !transferTarget) return;
      const targetAgency = agencies.find(a => a.id === parseInt(transferTarget));
      if (!targetAgency) return;

      setHosts(hosts.map(h => 
          h.id === transferringHost.id 
          ? { ...h, agency: targetAgency.name, agencyId: targetAgency.id } 
          : h
      ));
      toast({title: "Host Transferred", description: `${transferringHost.name} moved to ${targetAgency.name}`});
      setTransferringHost(null);
      setTransferTarget("");
  };

  const handleMessage = (host: any) => {
    toast({
        title: "Messaging Gateway",
        description: `Opened secure message channel with ${host.name}.`,
    });
  }

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Hosts</h2>
          <p className="text-muted-foreground">All hosts across agencies</p>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardContent className="p-0 sm:p-6">
            <EnhancedTable
                data={hosts}
                pageSize={10}
                searchKeys={["id", "name", "agency", "status"]}
                filterSchema={[
                { key: "status", label: "Status" },
                { key: "agency", label: "Agency Name" },
                { key: "name", label: "Host Name" },
                { key: "earnings", label: "Min Earnings ($)", type: "number" },
                ]}
                columns={
                <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Agency</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Earnings</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                }
                renderRow={(h: any) => (
                <TableRow key={h.id} className="border-border/40">
                    <TableCell className="font-medium pl-4">{h.name}</TableCell>
                    <TableCell>{h.agency}</TableCell>
                    <TableCell className="font-bold text-green-500">${h.earnings.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                        {h.status === "Active" && <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-none py-1 px-3">Active</Badge>}
                        {h.status === "Inactive" && <Badge variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-none py-1 px-3">Inactive</Badge>}
                        {h.status === "Pending" && <Badge variant="secondary" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-none py-1 px-3">Pending</Badge>}
                        {h.status === "Blocked" && <Badge variant="destructive" className="py-1 px-3">Blocked</Badge>}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2 items-center">
                            <Button variant="secondary" size="sm" onClick={() => setViewingHost(h)} className="shadow-sm">
                                View
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-colors" size="sm" onClick={() => handleMessage(h)}>
                                Message
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                )}
            />
          </CardContent>
        </Card>
      </div>

      {/* View Host Dialog (Full Details & Admin Actions) */}
       <Dialog open={!!viewingHost} onOpenChange={(isOpen) => !isOpen && setViewingHost(null)}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto border-none shadow-premium bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-between mt-2">
                        <span>Host Profile: {viewingHost?.name}</span>
                        <Badge variant="outline" className="mr-6">{viewingHost?.status}</Badge>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex gap-2 flex-wrap mb-4">
                    {viewingHost?.status === 'Pending' && <Button onClick={() => handleApproveHost(viewingHost.id)}>Approve Host Profile</Button>}
                    {viewingHost?.status !== 'Pending' && (
                        <Button variant={viewingHost?.status === 'Blocked' ? 'default' : 'destructive'} onClick={() => handleBlockHost(viewingHost.id, viewingHost.status)}>
                            {viewingHost?.status === 'Blocked' ? 'Unblock Host' : 'Block Host'}
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setTransferringHost(viewingHost)}>Initiate Agency Transfer</Button>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="bean_transactions">Bean Flow</TabsTrigger>
                        <TabsTrigger value="withdrawal_requests">Withdrawals</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                             <div className="bg-muted/50 p-4 rounded-xl border border-border/40">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Total Earnings</p>
                                <p className="font-bold text-2xl text-green-500">${viewingHost?.earnings.toLocaleString()}</p>
                            </div>
                             <div className="bg-muted/50 p-4 rounded-xl border border-border/40">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Agency Affiliation</p>
                                <p className="font-bold text-xl">{viewingHost?.agency}</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="bean_transactions">
                        <Card className="border-border/40 bg-card/50 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">From</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewingHost?.beanTransactions.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No bean transactions found.</TableCell></TableRow>
                                    ) : (
                                        viewingHost?.beanTransactions.map((tx: any) => (
                                            <TableRow key={tx.id} className="border-border/40">
                                                <TableCell className="text-sm">{tx.date}</TableCell>
                                                <TableCell className="capitalize text-sm font-medium">{tx.type}</TableCell>
                                                <TableCell className="font-bold text-primary">+{tx.amount}</TableCell>
                                                <TableCell className="text-sm">{tx.from}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="withdrawal_requests">
                        <Card className="border-border/40 bg-card/50 shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Requested Amount</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {viewingHost?.withdrawalRequests.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No withdrawal requests found.</TableCell></TableRow>
                                    ) : (
                                        viewingHost?.withdrawalRequests.map((req: any) => (
                                            <TableRow key={req.id} className="border-border/40">
                                                <TableCell className="text-sm">{req.date}</TableCell>
                                                <TableCell className="font-bold text-red-500">-${req.amount}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={req.status === 'Completed' ? 'border-green-500/50 text-green-500' : ''}>
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
                 <DialogFooter className="mt-6 align-right">
                    <DialogClose asChild><Button variant="outline">Close Profile</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
       </Dialog>

      {/* Transfer Host Dialog */}
      <AlertDialog open={!!transferringHost} onOpenChange={(isOpen) => !isOpen && setTransferringHost(null)}>
        <AlertDialogContent className="border-none shadow-premium bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer {transferringHost?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new agency to transfer this host to. This will move their entire ledger and association.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="py-4 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Destination Agency</label>
              <Select onValueChange={setTransferTarget} value={transferTarget}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select new agency..." /></SelectTrigger>
                  <SelectContent>
                      {agencies.filter(a => a.id !== transferringHost?.agencyId).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransfer} disabled={!transferTarget}>Confirm Transfer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
