import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDoc, getDocs, doc, query as fbQuery, where, updateDoc, arrayUnion } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import Loading from "@/components/ui/loading";
import { MoreHorizontal } from "lucide-react";

export default function AgencyApprovals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<"all" | "agency" | "mobile">("all");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsUrls, setDocsUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});

  function startAction(id: string, type: "approve" | "reject") {
    setHandlingId(id);
    setActionType(type);
    setOpen(true);
  }

  async function confirm() {
    if (handlingId == null || !actionType) return;
    setProcessing(true);
    try {
      const appRef = doc(db, "globiliveHostApplications", String(handlingId));
      // set application status in host application doc
      await updateDoc(appRef, { applicationStatus: actionType === "approve" ? "Approved" : "Rejected" });

      if (actionType === "approve") {
        // read application to get hostId and agencyCode
        const aSnap = await getDoc(appRef);
          if (aSnap.exists()) {
            const d: any = aSnap.data();
            const hostId = d.hostId; // user's uid
            const agencyCode = d.agencyCode || d.agency || d.agencyCode;

            // attach hostId to agency's host list (only if we have a user id)
            if (agencyCode) {
              try {
                const appsQ = fbQuery(collection(db, "globiliveAgencies"), where("agencyCode", "==", agencyCode));
                const appsSnap = await getDocs(appsQ);
                if (!appsSnap.empty) {
                  const agencyDoc = appsSnap.docs[0];
                  const agencyRef = doc(db, "globiliveAgencies", agencyDoc.id);
                  if (hostId) {
                    await updateDoc(agencyRef, { agencyHosts: arrayUnion(hostId) });
                    // also set agencyId on the user document
                    try {
                      await updateDoc(doc(db, "globiliveUsers", String(hostId)), { agencyId: agencyDoc.id, host: { hostId: aSnap.id, isHost: true, sourcePlatform: d.sourcePlatform || "" } });
                    } catch (e) {
                      console.error("update user agencyId/host failed", e);
                    }
                  } else {
                    console.warn("approve: hostId missing on application, skipping agencyHosts update");
                  }
                }
              } catch (e) {
                console.error("attach host to agency failed", e);
              }
            }
        }
      }

      // update local UI state
      setRequests((prev) => prev.map((r) => (r.id === handlingId ? { ...r, status: actionType === "approve" ? "Approved" : "Rejected" } : r)));
      toast({ title: actionType === "approve" ? "Approved" : "Rejected", description: `Request has been ${actionType === "approve" ? "approved" : "rejected"}.` });
    } catch (e) {
      console.error("confirm action failed", e);
      toast({ title: "Action Failed", description: "Unable to complete the action.", variant: "destructive" });
    } finally {
      setProcessing(false);
      setHandlingId(null);
      setActionType(null);
      setOpen(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.username) return;
      try {
        setLoadingRequests(true);
        // find agency document for current user (contact email)
        const q = fbQuery(collection(db, "globiliveAgencies"), where("contactEmail", "==", user.username));
        const snaps = await getDocs(q);
        if (!mounted) return;
        if (snaps.empty) {
          setRequests([]);
          setLoadingRequests(false);
          return;
        }
        const agencyDoc = snaps.docs[0];
        const agData: any = agencyDoc.data();
        const appIds: string[] = Array.isArray(agData.hostApplications) ? agData.hostApplications : [];
        if (appIds.length === 0) {
          setRequests([]);
          setLoadingRequests(false);
          return;
        }

        const fetched: any[] = [];
        // fetch each host application doc
        await Promise.all(appIds.map(async (id) => {
          try {
            const aDoc = await getDoc(doc(db, "globiliveHostApplications", id));
            if (aDoc.exists()) {
              const d: any = aDoc.data();
              const appliedRaw = d.appliedAt;
              let dateStr = "";
              if (typeof appliedRaw === "number") dateStr = new Date(appliedRaw).toISOString().slice(0,10);
              else if (typeof appliedRaw === "string") dateStr = appliedRaw;

              // resolve host email from globiliveUsers when hostId is present
              let hostEmail = d.hostCnic || "";
              if (d.hostId) {
                try {
                  const userDoc = await getDoc(doc(db, "globiliveUsers", String(d.hostId)));
                  if (userDoc.exists()) {
                    const ud: any = userDoc.data();
                    hostEmail = ud.email || ud.username || userDoc.id;
                  } else {
                    hostEmail = String(d.hostId);
                  }
                } catch (e) {
                  console.error("fetch host user doc error", d.hostId, e);
                  hostEmail = String(d.hostId);
                }
              }

              fetched.push({
                id: aDoc.id,
                name: d.hostName || "",
                email: hostEmail,
                source: d.sourcePlatform || "",
                code: d.agencyCode || "",
                date: dateStr,
                status: d.applicationStatus || "Pending",
              });
            }
          } catch (e) {
            console.error("fetch host application", id, e);
          }
        }));

        if (mounted) setRequests(fetched);
        if (mounted) setLoadingRequests(false);
      } catch (e) {
        console.error("load agency host applications error", e);
        setLoadingRequests(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  async function handleViewDocs(appId: string) {
    setDocsLoading(true);
    setDocsUrls({});
    try {
      const aDoc = await getDoc(doc(db, "globiliveHostApplications", appId));
      if (!aDoc.exists()) {
        setDocsUrls({});
        setDocsOpen(true);
        return;
      }
      const d: any = aDoc.data();
      const front = d.cninFrontImage || d.cnicFrontImage || d.cnicFront || d.cninFront || d.cninFrontImageUrl || "";
      const back = d.cnicBackImage || d.cnicBack || d.cnicBackImageUrl || "";
      const selfie = d.hostProfileImage || d.profileImage || d.hostProfile || "";
      setDocsUrls({ front: front || undefined, back: back || undefined, selfie: selfie || undefined });
      setDocsOpen(true);
    } catch (e) {
      console.error("load docs for application", appId, e);
      setDocsUrls({});
      setDocsOpen(true);
    } finally {
      setDocsLoading(false);
    }
  }

  return (
    <DashboardLayout role="agency">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Host Approvals</h2>
          <p className="text-muted-foreground mt-1">Approve hosts joining with your agency code</p>
        </div>

        <Tabs value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="agency">Agency Form</TabsTrigger>
            <TabsTrigger value="mobile">Mobile App</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          {loadingRequests ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : (
            <EnhancedTable
              data={requests.filter((r) => {
                if (sourceFilter === "all") return true;
                if (sourceFilter === "agency") return r.source === "Agency Form";
                return r.source === "Mobile App";
              })}
              pageSize={8}
              searchKeys={["name", "email", "code"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell>
                    <Badge variant="default">{r.source}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.code}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocs(r.id)}>
                      View Docs
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={String(r.status).toLowerCase() === "pending" ? "secondary" : "default"}>{r.status}</Badge>
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
                        {String(r.status).toLowerCase() === "pending" ? (
                          <div className="p-2 flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => startAction(r.id, "approve")}>Approve</Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => startAction(r.id, "reject")}>Reject</Button>
                          </div>
                        ) : (
                          <div className="p-2">
                            <Button variant="ghost" size="sm" disabled>No actions available</Button>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}
            />
          )}
        </Card>

        <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Application Documents</DialogTitle>
              <DialogDescription>CNIC front, CNIC back and selfie/profile image.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC Front</p>
                    {docsUrls.front ? <img src={docsUrls.front} alt="cnic-front" className="w-full rounded-md border" /> : <p className="text-sm text-muted-foreground">Not available</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNIC Back</p>
                    {docsUrls.back ? <img src={docsUrls.back} alt="cnic-back" className="w-full rounded-md border" /> : <p className="text-sm text-muted-foreground">Not available</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selfie / Profile</p>
                    {docsUrls.selfie ? <img src={docsUrls.selfie} alt="selfie" className="w-full rounded-md border" /> : <p className="text-sm text-muted-foreground">Not available</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setDocsOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionType === "approve" ? "Approve Host" : "Reject Host"}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === "approve" ? "Approve this host to join your agency?" : "Reject this host's join request?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirm}
                disabled={processing}
                className={actionType === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              >
                {processing ? 'Processing...' : (actionType === "approve" ? "Approve" : "Reject")}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

