import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query as fbQuery,
  where,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Eye,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Ban,
  UserCheck,
  Link as LinkIcon,
  PlusCircle,
  ArrowRightLeft,
  EyeOff,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
type ManagementRole = "super-admin" | "sub-admin";

const AGENCY_APPLICATIONS_KEY = "agency-applications";

const regions = ["North America", "Europe", "Asia Pacific", "South America", "Africa", "Oceania"];

// Agencies are loaded from Firestore at runtime — no static seed data

export function AgenciesManagement({ role = "super-admin" }: { role?: ManagementRole }) {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [assignedAgencyIds, setAssignedAgencyIds] = useState<string[]>([]);
  const [assignedAgencies, setAssignedAgencies] = useState<any[]>([]);
  const [superAdminRegion, setSuperAdminRegion] = useState<string | null>(null);
  const { user } = useAuth();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [addAgencyOpen, setAddAgencyOpen] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyRegion, setNewAgencyRegion] = useState("");
  const [newAgencyEmail, setNewAgencyEmail] = useState("");
  const [newAgencyPassword, setNewAgencyPassword] = useState("");
  const [newAgencyConfirmPassword, setNewAgencyConfirmPassword] = useState("");
  const [newAgencySharePercent, setNewAgencySharePercent] = useState<number>(0);
  const [newAgencyStatus, setNewAgencyStatus] = useState("Active");
  const [isCreatingAgency, setIsCreatingAgency] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockingAgency, setBlockingAgency] = useState<any | null>(null);
  
  const [terminateReqOpen, setTerminateReqOpen] = useState(false);
  const [terminatingAgency, setTerminatingAgency] = useState<any | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const heading = role === "super-admin" ? "Agencies" : "Agencies & Hosts";
  const description =
    role === "super-admin"
      ? "Monitor, manage, and approve all platform agencies."
      : "Review agency performance and manage hosts under your supervision.";

  useEffect(() => {
    // Load agencies from Firestore. For super-admins load only agencies linked
    // to their `agencyIds`. For other roles, subscribe to all agencies.
    let mounted = true;

    // helper to map raw doc data to UI-friendly agency shape
    const mapDoc = (id: string, data: any) => ({
      id,
      name: data.name || data.agencyName || "",
      code: data.code || data.agencyCode || "",
      region: data.region || "",
      hosts: data.agencyHosts?.length ?? data.hosts ?? 0,
      revenue: data.totalRevenue || data.revenue || "$0",
      status: data.status || "Active",
      hostsList: data.agencyHosts || [],
      ...data,
    });

    if (role === "super-admin" && user?.username) {
      (async () => {
        try {
          const superQ = fbQuery(collection(db, "globiliveSuperAdmins"), where("email", "==", user.username));
          const snap = await getDocs(superQ);
          if (!snap.empty) {
            const superDoc = snap.docs[0];
            const data: any = superDoc.data();
            setSuperAdminRegion(data.region || null);
            const agencyIds: string[] = data?.agencyIds || [];
            if (agencyIds.length > 0) {
              const fetched = await Promise.all(
                agencyIds.map(async (id) => {
                  try {
                    const aDoc = await getDoc(doc(db, "globiliveAgencies", id));
                    if (aDoc.exists()) return mapDoc(aDoc.id, aDoc.data());
                  } catch (e) {
                    console.error("fetch agency by id error", e);
                    return null;
                  }
                  return null;
                })
              );
              if (mounted) setAgencies(fetched.filter(Boolean) as any[]);
            } else {
              if (mounted) setAgencies([]);
            }
          }
        } catch (e) {
          console.error("load agencies error", e);
        }
      })();
      return () => {
        mounted = false;
      };
    }

    // If sub-admin, fetch assigned agency ids for current user so we can show them separately
    if (role === "sub-admin" && user?.username) {
      (async () => {
        try {
          const subQ = fbQuery(collection(db, "globiliveSubAdmins"), where("email", "==", user.username));
          const snap = await getDocs(subQ);
          if (!snap.empty) {
            const data: any = snap.docs[0].data();
            const ids: string[] = Array.isArray(data.assignedAgenciesIds) ? data.assignedAgenciesIds : [];
            if (mounted) setAssignedAgencyIds(ids);
          }
        } catch (e) {
          console.error("load sub-admin assigned agencies error", e);
        }
      })();
    }

    // non-super-admin: subscribe to all agencies
    const colRef = collection(db, "globiliveAgencies");
    const unsub = onSnapshot(colRef, 
      (snap) => {
        const list = snap.docs.map((d) => mapDoc(d.id, d.data()));
        if (mounted) setAgencies(list);
      }, 
      (err) => {
        console.error("Agencies: onSnapshot error", err);
        if (mounted) setAgencies([]);
      }
    );

    return () => {
      mounted = false;
      unsub();
    };
  }, [role, user]);

  // derive assignedAgencies from agencies list and assigned ids
  useEffect(() => {
    if (assignedAgencyIds.length === 0) {
      setAssignedAgencies([]);
      return;
    }
    const list = agencies.filter((a) => assignedAgencyIds.includes(String(a.id)));
    setAssignedAgencies(list);
  }, [assignedAgencyIds, agencies]);

  const handleAction = (
    id: number,
    action:
      | "Approve"
      | "Reject"
      | "Block"
      | "Unblock"
      | "View"
      | "RequestTermination"
  ) => {
    const agency = agencies.find((a) => a.id === id);
    if (!agency) return;

    switch (action) {
      case "Approve":
        setAgencies((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "Active" } : a))
        );
        toast({
          title: "Agency Approved",
          description: `${agency.name} is now active.`,
        });
        break;

      case "Reject":
        setRejectingId(id);
        setRejectOpen(true);
        break;

      case "Block":
      case "Unblock":
        setBlockingAgency(agency);
        setBlockOpen(true);
        break;


      case "View":
        setViewing(agency);
        setViewOpen(true);
        break;

      case "RequestTermination":
        setTerminatingAgency(agency);
        setTerminateReason("");
        setTerminateReqOpen(true);
        break;      
    }
  };

  const confirmReject = () => {
    if (rejectingId == null) return;

    setAgencies((prev) => prev.filter((a) => a.id !== rejectingId));
    localStorage.setItem(
      AGENCY_APPLICATIONS_KEY,
      JSON.stringify(agencies.filter((a) => a.id !== rejectingId))
    );

    toast({ title: "Agency Rejected", variant: "destructive" });

    setRejectingId(null);
    setRejectOpen(false);
  };

  const confirmBlock = () => {
    if (!blockingAgency) return;

    const newStatus =
      blockingAgency.status === "Inactive" ? "Active" : "Inactive";

    setAgencies((prev) =>
      prev.map((a) =>
        a.id === blockingAgency.id ? { ...a, status: newStatus } : a
      )
    );

    toast({
      title: `Agency ${newStatus}`,
      description: `${blockingAgency.name} has been ${newStatus.toLowerCase()}.`,
    });

    // persist change to Firestore
    (async () => {
      try {
        await updateDoc(doc(db, "globiliveAgencies", String(blockingAgency.id)), { status: newStatus });
      } catch (e) {
        console.error("update agency status error", e);
        toast({ title: "Update Failed", description: "Unable to update agency status in Firestore.", variant: "destructive" });
      } finally {
        setBlockingAgency(null);
        setBlockOpen(false);
      }
    })();
  };

  const confirmTerminateRequest = () => {
    if (!terminatingAgency || !terminateReason.trim()) {
        toast({ title: "Reason Required", description: "You must provide a reason.", variant: "destructive" });
        return;
    }

    const newStatus = "Termination Requested";
    setAgencies((prev) =>
      prev.map((a) =>
        a.id === terminatingAgency.id ? { ...a, status: newStatus } : a
      )
    );

    toast({
      title: "Termination Requested",
      description: `Sent termination request for ${terminatingAgency.name} to Company Admin.`,
    });

    (async () => {
      try {
        await updateDoc(doc(db, "globiliveAgencies", String(terminatingAgency.id)), { 
            status: newStatus,
            terminationReason: terminateReason 
        });
      } catch (e) {
        toast({ title: "Update Failed", description: "Unable to update agency status.", variant: "destructive" });
      } finally {
        setTerminatingAgency(null);
        setTerminateReqOpen(false);
      }
    })();
  };

  

  const handleAddAgency = async () => {
    if (!newAgencyName.trim() || !newAgencyRegion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both agency name and region.",
        variant: "destructive",
      });
      return;
    }

    // require contact email and password similar to superadmin dialog
    if (!newAgencyEmail.trim()) {
      toast({ title: "Missing Information", description: "Please provide contact email.", variant: "destructive" });
      return;
    }

    if (!newAgencyPassword) {
      toast({ title: "Missing Information", description: "Please provide a password.", variant: "destructive" });
      return;
    }

    if (newAgencyPassword !== newAgencyConfirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsCreatingAgency(true);
    try {
      const generatedCode = `GLB-${new Date().getFullYear()}-A${String(Date.now()).slice(-3)}`;

      const regionToUse = newAgencyRegion || superAdminRegion || "";

      const agencyPayload: any = {
        // include fields expected by UI and keep AgencyModel-like fields too
        name: newAgencyName.trim(),
        agencyName: newAgencyName.trim(),
        region: regionToUse,
        status: newAgencyStatus,
        agencyDescription: "",
        agencyLogoUrl: "",
        agencyHosts: [],
        createdAt: Date.now(),
        totalStreamHours: "0",
        totalRevenue: "0",
        creator: { creatorEmail: user?.username ?? "", creatorId: "" },
        activeStreamers: [],
        code: generatedCode,
        agencyCode: generatedCode,
        // contact credentials
        contactEmail: newAgencyEmail.trim(),
        password: newAgencyPassword,
        // share percent (align with superadmin field)
        sharePercent: Number(newAgencySharePercent) || 0,
      };

      if (newAgencyEmail) agencyPayload.contactEmail = newAgencyEmail;
      if (newAgencyPassword) agencyPayload.password = newAgencyPassword;

      const ref = await addDoc(collection(db, "globiliveAgencies"), agencyPayload);

      // collect any existing host application ids for this agency code and save to agency
      try {
        const appsQ = fbQuery(collection(db, "globiliveHostApplications"), where("agencyCode", "==", generatedCode));
        const appsSnap = await getDocs(appsQ);
        const appIds: string[] = appsSnap.docs.map((d) => d.id);
        if (appIds.length > 0) {
          try {
            await updateDoc(doc(db, "globiliveAgencies", ref.id), { hostApplications: appIds });
            // reflect in local UI copy
            agencyPayload.hostApplications = appIds;
          } catch (e) {
            console.error("failed to attach host application ids to agency", e);
          }
        } else {
          agencyPayload.hostApplications = [];
        }
      } catch (e) {
        console.error("fetch host applications for new agency error", e);
        agencyPayload.hostApplications = [];
      }

      // attach agency id to current super-admin's agencyIds
      if (user?.username) {
        try {
          const superQ = fbQuery(collection(db, "globiliveSuperAdmins"), where("email", "==", user.username));
          const snap = await getDocs(superQ);
          if (!snap.empty) {
            const superDoc = snap.docs[0];
            // update creatorId as well
            await updateDoc(doc(db, "globiliveAgencies", ref.id), { "creator.creatorId": superDoc.id });
            await updateDoc(doc(db, "globiliveSuperAdmins", superDoc.id), { agencyIds: arrayUnion(ref.id) });
          }
        } catch (e) {
          console.error("attach agency to superadmin error", e);
        }
      }

      // add to UI list
      setAgencies((prev) => [{ id: ref.id, ...agencyPayload }, ...prev]);

      toast({ title: "Agency Created", description: `${newAgencyName} has been added.` });
      setNewAgencyName("");
      setNewAgencyRegion("");
      setNewAgencyEmail("");
      setNewAgencyPassword("");
      setNewAgencyConfirmPassword("");
      setNewAgencySharePercent(0);
      setNewAgencyStatus("Active");
      setAddAgencyOpen(false);
    } catch (err) {
      console.error("create agency error", err);
      toast({ title: "Create Failed", description: "Unable to create agency", variant: "destructive" });
    } finally {
      setIsCreatingAgency(false);
    }
  };

  const copyPublicLink = () => {
    const link = `${window.location.origin}/public/agency-apply`;
    navigator.clipboard.writeText(link);

    toast({
      title: "Link Copied!",
      description: "Public form link copied to clipboard.",
    });
  };

  const getStatusBadge = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
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

  // for sub-admins show only assigned agencies in the main table
  const agenciesToShow = role === "sub-admin" ? assignedAgencies : agencies;

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3-2xl font-bold">{heading}</h2>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={copyPublicLink} className="border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Public Link
              </Button>
              {(role !== "sub-admin" || assignedAgencyIds.length > 0) && (
                <Button onClick={() => { setNewAgencyRegion(superAdminRegion || ""); setAddAgencyOpen(true); }}>
                  <PlusCircle className="mr-2" /> Add Agency
                </Button>
              )}
          </div>
        </div>

        <Card>
          <EnhancedTable
            data={agenciesToShow}
            pageSize={10}
            searchKeys={["name", "code", "region", "status"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Agency Name</TableHead>
                  <TableHead>Agency Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-center">Hosts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(agency: any) => (
              <TableRow key={agency.id}>
                <TableCell className="font-medium">{agency.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {agency.code}
                </TableCell>
                <TableCell>{agency.region}</TableCell>
                <TableCell className="text-center">{agency.hosts}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadge(agency.status)}>
                    {agency.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleAction(agency.id, "View")}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>

                      

                      <DropdownMenuSeparator />

                      {agency.status === "Pending" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(agency.id, "Approve")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(agency.id, "Reject")
                            }
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                          </DropdownMenuItem>
                        </>
                      )}

                      {agency.status === "Active" && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(agency.id, "Block")
                            }
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Ban className="mr-2 h-4 w-4" /> Block Agency
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction(agency.id, "RequestTermination")}
                            className="text-orange-500 focus:bg-orange-500/10 focus:text-orange-500"
                          >
                             <Ban className="mr-2 h-4 w-4" /> Request Termination
                          </DropdownMenuItem>
                        </>
                      )}

                      {(agency.status === "Inactive" || agency.status === "Blocked") && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(agency.id, "Unblock")
                          }
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> Active Agency
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        {role === "sub-admin" && assignedAgencies.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold">Assigned Agencies</h3>
              <div className="mt-3 space-y-2">
                {assignedAgencies.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-muted-foreground">{a.region} · {a.hosts} hosts</p>
                    </div>
                    <Badge variant={getStatusBadge(a.status)}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Reject Dialog */}
        <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Agency Application?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will permanently remove the application.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReject}>
                Confirm Reject
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Block/Unblock Dialog */}
        <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {blockingAgency?.status === "Blocked"
                  ? "Unblock"
                  : "Block"}{" "}
                {blockingAgency?.name}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {blockingAgency?.status === "Blocked"
                  ? "Unblocking will restore access."
                  : "Blocking will disable this agency. Are you sure?"}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBlock}>
                {(blockingAgency?.status === "Inactive" || blockingAgency?.status === "Blocked") ? "Active Agency" : "Inactive Agency"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        

        {/* Terminate Request Dialog */}
        <AlertDialog open={terminateReqOpen} onOpenChange={setTerminateReqOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Request Termination for {terminatingAgency?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Super Admins cannot terminate an agency directly. Please provide a reason to submit a termination request to the Company Admin.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="Enter explicit reason for termination..."
                    value={terminateReason}
                    onChange={e => setTerminateReason(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmTerminateRequest} className="bg-orange-500 hover:bg-orange-600">
                Send Request
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Agency Dialog */}
        <Dialog open={addAgencyOpen} onOpenChange={setAddAgencyOpen}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border">
            <div className="flex flex-col max-h-[90vh] bg-background">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">Add New Agency</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Create a new agency manualy or share a public recruitment link.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Manual Creation Card */}
                  <div className="p-5 rounded-2xl border bg-muted/20 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="h-2 w-2 rounded-full bg-primary" />
                       <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Create Manually</h4>
                    </div>
                    
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold ml-1">Agency Name</label>
                        <Input
                          placeholder="e.g. Velocity Stream"
                          value={newAgencyName}
                          onChange={(e) => setNewAgencyName(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold ml-1">Contact Email</label>
                        <Input
                          placeholder="agency@example.com"
                          type="email"
                          value={newAgencyEmail}
                          onChange={(e) => setNewAgencyEmail(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold ml-1">Password</label>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showPassword ? "text" : "password"}
                              value={newAgencyPassword}
                              onChange={(e) => setNewAgencyPassword(e.target.value)}
                              className="h-11 rounded-xl pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold ml-1">Confirm Password</label>
                          <div className="relative">
                            <Input
                              placeholder="••••••••"
                              type={showConfirmPassword ? "text" : "password"}
                              value={newAgencyConfirmPassword}
                              onChange={(e) => setNewAgencyConfirmPassword(e.target.value)}
                              className="h-11 rounded-xl pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold ml-1">Region</label>
                          <Select value={newAgencyRegion} onValueChange={(val) => setNewAgencyRegion(val)}>
                            <SelectTrigger className="h-11 rounded-xl px-3 border border-input flex items-center justify-between w-full bg-background">
                              <SelectValue placeholder="Select Region" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border rounded-xl shadow-xl overflow-hidden z-[50]">
                              {regions.map((r) => (
                                <SelectItem key={r} value={r} className="p-2 hover:bg-muted cursor-pointer">
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold ml-1">Commission Share %</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={String(newAgencySharePercent)}
                            onChange={(e) => setNewAgencySharePercent(Number(e.target.value || 0))}
                            className="h-11 rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold ml-1">Initial Status</label>
                          <Select value={newAgencyStatus} onValueChange={(val) => setNewAgencyStatus(val)}>
                            <SelectTrigger className="h-11 rounded-xl px-3 border border-input flex items-center justify-between w-full bg-background">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border rounded-xl shadow-xl overflow-hidden z-[50]">
                                <SelectItem value="Active" className="p-2 hover:bg-muted cursor-pointer">Active</SelectItem>
                                <SelectItem value="Inactive" className="p-2 hover:bg-muted cursor-pointer">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleAddAgency} 
                      className="w-full h-12 mt-2 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all gradient-primary" 
                      disabled={isCreatingAgency}
                    >
                      {isCreatingAgency ? (
                        <span className="flex items-center gap-2"><Loading size={18} /> Creating...</span>
                      ) : (
                        "Create and Activate Agency"
                      )}
                    </Button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest leading-none">
                      <span className="bg-background px-3 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* Public Link Card */}
                  <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                       <LinkIcon className="h-4 w-4 text-primary" />
                       <h4 className="font-bold text-sm uppercase tracking-wider text-primary/80">Recruitment Link</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Send this link to potential agency owners. They can fill out an application which will appear in your "Pending" list for approval.
                    </p>
                    <Button
                      onClick={copyPublicLink}
                      variant="secondary"
                      className="w-full h-11 rounded-xl font-semibold border-primary/10"
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy Invitation URL
                    </Button>
                  </div>
                </div>
              </div>
              <DialogClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors sm:hidden" />
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agency Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <div>
                <strong>Name:</strong> {viewing?.name}
              </div>
              <div>
                <strong>Code:</strong> {viewing?.code}
              </div>
              <div>
                <strong>Region:</strong> {viewing?.region}
              </div>
              <div>
                <strong>Hosts:</strong> {viewing?.hosts}
              </div>
              <div>
                <strong>Revenue:</strong> {viewing?.revenue}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <Badge variant={getStatusBadge(viewing?.status)}>
                  {viewing?.status}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        
      </div>
    </DashboardLayout>
  );
}

export default function SuperAdminAgencies() {
  return <AgenciesManagement role="super-admin" />;
}
