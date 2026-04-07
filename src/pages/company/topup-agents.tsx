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
  TableRow,
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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Active":
      return "secondary";
    case "Pending":
      return "default";
    case "Blocked":
      return "destructive";
    default:
      return "outline";
  }
};

export default function TopupAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionOpen, setActionOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"Reject" | "Block" | "Unblock" | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const colRef = collection(db, "globiliveTopUpAgents");
    const q = query(colRef, orderBy("createdAt", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAgents(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching top-up agents:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleActionClick = async (
    agent: any,
    type: "Approve" | "Reject" | "Block" | "Unblock"
  ) => {
    setCurrentAgent(agent);

    if (type === "Approve") {
      try {
        await updateDoc(doc(db, "globiliveTopUpAgents", agent.id), { status: "Active" });
        toast({ title: "Agent Approved", description: `${agent.name} is now active.` });
      } catch (error) {
        toast({ title: "Error", description: "Failed to approve agent.", variant: "destructive" });
      }
      return;
    }

    setActionType(type);
    setActionOpen(true);
  };

  const confirmAction = async () => {
    if (!currentAgent || !actionType) return;

    try {
      if (actionType === "Reject") {
        await deleteDoc(doc(db, "globiliveTopUpAgents", currentAgent.id));
        toast({ title: "Agent Rejected", variant: "destructive" });
      } else {
        const newStatus = actionType === "Block" ? "Blocked" : "Active";
        await updateDoc(doc(db, "globiliveTopUpAgents", currentAgent.id), { status: newStatus });
        toast({ title: `Agent ${newStatus}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
    } finally {
      setActionOpen(false);
      setCurrentAgent(null);
      setActionType(null);
    }
  };

  const handleAddAgent = async () => {
    if (!newAgentName.trim()) {
      toast({ title: "Agent name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const agentCode = `TPA-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
      await addDoc(collection(db, "globiliveTopUpAgents"), {
        name: newAgentName,
        code: agentCode,
        resellers: 0,
        totalSales: "$0",
        status: "Active",
        createdAt: serverTimestamp(),
      });
      
      toast({ title: "Top-up Agent Created" });
      setNewAgentName("");
      setAddAgentOpen(false);
    } catch (error) {
      console.error("Error adding agent:", error);
      toast({ title: "Error", description: "Failed to create agent.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/public/topup-agent-apply`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: "Public form link copied to clipboard.",
    });
  };

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Top-up Agents</h2>
            <p className="text-muted-foreground mt-1">
              Manage all top-up agents and their applications.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyPublicLink} className="border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10">
                <LinkIcon className="w-4 h-4 mr-2" />
                Public Link
            </Button>
            <Button className="gradient-primary shadow-glow" onClick={() => setAddAgentOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Agent
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <EnhancedTable
            data={agents}
            pageSize={10}
            searchKeys={["name", "code", "status"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Agent Code</TableHead>
                  <TableHead className="text-center">Resellers</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(agent: any) => (
              <TableRow key={agent.id}>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell className="font-mono text-sm">{agent.code}</TableCell>
                <TableCell className="text-center">{agent.resellers}</TableCell>
                <TableCell className="font-semibold">{agent.totalSales}</TableCell>

                <TableCell>
                  <Badge variant={getStatusBadge(agent.status)}>
                    {agent.status}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {agent.status === "Pending" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleActionClick(agent, "Approve")}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleActionClick(agent, "Reject")}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}

                      {agent.status === "Active" && (
                        <DropdownMenuItem
                          onClick={() => handleActionClick(agent, "Block")}
                          className="text-red-600 focus:bg-red-500/10 focus:text-red-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Block
                        </DropdownMenuItem>
                      )}

                      {agent.status === "Blocked" && (
                        <DropdownMenuItem
                          onClick={() => handleActionClick(agent, "Unblock")}
                          className="text-green-600 focus:bg-green-500/10 focus:text-green-600"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Unblock
                        </DropdownMenuItem>
                      )}
                      
                      {(agent.status === "Active" || agent.status === "Blocked") && (
                        <>
                           <div className="h-px bg-border/40 my-1"/>
                           <DropdownMenuItem
                              onClick={() => {
                                  toast({
                                      title: "Transfer Initiated",
                                      description: `Initiated process to fire ${agent.name} and transfer their resellers.`,
                                      variant: "destructive"
                                  })
                              }}
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Fire & Transfer Resellers
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

        {/* Confirm Action Dialog */}
        <AlertDialog open={actionOpen} onOpenChange={setActionOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>

              <AlertDialogDescription>
                {actionType === "Reject" &&
                  "This will permanently remove the application. This action cannot be undone."}
                {actionType === "Block" &&
                  `This will restrict ${currentAgent?.name}'s access and operations.`}
                {actionType === "Unblock" &&
                  `This will restore ${currentAgent?.name}'s privileges.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                className={
                  actionType === "Reject" || actionType === "Block"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                Confirm {actionType}
              </AlertDialogAction>

            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Agent Dialog */}
        <Dialog open={addAgentOpen} onOpenChange={setAddAgentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Top-up Agent</DialogTitle>
              <DialogDescription>
                Create a new agent or share a link for them to apply.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">

              {/* Manual Create */}
              <div className="p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Create Manually</h4>

                <Input
                  placeholder="Agent Name"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                />

                <Button onClick={handleAddAgent} className="w-full mt-4">
                  Create and Activate Agent
                </Button>
              </div>

              {/* OR Separator */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Share Link */}
              <div className="p-4 border rounded-md">
                <h4 className="font-semibold mb-2">Share Public Link</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Share this link with potential agents to let them apply.
                </p>

                <Button
                  onClick={copyPublicLink}
                  variant="secondary"
                  className="w-full"
                >
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
