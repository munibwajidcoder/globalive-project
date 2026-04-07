import { DashboardLayout } from "@/components/DashboardLayout";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDoc, getDocs, doc, query as fbQuery, where, updateDoc, serverTimestamp, addDoc, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Eye,
  UserMinus,
  UserCheck,
  MoreHorizontal,
  MessageCircle,
  Pencil,
  ShieldCheck,
  Smartphone,
  ClipboardCopy,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HostsManagementRole = "company" | "super-admin" | "sub-admin" | "agency";

type LedgerEntry = {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: "credit" | "debit";
  channel: "campaign" | "gift" | "bonus" | "withdrawal" | "purchase";
};

type ModerationNote = {
  id: string;
  adminName: string;
  date: string;
  note: string;
  action: string;
};

type HostRecord = {
  id: string;
  name: string;
  agency: string;
  level: string;
  diamonds: number;
  beans: number;
  status: "Active" | "Blocked" | "Pending";
  performance: string;
  submittedVia: "Agency Form" | "Mobile App";
  formSubmittedAt: string;
  lastActive: string;
  contactPhone: string;
  contactEmail: string;
  country: string;
  timezone: string;
  identityStatus: "Verified" | "Unverified" | "Pending";
  beansHistory: LedgerEntry[];
  diamondsHistory: LedgerEntry[];
  moderationNotes: ModerationNote[];
};

const statusBadgeVariant: Record<HostRecord["status"], "default" | "secondary" | "outline" | "destructive"> = {
  Active: "default",
  Pending: "secondary",
  Blocked: "destructive",
};

const sourceBadgeVariant: Record<HostRecord["submittedVia"], "default" | "secondary" | "outline"> = {
  "Agency Form": "outline",
  "Mobile App": "secondary",
};

export function HostsManagement({ role = "super-admin" }: { role?: HostsManagementRole }) {
  const [hosts, setHosts] = useState<HostRecord[]>([]);
  const [agencies, setAgencies] = useState<Array<{id: string, name: string}>>([]);
  const [addHostOpen, setAddHostOpen] = useState(false);
  const [newHostUserId, setNewHostUserId] = useState("");
  const [newHostAgencyId, setNewHostAgencyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<HostRecord | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<HostRecord | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTo, setMessageTo] = useState<HostRecord | null>(null);
  const [messageBody, setMessageBody] = useState("");

  const pageTitle = useMemo(() => {
    switch (role) {
      case "company": return "Company Host Ecosystem";
      case "super-admin": return "Global Host Management";
      case "sub-admin": return "Regional Host Oversight";
      case "agency": return "My Agency Hosts";
      default: return "Hosts";
    }
  }, [role]);

  const pageDescription = useMemo(() => {
    switch (role) {
      case "company": return "Monitor all agency-affiliated hosts and independent streamers platform-wide.";
      case "super-admin": return "Full lifecycle management of hosts, verification, and performance reporting.";
      case "sub-admin": return "Review and manage hosts within your assigned regional agencies.";
      case "agency": return "Recruit, manage, and monitor the performance of your agency's host network.";
      default: return "Manage and monitor hosts across the network.";
    }
  }, [role]);

  useEffect(() => {
    if (role === "sub-admin") return; 

    setLoading(true);
    const usersRef = collection(db, "globiliveUsers");
    const q = fbQuery(usersRef, where("host.isHost", "==", true));
    
    const unsub = onSnapshot(q, (snaps) => {
        const list = snaps.docs.map(uDoc => {
             const ud: any = uDoc.data();
             return {
                id: uDoc.id,
                name: ud.name || ud.email || ud.username || "Unknown",
                agency: ud.host?.agencyName || ud.host?.agencyId || "Independent",
                level: ud.level?.level ? `Level ${ud.level.level}` : "1",
                diamonds: Number(ud.diamonds || 0),
                beans: Number(ud.beans || 0),
                status: (ud.host?.status === "Blocked" ? "Blocked" : (ud.host?.status === "Active" ? "Active" : "Pending")) as any,
                performance: "Good",
                submittedVia: ud.host?.sourcePlatform === "mobile app" ? "Mobile App" : "Agency Form",
                formSubmittedAt: ud.host?.appliedAt || "",
                lastActive: ud.lastSeen || "",
                contactPhone: ud.phone || ud.contact || "",
                contactEmail: ud.email || ud.username || "",
                country: ud.country || "",
                timezone: ud.timezone || "",
                identityStatus: "Verified",
                beansHistory: [],
                diamondsHistory: [],
                moderationNotes: [],
             } as HostRecord;
        });
        setHosts(list);
        setLoading(false);
    }, (err) => {
        console.error("HostsManagement: onSnapshot error", err);
        setLoading(false);
    });

    return () => unsub();
  }, [role, user]);

  useEffect(() => {
    if (role !== "sub-admin") return;
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        const q = fbQuery(collection(db, "globiliveSubAdmins"), where("email", "==", user.username));
        const snaps = await getDocs(q);
        if (!mounted) return;
        if (snaps.empty) {
          setHosts([]);
          return;
        }
        const subDoc = snaps.docs[0];
        const subData: any = subDoc.data();
        const assigned: string[] = Array.isArray(subData.assignedAgenciesIds) ? subData.assignedAgenciesIds : [];
        if (assigned.length === 0) {
          setHosts([]);
          return;
        }

        const hostPairs: Array<{ hid: string; agencyName: string }> = [];
        await Promise.all(
          assigned.map(async (aid) => {
            try {
              const aDoc = await getDoc(doc(db, "globiliveAgencies", aid));
              if (!aDoc.exists()) return;
              const aData: any = aDoc.data();
              const hostIds: string[] = Array.isArray(aData.agencyHosts) ? aData.agencyHosts : [];
              const agencyName = aData.name || aData.agencyName || aDoc.id;
              hostIds.forEach((hid) => hostPairs.push({ hid: String(hid), agencyName }));
            } catch (e) {
              console.error("load assigned agency doc", aid, e);
            }
          }),
        );

        if (hostPairs.length === 0) {
          setHosts([]);
          return;
        }

        const hostMap = new Map<string, string>();
        hostPairs.forEach((p) => {
          if (!hostMap.has(p.hid)) hostMap.set(p.hid, p.agencyName);
        });

        const hostIds = Array.from(hostMap.keys());
        const fetched = await Promise.all(
          hostIds.map(async (hid) => {
            try {
              const uDoc = await getDoc(doc(db, "globiliveUsers", hid));
              if (!uDoc.exists()) return null;
              const ud: any = uDoc.data();
              return {
                id: uDoc.id,
                name: ud.name || ud.email || ud.username || "",
                agency: hostMap.get(hid) || "",
                level: ud.level?.level ? `Level ${ud.level.level}` : "",
                diamonds: Number(ud.diamonds || 0),
                beans: Number(ud.beans || 0),
                status: ud.host?.status === "Blocked" ? "Blocked" : (ud.host?.status === "Active" ? "Active" : "Pending"),
                performance: "Good",
                submittedVia: ud.host?.sourcePlatform === "mobile app" ? "Mobile App" : "Agency Form",
                formSubmittedAt: ud.host?.appliedAt || "",
                lastActive: ud.lastSeen || "",
                contactPhone: ud.phone || ud.contact || "",
                contactEmail: ud.email || ud.username || "",
                country: ud.country || "",
                timezone: ud.timezone || "",
                identityStatus: "Verified",
                beansHistory: [],
                diamondsHistory: [],
                moderationNotes: [],
              } as HostRecord;
            } catch (e) {
              console.error("load host user doc", hid, e);
              return null;
            }
          }),
        );

        if (mounted) setHosts(fetched.filter(Boolean) as HostRecord[]);
      } catch (e) {
        console.error("load sub-admin assigned hosts error", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [role, user]);

  useEffect(() => {
    const loadAgencies = async () => {
      if (!user?.username) return;
      try {
        let docs;
        if (role === 'agency') {
           const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user.username));
           docs = await getDocs(q);
        } else if (role === 'super-admin' || role === 'company') {
           docs = await getDocs(collection(db, "globiliveAgencies"));
        } else {
           docs = await getDocs(collection(db, "globiliveAgencies"));
        }
        
        const list = docs.docs.map(d => ({ 
          id: d.id, 
          name: (d.data() as any).name || (d.data() as any).agencyName || d.id 
        }));
        setAgencies(list);
        if (role === 'agency' && list.length > 0) {
          setNewHostAgencyId(list[0].id);
        }
      } catch (e) {
        console.error("load agencies for host creation error", e);
      }
    };
    loadAgencies();
  }, [role, user]);

  const handleAddHost = async () => {
    if (!newHostUserId.trim() || !newHostAgencyId) {
      toast({ title: "Required", description: "Provide User ID and select an Agency.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let targetUserDoc: any = null;
      let targetUserRef: any = null;

      // 1. Search for yeahLiveId (common for admins)
      const userQuery = fbQuery(collection(db, "globiliveUsers"), where("yeahLiveId", "==", newHostUserId.trim()));
      const userSnaps = await getDocs(userQuery);
      
      if (!userSnaps.empty) {
        targetUserDoc = userSnaps.docs[0];
        targetUserRef = targetUserDoc.ref;
      } else {
        // 2. Fallback to direct Document ID lookup
        const directRef = doc(db, "globiliveUsers", newHostUserId.trim());
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          targetUserDoc = directSnap;
          targetUserRef = directRef;
        }
      }

      if (!targetUserDoc) {
        toast({ title: "User not found", description: `User identifier "${newHostUserId.trim()}" does not exist.`, variant: "destructive" });
        return;
      }
      
      const ud = targetUserDoc.data();
      const resolvedUserId = targetUserDoc.id; // Unique Document ID
      
      const agencyDocRef = doc(db, "globiliveAgencies", newHostAgencyId);
      const agencyDoc = await getDoc(agencyDocRef);
      if (!agencyDoc.exists()) {
        toast({ title: "Agency not found", description: "Selected agency no longer exists.", variant: "destructive" });
        return;
      }
      
      const aData: any = agencyDoc.data();
      const currentHosts = Array.isArray(aData.agencyHosts) ? aData.agencyHosts : [];
      if (!currentHosts.includes(resolvedUserId)) {
        await updateDoc(agencyDocRef, {
          agencyHosts: [...currentHosts, resolvedUserId]
        });
      }
      
      await updateDoc(targetUserRef, {
        "host.isHost": true,
        "host.status": "Active",
        "host.appliedAt": new Date().toISOString(),
        "host.agencyId": newHostAgencyId,
        "host.agencyName": aData.name || aData.agencyName || ""
      });
      
      toast({ title: "Host Added", description: "User has been successfully linked as a host." });
      setAddHostOpen(false);
      setNewHostUserId("");
      
    } catch (e) {
      console.error("Add host error", e);
      toast({ title: "Error", description: "Failed to add host. Check console for details.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (num: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(num);
  const formatDateTime = (val: string | number) => {
    if (!val) return "Never";
    return new Date(val).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  };

  const openView = (host: HostRecord) => {
    setViewing(host);
    setViewOpen(true);
  };

  const openStatusChange = (host: HostRecord) => {
    setStatusTarget(host);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === "Active" ? "Blocked" : "Active";
    try {
      const hostRef = doc(db, "globiliveUsers", statusTarget.id);
      await updateDoc(hostRef, {
        "host.status": nextStatus,
        updatedAt: serverTimestamp(),
      });

      setHosts((prev) => prev.map((h) => (h.id === statusTarget.id ? { ...h, status: nextStatus } : h)));
      toast({
        title: nextStatus === "Blocked" ? "Host blocked" : "Host unblocked",
        description: `${statusTarget.name} is now ${nextStatus}.`,
      });
    } catch (error) {
      console.error("Error updating host status:", error);
      toast({ title: "Error", description: "Failed to update host status.", variant: "destructive" });
    } finally {
      setStatusTarget(null);
      setStatusDialogOpen(false);
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold">{pageTitle}</h2>
            <p className="mt-1 text-muted-foreground">{pageDescription}</p>
          </div>
          <div className="flex gap-2 items-center">
             <Button className="gradient-primary shadow-glow" onClick={() => setAddHostOpen(true)}>
              Add Host
            </Button>
            <Badge variant="outline" className="inline-flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5" />
              Real-time sync enabled
            </Badge>
          </div>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <EnhancedTable
            data={hosts}
            pageSize={8}
            loading={loading}
            searchKeys={["name", "agency", "level", "contactPhone", "contactEmail", "status", "submittedVia"]}
            columns={
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Host Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Agency Affiliate</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Entry Channel</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Level</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary">Diamonds</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Beans</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(host: HostRecord) => (
              <TableRow key={host.id} className="border-border/40 hover:bg-muted/30">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="font-bold">{host.name}</span>
                    <span className="text-xs text-muted-foreground">{host.contactEmail}</span>
                  </div>
                </TableCell>
                <TableCell>{host.agency}</TableCell>
                <TableCell>
                  <Badge variant={sourceBadgeVariant[host.submittedVia]}>{host.submittedVia}</Badge>
                </TableCell>
                <TableCell>{host.level}</TableCell>
                <TableCell className="font-black text-primary">{formatAmount(host.diamonds)} 💎</TableCell>
                <TableCell className="font-black text-emerald-600">{formatAmount(host.beans)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[host.status]}>{host.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(host)}>
                        <Eye className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStatusChange(host)}>
                        {host.status === "Active" ? <><UserMinus className="mr-2 h-4 w-4" /> Block</> : <><UserCheck className="mr-2 h-4 w-4" /> Unblock</>}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        {/* Dialogs: View, Status, Add */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewing?.name}</DialogTitle>
              <DialogDescription>{viewing?.agency}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                  <pre className="text-xs">{JSON.stringify(viewing, null, 2)}</pre>
              </ScrollArea>
            </div>
            <DialogFooter>
               <Button onClick={() => setViewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will {statusTarget?.status === "Active" ? "block" : "unblock"} {statusTarget?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={addHostOpen} onOpenChange={setAddHostOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Host</DialogTitle>
              <DialogDescription>Link an existing user to an agency as a host.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">User ID</label>
                <Input placeholder="Enter User ID" value={newHostUserId} onChange={(e) => setNewHostUserId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select Agency</label>
                <select 
                  className="w-full h-10 px-3 border rounded-md bg-background focus:ring-2 focus:ring-primary"
                  value={newHostAgencyId}
                  onChange={(e) => setNewHostAgencyId(e.target.value)}
                  disabled={role === 'agency'}
                >
                  <option value="">Select an agency...</option>
                  {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddHostOpen(false)}>Cancel</Button>
              <Button onClick={handleAddHost} disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Confirm Add Host"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
