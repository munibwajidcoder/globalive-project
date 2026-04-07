import { useMemo, useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, CheckCircle, XCircle, Clock, Upload, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { db, storage } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Cashout() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ query: "", status: "all", date: "" });
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [viewProofOpen, setViewProofOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const colRef = collection(db, "globiliveCashouts");
    const q = query(colRef, orderBy("requestDate", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cashout requests:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const queryLower = filter.query.toLowerCase();
      const hostName = r.hostName || "";
      const userId = r.userId || "";
      const amount = String(r.amount || "");
      
      const matchesQuery = filter.query.trim() === "" ||
        hostName.toLowerCase().includes(queryLower) ||
        userId.toLowerCase().includes(queryLower) ||
        amount.includes(queryLower);

      const matchesStatus = filter.status === "all" || (r.status || "").toLowerCase() === filter.status;
      const matchesDate = filter.date === "" || String(r.requestDate).includes(filter.date);

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [requests, filter]);

  const handleApproveClick = (request: any) => {
    setSelectedRequest(request);
    setApproveOpen(true);
  };

  const handleRejectClick = (request: any) => {
    setSelectedRequest(request);
    setRejectOpen(true);
  };

  const handleViewProofClick = (request: any) => {
    setSelectedRequest(request);
    setViewProofOpen(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest || !proofFile) {
      toast({ title: "Proof Required", description: "Please upload a payment screenshot.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload proof to Firebase Storage
      const proofRef = ref(storage, `cashouts/proofs/${selectedRequest.id}_${Date.now()}_${proofFile.name}`);
      const snap = await uploadBytes(proofRef, proofFile);
      const proofUrl = await getDownloadURL(snap.ref);

      // 2. Update Firestore
      await updateDoc(doc(db, "globiliveCashouts", selectedRequest.id), {
        status: "Approved",
        approvalDate: new Date().toISOString().split('T')[0],
        proof: proofUrl,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Request Approved", description: "The withdrawal is marked as complete." });
      setApproveOpen(false);
      setProofFile(null);
    } catch (error) {
      console.error("Error approving cashout:", error);
      toast({ title: "Error", description: "Failed to approve request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRejection = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "globiliveCashouts", selectedRequest.id), {
        status: "Rejected",
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Request Rejected", variant: "destructive" });
      setRejectOpen(false);
    } catch (error) {
      console.error("Error rejecting cashout:", error);
      toast({ title: "Error", description: "Failed to reject request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-3xl font-bold">Withdrawal Management</h2>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Input placeholder="Search by Host, ID, Amount..." value={filter.query} onChange={e => setFilter(f => ({ ...f, query: e.target.value }))} />
              <Select value={filter.status} onValueChange={value => setFilter(f => ({ ...f, status: value }))}>
                <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host/User</TableHead>
                  <TableHead>Total Diamonds</TableHead>
                  <TableHead>Request Qty</TableHead>
                  <TableHead>Amount (Rs)</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Approval Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? filteredRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell><div className="font-medium">{req.hostName}</div><div className="text-sm text-muted-foreground">{req.userId}</div></TableCell>
                    <TableCell>{req.totalDiamonds.toLocaleString()} 💎</TableCell>
                    <TableCell className="font-semibold">{req.requestDiamonds.toLocaleString()} 💎</TableCell>
                    <TableCell className="font-semibold">₹{req.amount.toLocaleString()}</TableCell>
                    <TableCell>{req.requestDate}</TableCell>
                    <TableCell>{req.approvalDate || 'N/A'}</TableCell>
                    <TableCell><Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Pending' ? 'secondary' : 'destructive'}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {req.status === "Pending" ? (
                            <>
                              <DropdownMenuItem onSelect={() => handleApproveClick(req)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleRejectClick(req)}
                                className="text-destructive focus:text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {req.status === "Approved" ? (
                            <DropdownMenuItem onSelect={() => handleViewProofClick(req)}>
                              <Eye className="mr-2 h-4 w-4" /> View proof
                            </DropdownMenuItem>
                          ) : null}
                          {req.status !== "Pending" && req.status !== "Approved" ? (
                            <DropdownMenuItem disabled>
                              <Clock className="mr-2 h-4 w-4" /> No actions available
                            </DropdownMenuItem>
                          ) : null}
                          {(req.status === "Pending" || req.status === "Approved") && req.superAdmin ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled>
                                Assigned to {req.superAdmin}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={8} className="text-center h-24">No requests found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Withdrawal</DialogTitle>
              <DialogDescription>To approve, upload the screenshot of the successful transfer as proof.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2" /> {proofFile ? proofFile.name : 'Upload Screenshot'}</Button>
              <Input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={e => setProofFile(e.target.files ? e.target.files[0] : null)} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button variant="default" onClick={confirmApproval}>Confirm & Approve</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Withdrawal Request</DialogTitle>
              <DialogDescription>Are you sure you want to reject this request? The host will be notified.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button variant="destructive" onClick={confirmRejection}>Confirm Rejection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={viewProofOpen} onOpenChange={setViewProofOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>Screenshot attached for withdrawal to {selectedRequest?.hostName} ({selectedRequest?.userId})</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedRequest?.proof ?
                <img src={selectedRequest.proof} alt="Payment Proof" className="rounded-md border" /> :
                <p>No proof available.</p>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
