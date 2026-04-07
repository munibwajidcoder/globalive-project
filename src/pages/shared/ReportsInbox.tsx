import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EnhancedTable from "@/components/ui/EnhancedTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

type ReportsRole = "super-admin" | "company" | "sub-admin" | "agency";
type ReportStatus = "New" | "Reviewing" | "Resolved";
type ReportSeverity = "Low" | "Medium" | "High" | "Critical";
type TargetStatus = "Active" | "Blocked" | "Terminated";

type ReportAttachment = {
  id: string;
  type: "screen-recording" | "text";
  title: string;
  content?: string;
  url?: string;
};

type ReportRecordBase = {
  id: string;
  reporter: {
    name: string;
    id: string;
    role: "viewer" | "host";
    contact: string;
  };
  target: {
    name: string;
    id: string;
    type: "user" | "host";
  };
  summary: string;
  submittedAt: string;
  status: ReportStatus;
  severity: ReportSeverity;
  targetStatus: TargetStatus;
  attachments: ReportAttachment[];
  notes?: string;
};

type ReportRecord = ReportRecordBase & {
  searchIndex: string;
};

const buildSearchIndex = (report: ReportRecordBase) =>
  [
    report.id,
    report.reporter.name,
    report.reporter.id,
    report.reporter.role,
    report.target.name,
    report.target.id,
    report.target.type,
    report.summary,
    report.status,
    report.severity,
    report.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();

const normalizeReport = (report: ReportRecordBase | ReportRecord): ReportRecord => {
  const base: ReportRecordBase = "searchIndex" in report
    ? (({ searchIndex: _omit, ...rest }: ReportRecord) => rest)(report)
    : report;

  return {
    ...base,
    searchIndex: buildSearchIndex(base),
  };
};

const seedReports: ReportRecord[] = [
  normalizeReport({
    id: "RPT-2025-1001",
    reporter: {
      name: "Sophia Diaz",
      id: "USR-44321",
      role: "viewer",
      contact: "+1 202 555 0189",
    },
    target: {
      name: "Host Aurora",
      id: "HST-9932",
      type: "host",
    },
    summary: "Alleged harassment during a live stream segment.",
    submittedAt: "2025-11-13T09:32:00Z",
    status: "New",
    severity: "High",
    targetStatus: "Active",
    attachments: [
      {
        id: "att-1",
        type: "screen-recording",
        title: "Screen recording excerpt",
        url: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
      },
      {
        id: "att-2",
        type: "text",
        title: "Reporter statement",
        content: "The host repeatedly made offensive remarks after being asked to stop by several viewers.",
      },
    ],
    notes: "Awaiting moderation review.",
  }),
  normalizeReport({
    id: "RPT-2025-1002",
    reporter: {
      name: "Kai Johnson",
      id: "HST-2288",
      role: "host",
      contact: "+1 321 555 0194",
    },
    target: {
      name: "User NovaSkies",
      id: "USR-77821",
      type: "user",
    },
    summary: "Spam and abusive chat messages during collaborative session.",
    submittedAt: "2025-11-12T18:04:00Z",
    status: "Reviewing",
    severity: "Medium",
    targetStatus: "Blocked",
    attachments: [
      {
        id: "att-3",
        type: "screen-recording",
        title: "Chat overlay capture",
        url: "https://storage.googleapis.com/coverr-main/mp4/Nature_Beauty.mp4",
      },
      {
        id: "att-4",
        type: "text",
        title: "Host report notes",
        content: "User flooded the chat with hateful language and spam links for approximately three minutes.",
      },
    ],
    notes: "Automatic temporary block applied while under review.",
  }),
  normalizeReport({
    id: "RPT-2025-1003",
    reporter: {
      name: "Amina Chen",
      id: "USR-90442",
      role: "viewer",
      contact: "+44 20 7946 0958",
    },
    target: {
      name: "Host Rhythmix",
      id: "HST-5510",
      type: "host",
    },
    summary: "Suspected unauthorized promotion of third-party services.",
    submittedAt: "2025-11-11T13:25:00Z",
    status: "Resolved",
    severity: "Low",
    targetStatus: "Active",
    attachments: [
      {
        id: "att-5",
        type: "text",
        title: "Viewer complaint",
        content: "Host briefly displayed a link to an external tipping service. Moderation team confirmed it was an approved sponsor.",
      },
    ],
    notes: "Verified sponsor relationship. No further action required.",
  }),
];

const severityVariant: Record<ReportSeverity, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  Low: { label: "Low", variant: "secondary" },
  Medium: { label: "Medium", variant: "default" },
  High: { label: "High", variant: "destructive" },
  Critical: { label: "Critical", variant: "destructive" },
};

interface ReportsInboxProps {
  role: ReportsRole;
  title?: string;
  description?: string;
}

export function ReportsInbox({ role, title = "Reports & Complaints", description }: ReportsInboxProps) {
  const [reports, setReports] = useState<ReportRecord[]>(seedReports);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    mode: "block" | "terminate" | "resolve" | null;
    reportId: string | null;
  }>({ mode: null, reportId: null });

  const canModerate = role !== "agency"; // agency = view-only; sub-admin, company, super-admin can moderate

  const effectiveDescription = description ?? "Review user and host complaints submitted from the mobile app.";

  const metrics = useMemo(() => {
    const total = reports.length;
    const active = reports.filter((r) => r.status !== "Resolved").length;
    const escalated = reports.filter((r) => r.severity === "High" || r.severity === "Critical").length;
    return { total, active, escalated };
  }, [reports]);

  const openDetails = (report: ReportRecord) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const updateReport = (id: string, updater: (report: ReportRecord) => ReportRecord) => {
    let next: ReportRecord | null = null;
    setReports((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }
        next = normalizeReport(updater(item));
        return next;
      }),
    );
    setSelectedReport((prev) => {
      if (!prev || prev.id !== id) {
        return prev;
      }
      return next ?? normalizeReport(updater(prev));
    });
  };

  const requestModeration = (mode: "block" | "terminate" | "resolve", reportId: string) => {
    setConfirmAction({ mode, reportId });
  };

  const applyModeration = () => {
    if (!confirmAction.mode || !confirmAction.reportId) {
      return;
    }

    const mode = confirmAction.mode;
    const reportId = confirmAction.reportId;

    if (mode === "block") {
      updateReport(reportId, (report) => ({
        ...report,
        targetStatus: "Blocked",
        status: report.status === "Resolved" ? "Resolved" : "Reviewing",
        notes: "Target account blocked pending follow-up.",
      }));
      toast({ title: "Account blocked", description: "The reported account has been blocked." });
    }

    if (mode === "terminate") {
      updateReport(reportId, (report) => ({
        ...report,
        targetStatus: "Terminated",
        status: "Resolved",
        notes: "Account terminated after moderation decision.",
      }));
      toast({ title: "Account terminated", description: "The reported account has been terminated." });
    }

    if (mode === "resolve") {
      updateReport(reportId, (report) => ({
        ...report,
        status: "Resolved",
        notes: report.notes ?? "Marked as resolved by moderator.",
      }));
      toast({ title: "Report resolved", description: "The report has been marked as resolved." });
    }

    setConfirmAction({ mode: null, reportId: null });
  };

  const confirmDialogCopy: Record<Exclude<typeof confirmAction.mode, null>, { title: string; description: string; action: string }> = {
    block: {
      title: "Block reported account",
      description: "This will immediately block the account from accessing the platform.",
      action: "Block account",
    },
    terminate: {
      title: "Terminate reported account",
      description: "This will permanently deactivate the account and revoke all access.",
      action: "Terminate account",
    },
    resolve: {
      title: "Mark report as resolved",
      description: "Use this once the complaint has been fully handled.",
      action: "Resolve report",
    },
  };

  const selectedConfirmCopy = confirmAction.mode ? confirmDialogCopy[confirmAction.mode] : null;

  const renderStatusBadge = (status: ReportStatus) => {
    if (status === "Resolved") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Resolved
        </Badge>
      );
    }
    if (status === "Reviewing") {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" /> Reviewing
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> New
      </Badge>
    );
  };

  const renderTargetStatus = (status: TargetStatus) => {
    if (status === "Terminated") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Ban className="h-3 w-3" /> Terminated
        </Badge>
      );
    }
    if (status === "Blocked") {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <ShieldOff className="h-3 w-3" /> Blocked
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  };

  const renderSeverityBadge = (severity: ReportSeverity) => {
    const preset = severityVariant[severity];
    return <Badge variant={preset.variant}>{preset.label}</Badge>;
  };

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-1">{effectiveDescription}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Total reports" value={metrics.total.toString()} change={""} icon={ShieldAlert} variant="default" />
          <MetricCard title="Open cases" value={metrics.active.toString()} change={""} icon={AlertTriangle} variant="primary" />
          <MetricCard title="High severity" value={metrics.escalated.toString()} change={""} icon={Ban} variant="warning" />
        </div>

        <Card>
          <EnhancedTable
            data={reports}
            pageSize={10}
            searchKeys={["id", "summary", "status", "searchIndex"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Against</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Account state</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(report: ReportRecord) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{report.reporter.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{report.reporter.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{report.target.name}</span>
                    <span className="text-xs text-muted-foreground uppercase">{report.target.type}</span>
                  </div>
                </TableCell>
                <TableCell>{renderSeverityBadge(report.severity)}</TableCell>
                <TableCell>{renderStatusBadge(report.status)}</TableCell>
                <TableCell>{renderTargetStatus(report.targetStatus)}</TableCell>
                <TableCell>{new Date(report.submittedAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetails(report)}>
                        <Eye className="mr-2 h-4 w-4" /> View details
                      </DropdownMenuItem>
                      {canModerate && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => requestModeration("block", report.id)}
                            disabled={report.targetStatus === "Terminated" || report.targetStatus === "Blocked"}
                          >
                            Block account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => requestModeration("terminate", report.id)}
                            disabled={report.targetStatus === "Terminated"}
                          >
                            Terminate account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => requestModeration("resolve", report.id)}
                            disabled={report.status === "Resolved"}
                          >
                            Mark as resolved
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
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[96vw] max-w-4xl max-h-[90vh] p-0 rounded-xl shadow-2xl overflow-hidden border-none sm:border">
          <div className="flex flex-col max-h-[90vh] bg-background">
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 custom-scrollbar">
              <DialogHeader className="text-left border-b pb-4 mb-2">
                <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">Report details</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Review evidence and context submitted with this complaint.
                </DialogDescription>
              </DialogHeader>

              {selectedReport && (
                <div className="space-y-6">
                  {/* Reporter and Target info cards - Stacked on mobile */}
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <Card className="shadow-sm border-muted/60">
                      <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Reporter Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2 text-sm">
                        <div className="text-base font-bold text-primary">{selectedReport.reporter.name}</div>
                        <div className="flex justify-between border-b pb-1"><span>ID</span> <span className="font-mono text-[10px]">{selectedReport.reporter.id}</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Role</span> <span className="capitalize">{selectedReport.reporter.role}</span></div>
                        <div className="flex justify-between"><span>Contact</span> <span>{selectedReport.reporter.contact}</span></div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted/60">
                      <CardHeader className="pb-2 p-4">
                        <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Reported Account</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2 text-sm">
                        <div className="text-base font-bold text-destructive">{selectedReport.target.name}</div>
                        <div className="flex justify-between border-b pb-1"><span>ID</span> <span className="font-mono text-[10px]">{selectedReport.target.id}</span></div>
                        <div className="flex justify-between border-b pb-1"><span>Type</span> <span className="capitalize">{selectedReport.target.type}</span></div>
                        <div className="flex justify-between items-center"><span>State</span> {renderTargetStatus(selectedReport.targetStatus)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary card with responsive text size */}
                  <Card className="shadow-sm border-muted/60 bg-muted/5">
                    <CardHeader className="pb-2 p-4">
                      <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Complaint Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm sm:text-base leading-relaxed text-foreground italic">
                        "{selectedReport.summary}"
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tabs - made to fit mobile width */}
                  <Tabs defaultValue="attachments" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 h-10 bg-muted/50 p-1">
                      <TabsTrigger value="attachments">Evidence</TabsTrigger>
                      <TabsTrigger value="notes">Internal Notes</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="attachments" className="space-y-4 pt-2">
                      {selectedReport.attachments.map((attachment) => (
                        <Card key={attachment.id} className="overflow-hidden border-muted shadow-sm group hover:shadow-md transition-shadow">
                          <CardHeader className="py-2.5 px-4 bg-muted/30">
                            <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground">{attachment.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            {attachment.type === "screen-recording" && attachment.url ? (
                              <div className="rounded-lg overflow-hidden border bg-black shadow-inner aspect-video max-w-full">
                                <video controls className="w-full h-full" src={attachment.url} />
                              </div>
                            ) : null}
                            {attachment.type === "text" && attachment.content ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{attachment.content}</p>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="notes" className="pt-2">
                      <Card className="border-dashed bg-muted/5">
                        <CardContent className="py-12 text-center">
                          <p className="text-sm text-muted-foreground italic">
                            {selectedReport.notes ?? "No internal notes recorded yet."}
                          </p>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Footer fixed at bottom */}
            <DialogFooter className="p-5 sm:p-8 border-t bg-muted/5 flex flex-col sm:flex-row gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto h-11 px-6">Close</Button>
              </DialogClose>
              
              {canModerate && selectedReport && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 border-primary/20 hover:bg-primary/5 transition-all"
                    onClick={() => requestModeration("resolve", selectedReport.id)}
                    disabled={selectedReport.status === "Resolved"}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 px-6 text-destructive border-destructive/20 hover:bg-destructive/5 transition-all"
                    onClick={() => requestModeration("block", selectedReport.id)}
                    disabled={selectedReport.targetStatus === "Blocked" || selectedReport.targetStatus === "Terminated"}
                  >
                    Block Account
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto h-11 px-8 font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={() => requestModeration("terminate", selectedReport.id)}
                    disabled={selectedReport.targetStatus === "Terminated"}
                  >
                    Terminate Account
                  </Button>
                </div>
              )}
            </DialogFooter>
          </div>
          <DialogClose className="absolute top-4 right-4" />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction.mode} onOpenChange={(open) => !open && setConfirmAction({ mode: null, reportId: null })}>
        <AlertDialogContent>
          {selectedConfirmCopy && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{selectedConfirmCopy.title}</AlertDialogTitle>
                <AlertDialogDescription>{selectedConfirmCopy.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmAction({ mode: null, reportId: null })}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={applyModeration}>{selectedConfirmCopy.action}</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
