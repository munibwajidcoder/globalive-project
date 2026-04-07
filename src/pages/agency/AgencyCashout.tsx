import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Clock, 
  UploadCloud, 
  CheckCircle2, 
  ShieldCheck,
  History
} from "lucide-react";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const cashoutHistory = [
  { id: "CO-901", date: "2025-10-15", amount: "$8,450", diamonds: "8,450", status: "Completed" },
  { id: "CO-902", date: "2025-09-28", amount: "$12,230", diamonds: "12,230", status: "Completed" },
  { id: "CO-903", date: "2025-09-10", amount: "$6,780", diamonds: "6,780", status: "Completed" },
];

export default function AgencyCashout() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [diamondsToCash, setDiamondsToCash] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitRequest = () => {
    if (!diamondsToCash || Number(diamondsToCash) < 5000) {
      toast({ 
        title: "Invalid amount", 
        description: "Minimum cash-out is 5,000 diamonds.", 
        variant: "destructive" 
      });
      return;
    }
    if (!slipFile) {
      toast({ 
        title: "Proof required", 
        description: "Please upload your ID or Ledger snapshot as proof.", 
        variant: "destructive" 
      });
      return;
    }

    toast({ 
      title: "Request submitted", 
      description: "Your cash-out request is being verified by the finance team." 
    });
    setRequestOpen(false);
    setDiamondsToCash("");
    setSlipFile(null);
  };

  return (
    <DashboardLayout role="agency">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cash-out Management</h2>
          <p className="text-muted-foreground mt-1">Convert your agency diamonds into settled payments</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-premium bg-card/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4 text-primary" /> Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-600/5 border border-primary/10 text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <DollarSign className="h-24 w-24" />
                  </div>
                  <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.2em] mb-1">Current Diamonds</p>
                  <p className="text-5xl font-black text-foreground tracking-tighter">23,450 <span className="text-2xl ml-[-8px]">💎</span></p>
                  <p className="text-xs mt-3 text-muted-foreground font-semibold flex items-center justify-center gap-2">
                     <span className="h-px w-8 bg-muted-foreground/20"></span>
                     ESTIMATED VALUE: $23,450.00 USD
                     <span className="h-px w-8 bg-muted-foreground/20"></span>
                  </p>
                </div>
                <Button className="w-full h-14 gradient-primary rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all" size="lg" onClick={() => setRequestOpen(true)}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Request Cash-out Settlement
                </Button>
                <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                   <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> 72h Payout</div>
                   <div className="h-1 w-1 rounded-full bg-muted-foreground/30"></div>
                   <div>Min: 5,000 💎</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-card/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <History className="h-4 w-4 text-primary" /> Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/40 group hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Withdrawn (MTD)</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight">$23,450.00</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
                   <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/40 group hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Awaiting Verification</p>
                  <p className="text-3xl font-bold mt-1 tracking-tight">0 <span className="text-sm font-medium text-muted-foreground">Requests</span></p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning border border-warning/20 text-warning">
                   <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-background">
             <div className="gradient-primary p-10 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <DollarSign className="h-20 w-20" />
                </div>
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-3xl font-black tracking-tighter">Request Payout</DialogTitle>
                  <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest mt-1">
                    Settlement request for independent agencies
                  </DialogDescription>
                </DialogHeader>
             </div>

             <div className="p-8 space-y-7">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Diamonds to liquidate</Label>
                   <div className="relative group">
                      <Input 
                        type="number" 
                        placeholder="Min 5,000" 
                        className="h-14 pl-14 rounded-2xl font-black text-xl border-border/60 focus:border-primary transition-all shadow-sm"
                        value={diamondsToCash}
                        onChange={(e) => setDiamondsToCash(e.target.value)}
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold opacity-30 group-focus-within:opacity-100 transition-opacity">💎</div>
                   </div>
                   <div className="px-1 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-muted-foreground/60">Estimated conversion</span>
                      <span className="text-success font-black text-xs">{diamondsToCash ? `$${Number(diamondsToCash).toLocaleString()}.00` : "$0.00"} USD</span>
                   </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Settlement Method</Label>
                   <Select defaultValue="bank">
                      <SelectTrigger className="h-14 rounded-2xl border-border/60 font-bold text-sm shadow-sm">
                         <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                         <SelectItem value="bank" className="rounded-xl h-11 font-bold">Bank Wire Transfer</SelectItem>
                         <SelectItem value="usdt" className="rounded-xl h-11 font-bold">USDT (TRC-20)</SelectItem>
                         <SelectItem value="wallet" className="rounded-xl h-11 font-bold">E-Wallet (Jazz/Easy)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/40">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between ml-1">
                      <span>Ledger/ID Verification</span>
                      <span className="text-destructive font-black text-[9px]">REQUIRED</span>
                   </Label>
                   <div className="relative group">
                      <Input 
                        type="file" 
                        className="hidden" 
                        id="slip-upload"
                        ref={fileInputRef}
                        onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                        accept="image/*,.pdf"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full h-28 border-dashed border-2 flex flex-col gap-3 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all bg-muted/10 group-hover:bg-muted/20"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {slipFile ? (
                           <>
                              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                                 <CheckCircle2 className="h-6 w-6 text-success" />
                              </div>
                              <span className="text-[10px] font-black text-foreground truncate max-w-[240px] uppercase tracking-wider">{slipFile.name}</span>
                           </>
                        ) : (
                           <>
                              <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Upload settlement document</span>
                           </>
                        )}
                      </Button>
                   </div>
                   <p className="text-[9px] text-center text-muted-foreground font-bold leading-relaxed uppercase tracking-wider px-4">
                      Upload a screenshot of your diamond ledger or your verified ID badge for quick approval.
                   </p>
                </div>
             </div>

             <DialogFooter className="p-8 bg-muted/20 border-t border-border/40 gap-4 flex-col sm:flex-row">
                <DialogClose asChild>
                   <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmitRequest} className="flex-1 h-12 gradient-primary rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30">Confirm & Submit</Button>
             </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="border-none shadow-premium bg-card/50 overflow-hidden">
          <CardHeader>
             <CardTitle className="text-xl font-bold">Settlement History</CardTitle>
          </CardHeader>
          <EnhancedTable
            data={cashoutHistory}
            pageSize={10}
            searchKeys={["date", "amount", "diamonds", "status", "id"]}
            columns={
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Entry ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Diamonds</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Proofs</TableHead>
                </TableRow>
              </TableHeader>
            }
            renderRow={(record: any) => (
              <TableRow key={record.id} className="hover:bg-muted/30 transition-colors border-border/40">
                <TableCell className="font-mono text-[10px] font-bold text-muted-foreground">{record.id}</TableCell>
                <TableCell className="text-xs font-semibold">{record.date}</TableCell>
                <TableCell className="font-bold text-primary">{record.diamonds} 💎</TableCell>
                <TableCell className="font-bold text-success">{record.amount}</TableCell>
                <TableCell>
                  <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest px-2 h-5">
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                   </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
