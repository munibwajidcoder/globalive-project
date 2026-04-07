import { DashboardLayout } from "@/components/DashboardLayout";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDoc, getDocs, doc, query as fbQuery, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HostsManagementRole = "super-admin" | "sub-admin" | "agency";

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
  author: string;
  note: string;
  createdAt: string;
};

type HostRecord = {
  id: string | number;
  name: string;
  agency: string;
  level: string;
  diamonds: number;
  beans: number;
  status: "Active" | "Blocked" | "Pending";
  performance: "Excellent" | "Great" | "Good" | "Average";
  submittedVia: "Agency Form" | "Mobile App";
  formSubmittedAt: string;
  lastActive: string;
  contactPhone: string;
  contactEmail: string;
  country: string;
  timezone: string;
  identityStatus: "Verified" | "Pending" | "Rejected";
  beansHistory: LedgerEntry[];
  diamondsHistory: LedgerEntry[];
  moderationNotes: ModerationNote[];
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });



const statusBadgeVariant: Record<HostRecord["status"], "default" | "destructive" | "secondary"> = {
  Active: "default",
  Blocked: "destructive",
  Pending: "secondary",
};

const performanceBadgeVariant: Record<HostRecord["performance"], "default" | "secondary"> = {
  Excellent: "default",
  Great: "default",
  Good: "secondary",
  Average: "secondary",
};

const sourceBadgeVariant: Record<HostRecord["submittedVia"], "default" | "outline"> = {
  "Agency Form": "default",
  "Mobile App": "outline",
};

const channelLabel: Record<LedgerEntry["channel"], string> = {
  campaign: "Campaign",
  gift: "Gifts",
  bonus: "Bonus",
  withdrawal: "Withdrawal",
  purchase: "Purchase",
};

function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

function formatAmount(amount: number) {
  return numberFormatter.format(amount);
}

export function HostsManagement({ role = "super-admin" }: { role?: HostsManagementRole }) {
  const [hosts, setHosts] = useState<HostRecord[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (role !== "agency") return;
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user.username));
        const snaps = await getDocs(q);
        if (!mounted) return;
        if (snaps.empty) {
          setHosts([]);
          return;
        }
        const agencyDoc = snaps.docs[0];
        const aData: any = agencyDoc.data();
        const hostIds: string[] = Array.isArray(aData.agencyHosts) ? aData.agencyHosts : [];
        if (hostIds.length === 0) {
          setHosts([]);
          return;
        }

        const fetched = await Promise.all(hostIds.map(async (hid) => {
          try {
            const uDoc = await getDoc(doc(db, "globiliveUsers", String(hid)));
            if (!uDoc.exists()) return null;
            const ud: any = uDoc.data();
            return {
              id: uDoc.id,
              name: ud.name || ud.email || ud.username || "",
              agency: aData.name || aData.agencyName || "",
              level: ud.level?.level ? `Level ${ud.level.level}` : "",
              diamonds: Number(ud.diamonds || 0),
              beans: Number(ud.beans || 0),
              status: ud.host?.isHost ? "Active" : "Pending",
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
        }));

        if (mounted) setHosts(fetched.filter(Boolean) as HostRecord[]);
      } catch (e) {
        console.error("load agency hosts error", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, [role, user]);
  
  useEffect(() => {
    if (role !== "super-admin") return;
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        const q = fbQuery(collection(db, "globiliveAgencies"), where("creator.creatorEmail", "==", user.username));
        const snaps = await getDocs(q);
        if (!mounted) return;
        if (snaps.empty) {
          setHosts([]);
          return;
        }

        // gather host ids from all agencies created by this super-admin
        const hostPairs: Array<{ hid: string; agencyName: string }> = [];
        snaps.docs.forEach((aDoc) => {
          const aData: any = aDoc.data();
          const hostIds: string[] = Array.isArray(aData.agencyHosts) ? aData.agencyHosts : [];
          const agencyName = aData.name || aData.agencyName || aDoc.id;
          hostIds.forEach((hid) => hostPairs.push({ hid: String(hid), agencyName }));
        });

        if (hostPairs.length === 0) {
          setHosts([]);
          return;
        }

        // de-duplicate by host id, prefer the first agency name encountered
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
                status: ud.host?.isHost ? "Active" : "Pending",
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
        console.error("load super-admin agencies hosts error", e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [role, user]);

  useEffect(() => {
    if (role !== "sub-admin") return;
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        // load current sub-admin doc to read assigned agencies
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

        // collect host ids from each assigned agency
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
                status: ud.host?.isHost ? "Active" : "Pending",
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
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<HostRecord | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<HostRecord | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageTo, setMessageTo] = useState<HostRecord | null>(null);
  const [messageBody, setMessageBody] = useState("");

  const pageTitle = useMemo(() => {
    if (role === "agency") return "Hosts Intake";
    if (role === "sub-admin") return "Agency Hosts";
    return "Hosts";
  }, [role]);

  const pageDescription = useMemo(() => {
    if (role === "agency") return "Review every host submission, manage status, and drill into beans and diamonds history.";
    if (role === "sub-admin") return "Full visibility into host performance across your assigned agencies.";
    return "Monitor host activity across all agencies and resolve escalations quickly.";
  }, [role]);

  const openView = (host: HostRecord) => {
    setViewing(host);
    setViewOpen(true);
  };

  const openStatusChange = (host: HostRecord) => {
    setStatusTarget(host);
    setStatusDialogOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;
    const nextStatus: HostRecord["status"] = statusTarget.status === "Active" ? "Blocked" : "Active";
    
    try {
      // Update the user document in globiliveUsers collection
      // The host status is usually stored inside the 'host' object or similar
      // Based on useEffect, the status is derived from ud.host?.isHost
      // However, the 'Blocked' status might need a dedicated 'status' field or a 'blocked' flag.
      // Let's safe-guard by updating both a general status and the host-specific block if applicable.
      await updateDoc(doc(db, "globiliveUsers", String(statusTarget.id)), {
        status: nextStatus,
        "host.status": nextStatus,
        updatedAt: serverTimestamp(),
      });

      setHosts((prev) => prev.map((host) => (host.id === statusTarget.id ? { ...host, status: nextStatus } : host)));
      toast({
        title: nextStatus === "Blocked" ? "Host blocked" : "Host unblocked",
        description: `${statusTarget.name} is now ${nextStatus}.`,
      });
    } catch (error) {
      console.error("Error updating host status:", error);
      toast({
        title: "Error",
        description: "Failed to update host status in Firestore.",
        variant: "destructive",
      });
    } finally {
      setStatusTarget(null);
      setStatusDialogOpen(false);
    }
  };

  const openMessage = (host: HostRecord) => {
    setMessageTo(host);
    setMessageBody("");
    setMessageOpen(true);
  };

  const sendMessage = () => {
    if (!messageTo || !messageBody.trim()) {
      toast({ title: "Message empty", description: "Add a quick update before sending." });
      return;
    }
    toast({ title: "Message queued", description: `Your note to ${messageTo.name} has been logged.` });
    setMessageOpen(false);
    setMessageTo(null);
    setMessageBody("");
  };

  const copyContact = (value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast({ title: "Copy unavailable", description: "Clipboard access is not supported in this environment." });
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast({ title: "Copied", description: value });
      })
      .catch(() => {
        toast({ title: "Copy failed", description: "Try copying the contact manually." });
      });
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold">{pageTitle}</h2>
            <p className="mt-1 text-muted-foreground">{pageDescription}</p>
          </div>
          <Badge variant="outline" className="inline-flex items-center gap-2">
            <Smartphone className="h-3.5 w-3.5" />
            Hosts submitting via forms & mobile are synced in real time
          </Badge>
        </div>

        <Card>
          <EnhancedTable
            data={hosts}
            pageSize={8}
            searchKeys={["name", "agency", "level", "contactPhone", "contactEmail", "status", "submittedVia"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Diamonds</TableHead>
                  <TableHead>Beans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(host: HostRecord) => (
              <TableRow key={host.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{host.name}</span>
                    <span className="text-xs text-muted-foreground">{host.contactEmail}</span>
                  </div>
                </TableCell>
                <TableCell>{host.agency}</TableCell>
                <TableCell>
                  <Badge variant={sourceBadgeVariant[host.submittedVia]}>{host.submittedVia}</Badge>
                </TableCell>
                <TableCell>{host.level}</TableCell>
                <TableCell className="font-semibold text-primary">{formatAmount(host.diamonds)} 💎</TableCell>
                <TableCell className="font-semibold text-emerald-600">{formatAmount(host.beans)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[host.status]}>{host.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(host)}>
                        <Eye className="mr-2 h-4 w-4" /> View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openMessage(host)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Message host
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openStatusChange(host)}>
                        {host.status === "Active" ? (
                          <>
                            <UserMinus className="mr-2 h-4 w-4" /> Block
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" /> Unblock
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Edit profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        <Dialog
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) setViewing(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewing?.name}</DialogTitle>
              <DialogDescription>
                {viewing ? `${viewing.agency} • ${viewing.level}` : ""}
              </DialogDescription>
            </DialogHeader>

            {viewing && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="beans">Beans history</TabsTrigger>
                  <TabsTrigger value="diamonds">Diamonds history</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card className="border bg-muted/40 p-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Form submitted</p>
                        <p>{formatDateTime(viewing.formSubmittedAt)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Last active</p>
                        <p>{formatDateTime(viewing.lastActive)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Identity</p>
                        <Badge variant={viewing.identityStatus === "Verified" ? "default" : "secondary"}>
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {viewing.identityStatus}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Application source</p>
                        <Badge variant={sourceBadgeVariant[viewing.submittedVia]}>{viewing.submittedVia}</Badge>
                      </div>
                    </div>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-4">
                      <h3 className="text-sm font-semibold">Contact</h3>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Phone</span>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => copyContact(viewing.contactPhone)}>
                            <ClipboardCopy className="mr-2 h-4 w-4" /> {viewing.contactPhone}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Email</span>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => copyContact(viewing.contactEmail)}>
                            <ClipboardCopy className="mr-2 h-4 w-4" /> {viewing.contactEmail}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Region</span>
                          <span>{viewing.country}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Timezone</span>
                          <span>{viewing.timezone}</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h3 className="text-sm font-semibold">Performance snapshot</h3>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Diamonds (last 30 days)</span>
                          <span className="font-semibold text-primary">{formatAmount(viewing.diamonds)} 💎</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Beans balance</span>
                          <span className="font-semibold text-emerald-600">{formatAmount(viewing.beans)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={statusBadgeVariant[viewing.status]}>{viewing.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Performance</span>
                          <Badge variant={performanceBadgeVariant[viewing.performance]}>{viewing.performance}</Badge>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h3 className="text-sm font-semibold">Moderation notes</h3>
                    <ScrollArea className="mt-3 h-40 rounded-md border">
                      <div className="divide-y text-sm">
                        {viewing.moderationNotes.length === 0 ? (
                          <div className="p-4 text-muted-foreground">No notes yet.</div>
                        ) : (
                          viewing.moderationNotes.map((note) => (
                            <div key={note.id} className="p-4">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{note.author}</span>
                                <span>{formatDateTime(note.createdAt)}</span>
                              </div>
                              <p className="mt-2 leading-relaxed">{note.note}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </TabsContent>

                <TabsContent value="beans">
                  <ScrollArea className="h-72 rounded-md border">
                    <div className="divide-y">
                      {viewing.beansHistory.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No beans activity on record.</div>
                      ) : (
                        viewing.beansHistory.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                            <div>
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(entry.date)} • {channelLabel[entry.channel]}
                              </p>
                            </div>
                            <Badge variant={entry.type === "credit" ? "default" : "secondary"}>
                              {entry.type === "credit" ? "+" : "-"}
                              {formatAmount(entry.amount)}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="diamonds">
                  <ScrollArea className="h-72 rounded-md border">
                    <div className="divide-y">
                      {viewing.diamondsHistory.length === 0 ? (
                        <div className="p-6 text-sm text-muted-foreground">No diamonds activity on record.</div>
                      ) : (
                        viewing.diamondsHistory.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between gap-4 p-4 text-sm">
                            <div>
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(entry.date)} • {channelLabel[entry.channel]}
                              </p>
                            </div>
                            <Badge variant={entry.type === "credit" ? "default" : "secondary"}>
                              {entry.type === "credit" ? "+" : "-"}
                              {formatAmount(entry.amount)} 💎
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}

            <DialogClose />
          </DialogContent>
        </Dialog>

        <Dialog
          open={messageOpen}
          onOpenChange={(open) => {
            setMessageOpen(open);
            if (!open) {
              setMessageTo(null);
              setMessageBody("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message host</DialogTitle>
              <DialogDescription>
                {messageTo ? `Send a quick note to ${messageTo.name}` : ""}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Share guidance or follow-up details..."
              rows={4}
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendMessage}>Send</Button>
            </div>
            <DialogClose />
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={statusDialogOpen}
          onOpenChange={(open) => {
            setStatusDialogOpen(open);
            if (!open) setStatusTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{statusTarget?.status === "Active" ? "Block host" : "Unblock host"}</AlertDialogTitle>
              <AlertDialogDescription>
                {statusTarget
                  ? `Confirm you want to ${statusTarget.status === "Active" ? "block" : "restore"} ${statusTarget.name}.`
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggleStatus}>Confirm</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

export default function SuperAdminHosts() {
  return <HostsManagement role="super-admin" />;
}
