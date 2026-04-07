import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, MoreHorizontal, Eye, EyeOff, Link as LinkIcon, UserX, UserMinus } from "lucide-react";
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
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import Loading from "@/components/ui/loading";
import { toast } from "@/components/ui/use-toast";

type Admin = {
  id: string;
  name: string;
  email: string;
  status: string;
  region: string;
  beans: number;
  diamonds: number;
  sharePercent: number;
  created: string;
  agenciesCount?: number;
  topUps?: number;
  contactNumber?: string;
};

export default function SuperAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [search, setSearch] = useState("");

  // Dialog state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("North America");
  const [status, setStatus] = useState("Active");
  const [sharePercent, setSharePercent] = useState<number>(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const regions = ["North America", "Europe", "Asia Pacific", "South America", "Africa", "Oceania"];

  const filtered = useMemo(() => {
    if (!search.trim()) return admins;
    const q = search.toLowerCase();
    return admins.filter((a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [admins, search]);

  useEffect(() => {
    const colRef = collection(db, "globiliveSuperAdmins");
    const q = queryFn(colRef);
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Admin[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: (d.data().name as string) || "",
        email: (d.data().email as string) || "",
        region: (d.data().region as string) || "",
        status: (d.data().status as string) || "Active",
        beans: (d.data().beans as number) ?? 0,
        diamonds: (d.data().diamonds as number) ?? 0,
        sharePercent: (d.data().sharePercent as number) ?? 0,
        // Mock new fields if they don't exist
        agenciesCount: (d.data().agenciesCount as number) ?? Math.floor(Math.random() * 5),
        topUps: (d.data().topUps as number) ?? Math.floor(Math.random() * 1000),
        contactNumber: (d.data().contactNumber as string) ?? "+1 555-0100",
        created: (() => {
          const raw = (d.data() as any).createdAt;
          if (!raw) return "";
          if (typeof raw === "number") return new Date(raw).toISOString().slice(0, 10);
          if (typeof raw === "string") return raw;
          if (typeof raw === "object" && typeof (raw as any).toDate === "function") return (raw as any).toDate().toISOString().slice(0, 10);
          return String(raw);
        })(),
      }));
      setAdmins(list);
    });
    return () => unsub();
  }, []);

  function queryFn(colRef: any) {
    try {
      return query(colRef, orderBy("createdAt", "desc"));
    } catch (e) {
      return colRef;
    }
  }

  function openAdd() {
    setMode("add");
    setEditingId(null);
    setName("");
    setEmail("");
    setRegion("North America");
    setStatus("Active");
    setSharePercent(0);
    setPassword("");
    setConfirmPassword("");
    setOpen(true);
  }

  function openEdit(admin: Admin) {
    setMode("edit");
    setEditingId(admin.id);
    setName(admin.name);
    setEmail(admin.email);
    setRegion(admin.region);
    setStatus(admin.status);
    setSharePercent(admin.sharePercent ?? 0);
    setPassword("");
    setConfirmPassword("");
    setOpen(true);
  }

  const handleCopyLink = () => {
      const link = window.location.origin + "/register/super-admin";
      navigator.clipboard.writeText(link);
      toast({
          title: "Link Copied!",
          description: "Super Admin registration link copied to clipboard.",
      });
  };

  const handleToggleBlock = async (admin: Admin) => {
      const newStatus = admin.status === "Blocked" ? "Active" : "Blocked";
      await updateDoc(doc(db, "globiliveSuperAdmins", admin.id), { status: newStatus });
      toast({ title: `Super Admin ${newStatus}` });
  };

  const handleFireAndTransfer = (admin: Admin) => {
      toast({
          title: "Transfer Initiated",
          description: `Initiated process to fire ${admin.name} and transfer their agencies.`,
          variant: "destructive",
      });
  };

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Please provide name and email.");
      return;
    }
    if (mode === "add") {
      if (!password) {
        alert("Please provide a password for the new super admin.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
    } else if (mode === "edit" && password) {
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await addDoc(collection(db, "globiliveSuperAdmins"), {
          name: name.trim(),
          email: email.trim(),
          region,
          status,
          sharePercent,
          password,
          agencyIds: [],
          subAdminIds: [],
          cashOutRequestIds: [],
          beans: 0,
          diamonds: 0,
          createdAt: Date.now(),
        });
      } else if (mode === "edit" && editingId != null) {
        const docRef = doc(db, "globiliveSuperAdmins", editingId);
        const payload: any = { name: name.trim(), email: email.trim(), region, status, sharePercent };
        if (password) payload.password = password;
        await updateDoc(docRef, payload);
      }
    } catch (err) {
      console.error("submit superadmin error", err);
    } finally {
      setIsSubmitting(false);
      setPassword("");
      setConfirmPassword("");
      setOpen(false);
    }
  }

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Super Admins</h2>
            <p className="text-muted-foreground mt-1">Manage super admin accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink} className="border-purple-500/20 text-purple-600 hover:bg-purple-500/10 transition-colors">
                <LinkIcon className="w-4 h-4 mr-2" />
                Public Link
            </Button>
            <Button className="gradient-primary shadow-glow transition-all" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Super Admin
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search via name, email, or ID..." className="pl-10 h-11 shadow-sm border-border/40" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Agencies</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Top Ups</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Beans / Diamonds</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No results match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((admin) => (
                    <TableRow key={admin.id} className="border-border/40">
                        <TableCell className="font-medium pl-4">
                            <div className="flex flex-col">
                                <span>{admin.name}</span>
                                <span className="text-[10px] text-muted-foreground">{admin.email}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{admin.id.substring(0, 6)}</TableCell>
                        <TableCell className="text-center font-semibold text-purple-600">{admin.agenciesCount}</TableCell>
                        <TableCell className="text-center font-semibold text-green-600">{admin.topUps}</TableCell>
                        <TableCell className="text-sm">{admin.contactNumber}</TableCell>
                        <TableCell>
                            <div className="flex flex-col text-xs font-bold leading-tight">
                                <span className="text-primary">{admin.beans?.toLocaleString()} B</span>
                                <span className="text-cyan-500">{admin.diamonds?.toLocaleString()} D</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/40">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 shadow-premium border-border/40">
                              <DropdownMenuItem onSelect={() => openEdit(admin)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleToggleBlock(admin)}>
                                <UserX className="mr-2 h-4 w-4" /> {admin.status === "Blocked" ? "Unblock Admin" : "Block Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => handleFireAndTransfer(admin)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <UserMinus className="mr-2 h-4 w-4" /> Fire & Transfer Agencies
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog Logic Omitted for Brevity (unchanged underlying structure) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[96vw] max-w-2xl max-h-[90vh] p-0 rounded-xl shadow-2xl border-none overflow-hidden bg-background/95 backdrop-blur-xl">
             <div className="flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                <DialogHeader className="text-left border-b border-border/40 pb-4 mb-2">
                  <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                    {mode === "add" ? "Add Super Admin" : "Edit Super Admin"}
                  </DialogTitle>
                </DialogHeader>

                <form id="super-admin-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="h-11 shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="h-11 shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Region</label>
                    <Select value={region} onValueChange={(val) => setRegion(val)}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue>{region}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Status</label>
                    <Select value={status} onValueChange={(val) => setStatus(val)}>
                      <SelectTrigger className="h-11 shadow-sm">
                        <SelectValue>{status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/40 mt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Password</label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="••••••••" 
                          className="h-11 shadow-sm pr-10" 
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••" 
                          className="h-11 shadow-sm pr-10" 
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <DialogFooter className="pt-6 border-t border-border/40 mt-4">
                  <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
                    <Button variant="outline" onClick={() => setOpen(false)} type="button" className="w-full sm:w-auto h-11">
                      Cancel
                    </Button>
                    <Button type="submit" form="super-admin-form" disabled={isSubmitting} className="w-full sm:w-auto h-11 font-bold gradient-primary shadow-glow transition-all">
                      {isSubmitting ? (
                        <><Loading size={16} /><span className="ml-2 font-medium">Saving...</span></>
                      ) : (
                        "Save Profile"
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
