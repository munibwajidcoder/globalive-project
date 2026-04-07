import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, MessageCircle } from "lucide-react";

const initialCustomers = [
  { id: 1, name: "User#1234", phone: "+1234567890", coins: 1200 },
  { id: 2, name: "User#5678", phone: "+1987654321", coins: 300 },
];

export default function ResellerCustomers() {
  const [customers] = useState(initialCustomers);

  function contact(customer: any) {
    const msg = `Hi ${customer.name}, this is your reseller. Please confirm your purchase.`;
    window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <DashboardLayout role="reseller">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Customers</h2>
            <p className="text-muted-foreground mt-1">List of your customers and quick contact</p>
          </div>
        </div>

        <Card>
          <EnhancedTable
            data={customers}
            pageSize={10}
            searchKeys={["name", "phone"]}
            columns={
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-sm">{c.phone}</TableCell>
                <TableCell className="font-semibold">{c.coins}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => contact(c)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp customer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
