import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { UserCog, Briefcase, DollarSign, Copy, ShieldCheck, Link as LinkIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

const subAdmins = [
  { id: "SA001", name: "Alex Hartman", contact: "+1...", share: "15%", beans: "1.2M", hosts: 15 },
  { id: "SA002", name: "Maria Garcia", contact: "+44...", share: "12%", beans: "850K", hosts: 12 },
];

const agencies = [
  { id: "A001", name: "Golden Stars", subAdmin: "Alex Hartman", hosts: 24, share: "5%", beans: "2.5M", diamonds: "500K" },
  { id: "A002", name: "Elite Performers", subAdmin: "Maria Garcia", hosts: 18, share: "5%", beans: "1.9M", diamonds: "420K" },
];

const resellers = [
  { id: "R001", name: "BeanStock Resellers", share: "10%", totalBeans: "5M", diamonds: "1M", requests: 2 },
  { id: "R002", name: "TopUp Kings", share: "8%", totalBeans: "3.8M", diamonds: "800K", requests: 0 },
];

const initialWithdrawals = [
  { id: "WR001", host: "Alice (Golden Stars)", amount: "$1,200", status: "Pending" },
  { id: "WR002", host: "Charlie (Elite)", amount: "$850", status: "Pending" },
  { id: "WR003", host: "David (Independent)", amount: "$2,500", status: "Done" },
];

export default function SuperAdminDashboard() {
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);

  const copyPublicLink = (formType: "sub-admin" | "agency") => {
    const link = `${window.location.origin}/public/${formType}-apply`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied!",
      description: `Public ${formType === "sub-admin" ? "Sub-Admin" : "Agency"} form link copied.`,
    });
  };

  const handleWithdrawal = (id: string, action: "Approve" | "Reject") => {
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: action === "Approve" ? "Done" : "Rejected" }
          : w
      )
    );
    toast({ title: `Request ${action}d` });
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-6 animate-fade-in">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Oversee platform-wide operations and manage key user roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => copyPublicLink("sub-admin")}>
              <LinkIcon className="mr-2 h-4 w-4" /> Copy Sub-Admin Link
            </Button>
            <Button variant="outline" onClick={() => copyPublicLink("agency")}>
              <Copy className="mr-2 h-4 w-4" /> Copy Agency Link
            </Button>
          </div>
        </div>

        {/* METRICS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="My Share" value="8%" icon={ShieldCheck} variant="primary" />
          <MetricCard title="Sub Admins" value={subAdmins.length} icon={UserCog} />
          <MetricCard title="Total Agencies" value={agencies.length} icon={Briefcase} />
          <MetricCard
            title="Pending Withdrawals"
            value={withdrawals.filter((w) => w.status === "Pending").length}
            icon={DollarSign}
            variant="warning"
          />
        </div>

        {/* SUB ADMIN + AGENCIES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sub-Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead>Beans</TableHead>
                    <TableHead>Hosts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subAdmins.map((sa) => (
                    <TableRow key={sa.id}>
                      <TableCell>{sa.name}</TableCell>
                      <TableCell>{sa.share}</TableCell>
                      <TableCell>{sa.beans}</TableCell>
                      <TableCell>{sa.hosts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agencies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sub-Admin</TableHead>
                    <TableHead>Hosts</TableHead>
                    <TableHead>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((ag) => (
                    <TableRow key={ag.id}>
                      <TableCell>{ag.name}</TableCell>
                      <TableCell>{ag.subAdmin}</TableCell>
                      <TableCell>{ag.hosts}</TableCell>
                      <TableCell>{ag.share}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* RESELLERS */}
        <Card>
          <CardHeader>
            <CardTitle>Resellers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Share</TableHead>
                  <TableHead>Total Beans</TableHead>
                  <TableHead>Diamonds</TableHead>
                  <TableHead>New Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.share}</TableCell>
                    <TableCell>{r.totalBeans}</TableCell>
                    <TableCell>{r.diamonds}</TableCell>
                    <TableCell>
                      {r.requests > 0 ? (
                        <Badge variant="destructive">{r.requests}</Badge>
                      ) : (
                        0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* WITHDRAWAL REQUESTS */}
        <Card>
          <CardHeader>
            <CardTitle>Host Withdrawal Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.host}</TableCell>
                    <TableCell>{w.amount}</TableCell>

                    <TableCell>
                      <Badge
                     variant={
                        w.status === "Done"
                          ? "secondary" // or "default"
                          : w.status === "Pending"
                          ? "destructive" // shows red
                          : "outline"
                      }
                      
                      >
                        {w.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {w.status === "Pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdrawal(w.id, "Approve")}
                          >
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleWithdrawal(w.id, "Reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

            </Table>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
