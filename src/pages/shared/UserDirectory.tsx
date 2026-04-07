import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, MoreHorizontal, ShieldBan, UserX } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type RoleId = "company" | "super-admin" | "sub-admin" | "agency" | "reseller" | "topup-agent";

type Transaction = {
  id: number;
  type: "purchase" | "gift" | "transfer";
  amount: number;
  from: string;
  date: string;
};

type DirectoryUser = {
  id: string | number;
  docId?: string;
  name: string;
  contact: string;
  beans: number;
  diamonds: number;
  status: "Active" | "Blocked" | "Suspended";
  blockedUntil: string | null;
  joinedDate: string;
  friends: number;
  likes: number;
  shares: number;
  views: number;
  liveStatus: "Offline" | "Live";
  gamesStatus: "Active" | "Inactive";
  gamesWon: number;
  gamesLost: number;
  beanTransactions: Transaction[];
  diamondTransactions: Transaction[];
};

// Dummy `initialUsers` removed — users now loaded from Firestore only.

const roleDescriptions: Record<RoleId, string> = {
  company: "Full list of users not registered under any agency or host.",
  "super-admin": "Global user directory for independent viewers and gifters.",
  "sub-admin": "Monitor independent users before assigning them to agencies or hosts.",
  agency: "Prospect users without agency affiliations for recruitment or engagement.",
  reseller: "Manage your customer base and monitor user bean balances.",
  "topup-agent": "Monitor users across your reseller network.",
};

interface UserDirectoryProps {
  role: RoleId;
  title?: string;
  description?: string;
}

export function UserDirectory({ role, title = "Users", description }: UserDirectoryProps) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const effectiveDescription = useMemo(
    () => description ?? roleDescriptions[role],
    [description, role],
  );

  useEffect(() => {
    // Subscribe to Firestore users and update local state
    const usersRef = collection(db, "globiliveUsers");
    const unsub = onSnapshot(usersRef, (snapshot) => {
      const filteredDocs = role === "company" 
        ? snapshot.docs.filter((d) => {
            const data = d.data() as any;
            return !data.isHost && data.role !== "host" && !data.agencyId;
          })
        : snapshot.docs;

      const docs = filteredDocs.map((d) => {
        const data = d.data() as any;
        const rawStatus = data.status as string | undefined;
        let status: "Active" | "Blocked" | "Suspended" = "Active";
        if (rawStatus === 'suspend' || rawStatus === 'Suspended' || data.isSuspended) status = 'Suspended';
        else if (rawStatus === 'blocked' || rawStatus === 'Blocked' || data.isBlocked) status = 'Blocked';

        return {
          docId: d.id,
          id: data.yeahLiveId ?? data.userId ?? d.id,
          name: data.name ?? data.email ?? "-",
          contact: data.email ?? "",
          beans: Number(data.beans ?? 0),
          diamonds: Number(data.diamonds ?? 0),
          status,
          blockedUntil: data.blockedUntil ?? null,
          joinedDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "10/23/2024",
          friends: Array.isArray(data.friends) ? data.friends.length : 0,
          likes: data.likes ?? 0,
          shares: data.shares ?? 0,
          views: data.views ?? 0,
          liveStatus: data.isLive ? "Live" : "Offline",
          gamesStatus: data.gamesStatus ?? "Inactive",
          gamesWon: data.gamesWon ?? 0,
          gamesLost: data.gamesLost ?? 0,
          beanTransactions: data.beanTransactions ?? [],
          diamondTransactions: data.diamondTransactions ?? [],
        } as DirectoryUser;
      });

      setUsers(docs);
    });

    return () => unsub();

    const timer = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => {
          if (!user.blockedUntil) {
            return user;
          }
          const expires = new Date(user.blockedUntil);
          if (expires <= new Date()) {
            return { ...user, status: "Active", blockedUntil: null };
          }
          return user;
        }),
      );
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  const openProfile = (user: DirectoryUser) => {
    setSelectedUser(user);
    setViewOpen(true);
  };

  const handleBlock = async (user: DirectoryUser, duration: "permanent" | number) => {
    if (!user.docId) {
      toast({ title: "Error", description: "Missing user document id." });
      return;
    }

    try {
      const userRef = doc(db, "globiliveUsers", user.docId);
      if (duration === "permanent") {
        await updateDoc(userRef, { status: "blocked", blockedUntil: null });
        toast({ title: "User blocked", description: `${user.name} has been permanently blocked.` });
        return;
      }

      let ms = duration * 60 * 60 * 1000;
      if (duration === 24) ms = 24 * 60 * 60 * 1000;

      const blockedUntil = new Date(Date.now() + ms).toISOString();
      await updateDoc(userRef, { status: "blocked", blockedUntil });
      toast({ title: "User blocked", description: `${user.name} has been temporarily blocked.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update user status." });
    }
  };

  const handleUnblock = async (user: DirectoryUser) => {
    if (!user.docId) {
      toast({ title: "Error", description: "Missing user document id." });
      return;
    }

    try {
      const userRef = doc(db, "globiliveUsers", user.docId);
      await updateDoc(userRef, { status: "active", blockedUntil: null });
      toast({ title: "Status updated", description: `${user.name} is active again.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update user status." });
    }
  };

  const handleSuspendToggle = (user: DirectoryUser) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const confirmSuspendToggle = () => {
    (async () => {
      if (!selectedUser) return;
      if (!selectedUser.docId) {
        toast({ title: "Error", description: "Missing user document id." });
        setBlockDialogOpen(false);
        setSelectedUser(null);
        return;
      }

      try {
        const userRef = doc(db, "globiliveUsers", selectedUser.docId);
        const willUnsuspend = selectedUser.status === "Suspended";
        const newStatus = willUnsuspend ? "active" : "suspend";
        await updateDoc(userRef, { status: newStatus });

        toast({
          title: willUnsuspend ? "User unsuspended" : "User suspended",
          description: `${selectedUser.name} has been ${willUnsuspend ? "reactivated" : "suspended"}.`,
        });
      } catch (err) {
        toast({ title: "Error", description: "Failed to update user status." });
      } finally {
        setBlockDialogOpen(false);
        setSelectedUser(null);
      }
    })();
  };

  const renderStatusBadge = (user: DirectoryUser) => {
    if (user.status === "Suspended") {
      return <Badge variant="secondary">Suspended</Badge>;
    }

    if (user.status === "Blocked") {
      const suffix = user.blockedUntil
        ? ` until ${new Date(user.blockedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : " (permanent)";
      return <Badge variant="destructive">Blocked{suffix}</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{effectiveDescription}</p>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <EnhancedTable
            data={users}
            pageSize={10}
            searchKeys={["name", "id", "contact", "status"]}
            filterSchema={[
              { key: "status", label: "Status" },
              { key: "beans", label: "Beans (Min)", type: "number" },
              { key: "diamonds", label: "Diamonds (Min)", type: "number" },
            ]}
            columns={
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">User Details</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Global ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Contact Info</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Diamond Vault</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Bean Wallet</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Account Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Joined Date</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(user: DirectoryUser) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.contact}</TableCell>
                <TableCell>{user.diamonds.toLocaleString()}</TableCell>
                <TableCell>{user.beans.toLocaleString()}</TableCell>
                <TableCell>{renderStatusBadge(user)}</TableCell>
                <TableCell>{user.joinedDate}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openProfile(user)}>
                        <Eye className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <UserX className="mr-2 h-4 w-4" /> Block Account
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleBlock(user, "permanent")}>
                              Permanent Block
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlock(user, 2)}>
                              Temporary (2 hours)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlock(user, 3)}>
                              Temporary (3 hours)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlock(user, 5)}>
                              Temporary (5 hours)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlock(user, 24)}>
                              Temporary (1 day)
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuItem onClick={() => handleUnblock(user)}>
                        <ShieldBan className="mr-2 h-4 w-4" /> Unblock Account
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSuspendToggle(user)}>
                        <ShieldBan className="mr-2 h-4 w-4" />
                        {user.status === "Suspended" ? "Unsuspend" : "Suspend"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              Profile and ledger details for independent user accounts.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile Facts</TabsTrigger>
                <TabsTrigger value="beans">Beans Activity</TabsTrigger>
                <TabsTrigger value="diamonds">Diamond Activity</TabsTrigger>
                <TabsTrigger value="games">Games Status</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">User ID</p>
                    <p className="font-bold">{selectedUser.id}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Contact</p>
                    <p className="font-bold">{selectedUser.contact}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Friends Count</p>
                    <p className="font-bold">{selectedUser.friends.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Live Streaming Status</p>
                    <p className="font-bold">{selectedUser.liveStatus}</p>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Feed Likes</p>
                    <p className="font-bold">{selectedUser.likes.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Video Shares</p>
                    <p className="font-bold">{selectedUser.shares.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Profile Views</p>
                    <p className="font-bold">{selectedUser.views.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl shadow-sm border border-border/40 hover:bg-muted/70 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Joined Date</p>
                    <p className="font-bold">{selectedUser.joinedDate}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="beans" className="space-y-4 pt-4">
                <Card className="border-border/40 shadow-sm bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Bean Purchasing & Receiving</CardTitle>
                    <p className="text-xs text-muted-foreground">Transactions related to Top-up Agents and Super Admins.</p>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Transaction Type</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Purchased From (Source)</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.beanTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No bean purchase or receiving activity recorded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedUser.beanTransactions.map((tx) => (
                            <TableRow key={tx.id} className="border-border/40">
                              <TableCell className="capitalize font-medium">{tx.type}</TableCell>
                              <TableCell>{tx.from}</TableCell>
                              <TableCell className="font-bold text-primary">+{tx.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{tx.date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="diamonds" className="space-y-4 pt-4">
                <Card className="border-border/40 shadow-sm bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">Diamond Receiving</CardTitle>
                    <p className="text-xs text-muted-foreground">Gifting records and received diamonds.</p>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Transaction Type</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Received From</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.diamondTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No diamond receiving activity recorded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedUser.diamondTransactions.map((tx) => (
                            <TableRow key={tx.id} className="border-border/40">
                              <TableCell className="capitalize font-medium">{tx.type}</TableCell>
                              <TableCell>{tx.from}</TableCell>
                              <TableCell className="font-bold text-cyan-400">+{tx.amount.toLocaleString()}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{tx.date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="games" className="space-y-4 pt-4">
                 <div className="grid gap-4 sm:grid-cols-3">
                    <div className="bg-muted/50 p-6 rounded-xl shadow-sm border border-border/40 flex flex-col justify-center">
                         <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Gaming Status</p>
                         <p className="font-bold text-2xl">{selectedUser.gamesStatus}</p>
                    </div>
                    <div className="bg-green-500/10 p-6 rounded-xl shadow-sm flex flex-col justify-center border border-green-500/20">
                         <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-widest font-black mb-1">Games Won</p>
                         <p className="font-black text-3xl text-green-600 dark:text-green-400">{selectedUser.gamesWon.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-500/10 p-6 rounded-xl shadow-sm flex flex-col justify-center border border-red-500/20">
                         <p className="text-[10px] text-red-600 dark:text-red-400 uppercase tracking-widest font-black mb-1">Games Lost</p>
                         <p className="font-black text-3xl text-red-600 dark:text-red-400">{selectedUser.gamesLost.toLocaleString()}</p>
                    </div>
                 </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === "Suspended" ? "Unsuspend account" : "Suspend account"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === "Suspended"
                ? "The user will regain access to the platform immediately."
                : "The user will be prevented from logging in until reactivated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSuspendToggle}>
              {selectedUser?.status === "Suspended" ? "Unsuspend" : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
