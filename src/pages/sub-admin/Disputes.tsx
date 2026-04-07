import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { CheckSquare, Eye, MessageSquare, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const initialDisputes = [
  { id: 1, reference: "D-2025-001", agency: "Silver Stars", host: "Sarah Johnson", issue: "Unauthorized charge", status: "Open", date: "2025-10-18" },
  { id: 2, reference: "D-2025-002", agency: "Dream Team", host: "Mike Chen", issue: "Content dispute", status: "In Review", date: "2025-10-19" },
];

export default function SubAdminDisputes() {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [viewing, setViewing] = useState<any | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  function openView(d: any) {
    setViewing(d);
    setViewOpen(true);
  }

  function openResolve(d: any) {
    setResolvingId(d.id);
    setResolveOpen(true);
  }

  function confirmResolve() {
    if (resolvingId == null) return;
    setDisputes((prev) => prev.map((d) => (d.id === resolvingId ? { ...d, status: "Resolved" } : d)));
    setResolvingId(null);
    setResolveOpen(false);
    toast({ title: "Dispute resolved", description: "The case is now marked as resolved." });
  }

  return (
    <DashboardLayout role="sub-admin">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Disputes</h2>
          <p className="text-muted-foreground mt-1">Help resolve disputes assigned to your region</p>
        </div>

        <Card>
          <EnhancedTable
            data={disputes}
            pageSize={8}
            searchKeys={["reference", "agency", "host", "issue"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.reference}</TableCell>
                <TableCell>{d.agency}</TableCell>
                <TableCell>{d.host}</TableCell>
                <TableCell>{d.issue}</TableCell>
                <TableCell>
                  <Badge variant={d.status === "Resolved" ? "default" : "secondary"}>{d.status}</Badge>
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
                      <DropdownMenuItem onSelect={() => openView(d)}>
                        <Eye className="mr-2 h-4 w-4" /> View details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {d.status !== "Resolved" ? (
                        <>
                          <DropdownMenuItem onSelect={() => openResolve(d)}>
                            <CheckSquare className="mr-2 h-4 w-4" /> Mark resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              toast({
                                title: "Messaging coming soon",
                                description: "Message workflow is not implemented yet.",
                              })
                            }
                          >
                            <MessageSquare className="mr-2 h-4 w-4" /> Message submitter
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem disabled>
                          <CheckSquare className="mr-2 h-4 w-4" /> Already resolved
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dispute details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <div><strong>Reference:</strong> {viewing?.reference}</div>
              <div><strong>Agency:</strong> {viewing?.agency}</div>
              <div><strong>Host:</strong> {viewing?.host}</div>
              <div><strong>Issue:</strong> {viewing?.issue}</div>
              <div><strong>Date:</strong> {viewing?.date}</div>
              <div><strong>Status:</strong> {viewing?.status}</div>
            </div>
            <DialogClose />
          </DialogContent>
        </Dialog>

        <AlertDialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resolve Dispute</AlertDialogTitle>
              <AlertDialogDescription>Mark this dispute as resolved?</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmResolve}>Resolve</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
