import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query as fbQuery, where, getDocs, addDoc, updateDoc, doc, arrayUnion, onSnapshot, deleteDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Edit, Trash2, Copy, Eye, Lock, Unlock, MoreHorizontal, Check, EyeOff, Link as LinkIcon, UserMinus, UserCheck, Ban } from "lucide-react";
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
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type HostSummary = {
  id: number;
  name: string;
  username: string;
  diamonds: number;
  beans: number;
  lastActive: string;
};

type SubAdmin = {
  id: string | number;
  name: string;
  email: string;
  region: string;
  agencies: number;
  status: "Active" | "Inactive";
  share: number;
  diamonds: number;
  beans: number;
  hosts: HostSummary[];
  assignedAgenciesIds?: string[];
};


export default function SubAdmins() {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [superAdminDocId, setSuperAdminDocId] = useState<string | null>(null);
  const [superAdminRegion, setSuperAdminRegion] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("North Region");
  const [agenciesCount, setAgenciesCount] = useState<number | "">("");
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [availableAgencies, setAvailableAgencies] = useState<Array<{id:string;name:string}>>([]);
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [share, setShare] = useState<number | "">("");
  const [diamonds, setDiamonds] = useState<number | "">("");
  const [beans, setBeans] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<SubAdmin | null>(null);

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<SubAdmin | null>(null);

  const [publicLink, setPublicLink] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicLink(`${window.location.origin}/public/sub-admin-apply`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        // find current super-admin doc to get doc id and region
        const supCol = collection(db, "globiliveSuperAdmins");
        const qSup = fbQuery(supCol, where("email", "==", user.username));
        const supSnap = await getDocs(qSup);
        if (!mounted) return;
        if (!supSnap.empty) {
          const supDoc = supSnap.docs[0];
          setSuperAdminDocId(supDoc.id);
          const supData: any = supDoc.data();
          setSuperAdminRegion(supData.region || null);
        }

        // load available agencies created by this super-admin
        const colRef = collection(db, "globiliveAgencies");
        const q = fbQuery(colRef, where("creator.creatorEmail", "==", user.username));
        const snap = await getDocs(q);
        if (!mounted) return;
        const list = snap.docs.map((d) => ({ id: d.id, name: (d.data() as any).name || (d.data() as any).agencyName || d.id }));
        setAvailableAgencies(list);

        // subscribe to subadmins created by this super-admin
        const subCol = collection(db, "globiliveSubAdmins");
        const qSub = fbQuery(subCol, where("creator.creatorEmail", "==", user.username));
        const unsub = onSnapshot(qSub, (s) => {
            const items: SubAdmin[] = s.docs.map((d) => {
            const data: any = d.data();
            const normalizedStatus = data.status === "inActive" ? "Inactive" : (data.status || "Active");
            return {
              id: d.id,
              name: data.name || "",
              email: data.email || "",
              region: data.region || (supSnap.empty ? "" : (supSnap.docs[0].data() as any).region) || "",
              agencies: (data.assignedAgenciesIds && Array.isArray(data.assignedAgenciesIds)) ? data.assignedAgenciesIds.length : (data.agenciesCount ?? 0),
              status: normalizedStatus,
              share: Number(data.share) || 0,
              diamonds: Number(data.diamonds) || 0,
              beans: Number(data.beans) || 0,
              assignedAgenciesIds: (data.assignedAgenciesIds && Array.isArray(data.assignedAgenciesIds)) ? data.assignedAgenciesIds : [],
              hosts: data.hosts || [],
            };
          });
          setAdmins(items);
        }, (err) => {
          console.error('SubAdmins: onSnapshot error', err);
          setAdmins([]);
        });

        return () => { mounted = false; unsub(); };
      } catch (e) {
        console.error("failed to load agencies/subadmins for super-admin", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const regions = ["North Region", "South Region", "East Region", "West Region"];

  const formatNumber = (value: number) => value.toLocaleString();

  const handleCopyLink = async () => {
    if (!publicLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      console.error("Unable to copy link", error);
    }
  };

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setName("");
    setEmail("");
    setRegion("North Region");
    setAgenciesCount("");
    setSelectedAgencyIds([]);
    setPassword("");
    setStatus("Active");
    setShare("");
    setDiamonds("");
    setBeans("");
    setOpen(true);
  }

  function openEdit(admin: SubAdmin) {
    setMode("edit");
    setEditingId(admin.id);
    setName(admin.name);
    setEmail(admin.email);
    setRegion(admin.region);
    setAgenciesCount(admin.agencies ?? "");
    // if admin has agencyIds saved, populate selection
    // populate selected agencies from assignedAgenciesIds saved in firestore
    // @ts-ignore
    setSelectedAgencyIds((admin as any).assignedAgenciesIds || []);
    setStatus(admin.status ?? "Active");
    setShare(admin.share ?? "");
    setDiamonds(admin.diamonds ?? "");
    setBeans(admin.beans ?? "");
    setOpen(true);
  }

  function handleDelete(id: string | number) {
    setDeletingId(id);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (deletingId == null) return;
    try {
        await deleteDoc(doc(db, "globiliveSubAdmins", String(deletingId)));
        setAdmins((prev) => prev.filter((a) => a.id !== deletingId));
    } catch (err) {
        console.error("Delete failed", err);
    } finally {
        setDeletingId(null);
        setDeleteOpen(false);
    }
  }

  function openDetails(admin: SubAdmin) {
    setSelectedAdmin(admin);
    setDetailOpen(true);
  }

  function openStatusDialog(admin: SubAdmin) {
    setStatusTarget(admin);
    setStatusConfirmOpen(true);
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;

    const nextStatus = statusTarget.status === "Active" ? "Inactive" : "Active";
    try {
        await updateDoc(doc(db, "globiliveSubAdmins", String(statusTarget.id)), { status: nextStatus });
        // Snapshot will handle the UI update
    } catch (err) {
        console.error("failed status update", err);
    } finally {
        setStatusTarget(null);
        setStatusConfirmOpen(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Please provide name and email.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        // create subadmin in Firestore
        try {
          const payload: any = {
            name: name.trim(),
            email: email.trim(),
            region: superAdminRegion || region,
            status,
            password: password || "",
            createdAt: Date.now(),
            share: String(share || ""),
            beans: String(beans || ""),
            diamonds: String(diamonds || ""),
            disputesIds: "",
            assignedAgenciesIds: selectedAgencyIds.length ? selectedAgencyIds : null,
            reportsIds: "",
            creator: { creatorEmail: user?.username ?? "", creatorId: superAdminDocId ?? "" },
          };

          const ref = await addDoc(collection(db, "globiliveSubAdmins"), payload);

          // attach subadmin id to current super-admin's subAdminIds
          if (superAdminDocId) {
            try {
              await updateDoc(doc(db, "globiliveSuperAdmins", superAdminDocId), { subAdminIds: arrayUnion(ref.id) });
            } catch (e) {
              console.error("failed to attach subadmin to superadmin", e);
            }
          }

          // add to UI list (will also be picked up by snapshot)
          setAdmins((prev) => [{ id: ref.id, name: payload.name, email: payload.email, region: payload.region, agencies: selectedAgencyIds.length, status: payload.status, share: Number(payload.share) || 0, diamonds: Number(payload.diamonds) || 0, beans: Number(payload.beans) || 0, hosts: [] }, ...prev]);
        } catch (err) {
          console.error("create subadmin error", err);
        }
      } else if (mode === "edit" && editingId != null) {
        // editing existing subadmin - persist changes if it's a firestore doc id (string)
        try {
          const idStr = String(editingId);
          const docRef = doc(db, "globiliveSubAdmins", idStr);
          const payload: any = {
            name: name.trim(),
            email: email.trim(),
            region: superAdminRegion || region,
            status,
            share: String(share || ""),
            assignedAgenciesIds: selectedAgencyIds.length ? selectedAgencyIds : null,
          };
          if (password) payload.password = password;
          await updateDoc(docRef, payload);

          setAdmins((prev) => prev.map((a) => a.id === editingId ? { ...a, name: name.trim(), email: email.trim(), region: payload.region, agencies: selectedAgencyIds.length, status, share: Number(payload.share) || 0 } : a));
        } catch (err) {
          console.error("update subadmin error", err);
        }
      }
    } finally {
      setIsSubmitting(false);
      setOpen(false);
      setEditingId(null);
    }
  }

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">Sub Admins</h2>
            <p className="text-muted-foreground mt-1">Manage sub admin accounts, payouts, and access controls.</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopyLink} className="border-cyan-500/20 text-cyan-600 hover:bg-cyan-500/10">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Public Link
              </Button>
              <Button className="gradient-primary shadow-glow" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Sub Admin
              </Button>
          </div>
        </div>

        <Card>
          <EnhancedTable
            data={admins}
            pageSize={5}
            searchKeys={["name", "email", "region", "status"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Agencies</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Diamonds</TableHead>
                  <TableHead>Beans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(admin: SubAdmin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>{admin.region}</TableCell>
                <TableCell>{admin.agencies}</TableCell>
                <TableCell>{admin.share}%</TableCell>
                <TableCell>{formatNumber(admin.diamonds)}</TableCell>
                <TableCell>{formatNumber(admin.beans)}</TableCell>
                <TableCell>
                  <Badge variant={admin.status === "Active" ? "default" : "destructive"}>{admin.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openDetails(admin)}>
                        <Eye className="mr-2 h-4 w-4" /> View details
                      </DropdownMenuItem>

                      {admin.status === "Active" ? (
                        <DropdownMenuItem onSelect={() => openStatusDialog(admin)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Ban className="mr-2 h-4 w-4" /> Block
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => openStatusDialog(admin)} className="text-green-600 focus:bg-green-500/10 focus:text-green-600">
                            <UserCheck className="mr-2 h-4 w-4" /> Unblock
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onSelect={() => openEdit(admin)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => handleDelete(admin.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-2xl shadow-2xl overflow-hidden border-none sm:border">
            <div className="flex flex-col max-h-[90vh] bg-background">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                <DialogHeader className="text-left border-b pb-4">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                    {mode === "add" ? "Add Sub Admin" : "Edit Sub Admin"}
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Share the onboarding link or create an account directly for a sub admin.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 rounded-xl bg-primary/5 border border-primary/10 p-4">
                  <label className="text-[10px] font-bold uppercase text-primary/70 tracking-widest">Public registration link</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={publicLink} readOnly className="sm:flex-1 bg-background/50 font-mono text-xs" />
                    <Button type="button" variant="outline" onClick={handleCopyLink} className="sm:w-32 h-10 text-xs font-semibold">
                      <Copy className="mr-2 h-3 w-3" />
                      {copyState === "copied" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <form id="subadmin-form" onSubmit={handleSubmit} className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Full Name</label>
                    <Input 
                      placeholder="e.g. John Doe"
                      value={name} 
                      onChange={(event) => setName(event.target.value)} 
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Email Address</label>
                    <Input 
                      type="email" 
                      placeholder="admin@example.com"
                      value={email} 
                      onChange={(event) => setEmail(event.target.value)} 
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Password</label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        autoComplete="new-password"
                        placeholder={mode === "edit" ? "Leave empty to keep current" : "••••••••"}
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
                    <label className="text-sm font-semibold">Assigned Agencies</label>
                    <Select value="-" onValueChange={(val) => {
                      if (val === "-") return;
                      const id = String(val);
                      setSelectedAgencyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                    }}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue>{availableAgencies.length === 0 ? "No agencies available" : (selectedAgencyIds.length ? `${selectedAgencyIds.length} agencies selected` : "Select agencies")}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl overflow-hidden shadow-xl border-muted-foreground/10">
                        {availableAgencies.length === 0 ? (
                          <SelectItem value="-" disabled>No agencies</SelectItem>
                        ) : (
                          availableAgencies.map((a) => (
                            <SelectItem key={a.id} value={a.id} className="cursor-pointer">
                              <div className="flex items-center justify-between w-full pr-2">
                                <span>{a.name}</span>
                                {selectedAgencyIds.includes(a.id) && <Check className="h-4 w-4 text-primary" />}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground ml-1">The sub-admin will only be able to view and manage these selected agencies.</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Commission Share %</label>
                      <Input
                        type="number"
                        placeholder="e.g. 10"
                        value={share}
                        onChange={(event) => setShare(event.target.value === "" ? "" : Number(event.target.value))}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Status</label>
                      <Select value={status} onValueChange={(val: "Active" | "Inactive") => setStatus(val)}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue>{status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Active" className="text-success focus:text-success">Active</SelectItem>
                          <SelectItem value="Inactive" className="text-destructive focus:text-destructive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </form>
              </div>

              <DialogFooter className="p-6 sm:p-8 border-t bg-muted/5">
                <div className="flex gap-3 justify-end w-full">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 rounded-xl font-medium">
                    Cancel
                  </Button>
                  <Button 
                    form="subadmin-form"
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-11 px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loading size={16} /> Saving...</span>
                    ) : (
                      mode === "add" ? "Create Sub Admin" : "Save Changes"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
            <DialogClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-muted transition-colors sm:hidden" />
          </DialogContent>
        </Dialog>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedAdmin?.name}
                {selectedAdmin && (
                  <Badge variant={selectedAdmin.status === "Active" ? "default" : "destructive"}>
                    {selectedAdmin.status}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>{selectedAdmin?.email}</DialogDescription>
            </DialogHeader>

            {selectedAdmin && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">{selectedAdmin.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agencies</p>
                    <p className="font-medium">{selectedAdmin.agencies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Share</p>
                    <p className="font-medium">{selectedAdmin.share}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diamonds</p>
                    <p className="font-medium">{formatNumber(selectedAdmin.diamonds)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beans</p>
                    <p className="font-medium">{formatNumber(selectedAdmin.beans)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hosts</p>
                    <p className="font-medium">{selectedAdmin.hosts.length}</p>
                  </div>
                </div>

                {selectedAdmin.hosts && selectedAdmin.hosts.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <p className="text-sm font-semibold mb-3">Host Roster</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {selectedAdmin.hosts.map((host: any, idx: number) => (
                                <div key={idx} className="p-3 border rounded-lg bg-muted/20 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{host.name || host.hostName || "Unknown Host"}</span>
                                        <span className="text-xs text-muted-foreground">ID: {host.id}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs font-bold text-cyan-600">{host.diamonds?.toLocaleString() || 0} D</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sub Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this sub admin? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{statusTarget?.status === "Active" ? "Block sub admin" : "Unblock sub admin"}</AlertDialogTitle>
              <AlertDialogDescription>
                {statusTarget?.status === "Active"
                  ? "Inactive sub admins lose access immediately and their hosts will be flagged for review."
                  : "Once Active, the sub admin regains access to their agencies and hosts."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange}>
                {statusTarget?.status === "Active" ? "Block" : "Unblock"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
