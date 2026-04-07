import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function BulkTopUp() {
  const [csv, setCsv] = useState('');

  function process() {
    if (!csv.trim()) {
      toast({ title: 'No data', description: 'Paste CSV of reseller_code,amount' });
      return;
    }
    // mock parse
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    toast({ title: 'Processed', description: `Processed ${lines.length} top-ups (mock).` });
    setCsv('');
  }

  return (
    <DashboardLayout role="topup-agent">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Bulk Top-up</h2>
          <p className="text-muted-foreground mt-1">Upload bulk top-up transactions for resellers</p>
        </div>

        <Card>
          <div className="p-6 grid gap-4">
            <label className="text-sm font-medium">Paste CSV (reseller_code,amount)</label>
            <textarea className="w-full rounded border p-2" rows={8} value={csv} onChange={(e) => setCsv((e as any).target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCsv('')}>Reset</Button>
              <Button onClick={process}>Process</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
