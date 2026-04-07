import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const initialRates = [
  { id: 1, type: 'coins', rate: 0.09, note: 'Default coin rate (USD per coin)' },
  { id: 2, type: 'beans', rate: 0.05, note: 'Beans rate' },
];

export default function ResellerRates() {
  const [rates, setRates] = useState(initialRates);
  const [type, setType] = useState('coins');
  const [rate, setRate] = useState<number | ''>('');

  function addRate() {
    if (!rate) {
      toast({ title: 'Enter rate', description: 'Please provide a numeric rate.' });
      return;
    }
    setRates((p) => [{ id: Date.now(), type, rate: Number(rate), note: '' }, ...p]);
    setRate('');
    toast({ title: 'Rate added' });
  }

  return (
    <DashboardLayout role="reseller">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Rates & Pricing</h2>
          <p className="text-muted-foreground mt-1">Manage coin and bean pricing for customers</p>
        </div>

        <Card>
          <div className="p-6 grid gap-4">
            <div className="flex gap-2 items-center">
              <select value={type} onChange={(e) => setType(e.target.value)} className="p-2 rounded border">
                <option value="coins">Coins</option>
                <option value="beans">Beans</option>
              </select>
              <Input placeholder="Rate (USD per unit)" value={rate as any} onChange={(e) => setRate((e as any).target.value === '' ? '' : Number((e as any).target.value))} />
              <Button onClick={addRate}>Add Rate</Button>
            </div>

            <div className="space-y-2">
              {rates.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{r.type.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{r.note}</p>
                  </div>
                  <div className="font-semibold">${r.rate.toFixed(4)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
