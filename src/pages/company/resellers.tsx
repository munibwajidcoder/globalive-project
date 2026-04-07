import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Ban,
  UserCheck,
  UserMinus,
  PlusCircle,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Resellers() {
  const [resellers, setResellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionOpen, setActionOpen] = useState(false);
  const [currentReseller, setCurrentReseller] = useState<any | null>(null);
  const [actionType, setActionType] =
    useState<"Reject" | "Block" | "Unblock" | null>(null);

  const [addResellerOpen, setAddResellerOpen] = useState(false);
  const [newResellerName, setNewResellerName] = useState("");
  const [newResellerEmail, setNewResellerEmail] = useState("");
  const [newResellerPassword, setNewResellerPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const colRef = collection(db, "globiliveResellers");
    const q = query(colRef, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setResellers(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resellers:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleActionClick = async (reseller: any, type: "Approve" | "Reject" | "Block" | "Unblock") => {
    if (type === "Approve") {
      try {
        await updateDoc(doc(db, "globiliveResellers", reseller.id), { status: "Active" });
        toast({ title: "Reseller Approved", description: `${reseller.name} is now active.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to approve reseller.", variant: "destructive" });
      }
      return;
    }

    setCurrentReseller(reseller);
    setActionType(type);
    setActionOpen(true);
  };

  const confirmAction = async () => {
    if (!currentReseller || !actionType) return;

    try {
      if (actionType === "Reject") {
        await deleteDoc(doc(db, "globiliveResellers", currentReseller.id));
        toast({ title: "Reseller Rejected", variant: "destructive" });
      } else {
        const newStatus = actionType === "Block" ? "Blocked" : "Active";
        await updateDoc(doc(db, "globiliveResellers", currentReseller.id), { status: newStatus });
        toast({ title: `Reseller ${newStatus}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
    } finally {
      setActionOpen(false);
      setCurrentReseller(null);
      setActionType(null);
    }
  };

  const handleAddReseller = async () => {
    if (!newResellerName.trim() || !newResellerEmail.trim() || !newResellerPassword) {
      toast({ title: "Required Information", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const resellerCode = `RES-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      await addDoc(collection(db, "globiliveResellers"), {
        name: newResellerName.trim(),
        email: newResellerEmail.trim(),
        password: newResellerPassword,
        code: resellerCode,
        agent: "Direct (Company)",
        totalSales: "$0",
        status: "Active",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Reseller Created", description: `${newResellerName} has been added.` });
      setNewResellerName("");
      setNewResellerEmail("");
      setNewResellerPassword("");
      setAddResellerOpen(false);
    } catch (error) {
      console.error("Error adding reseller:", error);
      toast({ title: "Error", description: "Failed to create reseller.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/public/reseller-apply`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied!", description: "Public reseller application link copied." });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "secondary";
      case "Pending":
        return "default";
      case "Blocked":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Resellers</h2>
            <p className="text-muted-foreground mt-1">
              Manage all resellers and their applications.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPublicLink} className="border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10">
                <LinkIcon className="w-4 h-4 mr-2" />
                Public Link
            </Button>
            <Button className="gradient-primary shadow-glow" onClick={() => setAddResellerOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Reseller
            </Button>
          </div>
        </div>

        <Card>
          <EnhancedTable
            data={resellers}
            pageSize={10}
            searchKeys={["name", "code", "status", "agent"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Reseller Name</TableHead>
                  <TableHead>Reseller Code</TableHead>
                  <TableHead>Top-up Agent</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-sm">{r.code}</TableCell>
                <TableCell>{r.agent}</TableCell>
                <TableCell className="font-semibold">{r.totalSales}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadge(r.status) as any}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {r.status === "Pending" && (
                        <>
                          <DropdownMenuItem onClick={() => handleActionClick(r, "Approve")}>
                            <CheckCircle className="mr-2" />
                            Approve
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleActionClick(r, "Reject")}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}

                      {r.status === "Active" && (
                        <DropdownMenuItem
                          onClick={() => handleActionClick(r, "Block")}
                          className="text-red-600 focus:bg-red-500/10 focus:text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Block
                        </DropdownMenuItem>
                      )}

                      {r.status === "Blocked" && (
                        <DropdownMenuItem 
                          onClick={() => handleActionClick(r, "Unblock")}
                          className="text-green-600 focus:bg-green-500/10 focus:text-green-600"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Unblock
                        </DropdownMenuItem>
                      )}

                      {(r.status === "Active" || r.status === "Blocked") && (
                        <>
                           <div className="h-px bg-border/40 my-1"/>
                           <DropdownMenuItem
                              onClick={() => {
                                  toast({
                                      title: "Transfer Initiated",
                                      description: `Initiated process to fire ${r.name} and transfer their network.`,
                                      variant: "destructive"
                                  })
                              }}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Fire & Transfer Sub-Network
                            </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        {/* CONFIRM ACTION DIALOG */}
        <AlertDialog open={actionOpen} onOpenChange={setActionOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "Reject" && "This will permanently remove the application."}
                {actionType === "Block" && `This will block ${currentReseller?.name}.`}
                {actionType === "Unblock" && `This will restore ${currentReseller?.name}.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction}>
                Confirm {actionType}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* ADD NEW RESELLER DIALOG */}
        <Dialog open={addResellerOpen} onOpenChange={setAddResellerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Reseller</DialogTitle>
              <DialogDescription>
                Create a new reseller or share a link for them to apply.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-4 border rounded-md space-y-4">
                <h4 className="font-semibold">Create Manually</h4>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Reseller Name</label>
                  <Input
                    placeholder="e.g. Acme Resell"
                    value={newResellerName}
                    onChange={e => setNewResellerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Contact Email</label>
                  <Input
                    placeholder="reseller@example.com"
                    type="email"
                    value={newResellerEmail}
                    onChange={e => setNewResellerEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold">Password</label>
                  <div className="relative">
                    <Input
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={newResellerPassword}
                      onChange={e => setNewResellerPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button onClick={handleAddReseller} className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create & Activate Reseller"}
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Share Public Link</h4>

                <p className="text-sm text-muted-foreground mb-3">
                  Share this link with potential resellers to let them apply.
                </p>

                <Button onClick={copyPublicLink} variant="secondary" className="w-full">
                  <LinkIcon className="mr-2" />
                  Copy Public Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
