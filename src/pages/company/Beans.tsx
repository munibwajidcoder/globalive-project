import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Settings, History, DollarSign, Gem, Percent, Globe, UserCheck, PlusSquare } from "lucide-react";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

export default function CompanyBeans() {
  // Beans Dollar Rate & Settings
  const [dollarRate, setDollarRate] = useState<number>(10);
  const [beansPerRate, setBeansPerRate] = useState<number>(100000);
  const [commission, setCommission] = useState<number>(80);
  const [diamondToBeanRate, setDiamondToBeanRate] = useState<number>(100);
  const [rateHistory, setRateHistory] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [commissionHistory, setCommissionHistory] = useState<any[]>([]);
  const [diamondToBeanRateHistory, setDiamondToBeanRateHistory] = useState<any[]>([]);
  const [dollarConversionRatesHistory, setDollarConversionRatesHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all settings and histories
  useEffect(() => {
    const settingsRef = doc(db, "globilivePlatformSettings", "beanSettings");
    
    // Listen for current settings
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDollarRate(data.dollarRate || 10);
        setBeansPerRate(data.beansPerRate || 100000);
        setCommission(data.commission || 80);
        setDiamondToBeanRate(data.diamondToBeanRate || 100);
      }
    });

    // Histories
    const qRate = query(collection(db, "globiliveBeanRateHistory"), orderBy("createdAt", "desc"));
    const unsubRate = onSnapshot(qRate, (snap) => setRateHistory(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate?.()?.toISOString() }))));

    const qAssign = query(collection(db, "globiliveBeanAssignmentHistory"), orderBy("createdAt", "desc"));
    const unsubAssign = onSnapshot(qAssign, (snap) => setAssignmentHistory(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate?.()?.toISOString() }))));

    const qComm = query(collection(db, "globiliveDiamondCommissionHistory"), orderBy("createdAt", "desc"));
    const unsubComm = onSnapshot(qComm, (snap) => setCommissionHistory(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate?.()?.toISOString() }))));

    const qDiaRate = query(collection(db, "globiliveDiamondToBeanRateHistory"), orderBy("createdAt", "desc"));
    const unsubDiaRate = onSnapshot(qDiaRate, (snap) => setDiamondToBeanRateHistory(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate?.()?.toISOString() }))));

    const qConv = query(collection(db, "globiliveDollarConversionHistory"), orderBy("createdAt", "desc"));
    const unsubConv = onSnapshot(qConv, (snap) => setDollarConversionRatesHistory(snap.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().createdAt?.toDate?.()?.toISOString() }))));

    return () => {
      unsubSettings(); unsubRate(); unsubAssign(); unsubComm(); unsubDiaRate(); unsubConv();
    };
  }, []);

  async function saveRate() {
    try {
      await setDoc(doc(db, "globilivePlatformSettings", "beanSettings"), { dollarRate, beansPerRate }, { merge: true });
      await addDoc(collection(db, "globiliveBeanRateHistory"), {
        dollarRate,
        beansPerRate,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Rate Updated", description: `Beans rate set to ${beansPerRate} for ${dollarRate}$.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update rates.", variant: "destructive" });
    }
  }

  // Generate Beans
  const [generatedAmount, setGeneratedAmount] = useState<number | "">("");
  const [beanBalance, setBeanBalance] = useState<number>(0);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "globilivePlatformLedger"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let balance = 0;
      const history: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "generated") {
          balance += data.amount || 0;
          history.push({
            id: doc.id,
            amount: data.amount,
            date: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
        if (data.type === "assigned") {
          balance -= data.amount || 0;
        }
      });
      setBeanBalance(balance);
      setGenerationHistory(history);
    });
    return () => unsubscribe();
  }, []);

  async function generateBeans() {
    if (!generatedAmount || Number(generatedAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a positive amount of beans to generate.", variant: "destructive" });
      return;
    }
    const amount = Number(generatedAmount);
    try {
      await addDoc(collection(db, "globilivePlatformLedger"), {
        amount,
        type: "generated",
        createdAt: serverTimestamp(),
      });
      toast({ title: "Beans Generated", description: `${amount} beans have been securely added to the platform.` });
      setGeneratedAmount("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  // Assign Beans
  const [assigneeId, setAssigneeId] = useState("");
  const [assignAmount, setAssignAmount] = useState<number | "">("");
  
  // Real recipients from Firestore would be better, but keeping list for now or fetching from globiliveAgencies
  const [recipients, setRecipients] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "globiliveAgencies"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, name: d.data().agencyName || d.data().name, role: "Agency" }));
      setRecipients(list);
    });
    return () => unsub();
  }, []);

  async function assignBeans() {
    if (!assigneeId || !assignAmount || Number(assignAmount) <= 0) {
      toast({ title: "Invalid Input", description: "Please select a recipient and a positive amount." });
      return;
    }

    const amount = Number(assignAmount);
    if (amount > beanBalance) {
      toast({ title: "Insufficient Balance", description: "The amount exceeds the current balance wallet.", variant: "destructive" });
      return;
    }

    const recipient = recipients.find(r => r.id === assigneeId);
    if (!recipient) return;

    try {
      // 1. Log in ledger
      await addDoc(collection(db, "globilivePlatformLedger"), {
        amount,
        type: "assigned",
        recipientId: recipient.id,
        recipientName: recipient.name,
        createdAt: serverTimestamp(),
      });

      // 2. Log in assignment history (for display)
      await addDoc(collection(db, "globiliveBeanAssignmentHistory"), {
        recipientName: recipient.name,
        recipientId: recipient.id,
        recipientRole: recipient.role,
        amount,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Beans Assigned", description: `${amount.toLocaleString()} beans assigned to ${recipient.name}.` });
      setAssigneeId("");
      setAssignAmount("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to assign beans.", variant: "destructive" });
    }
  }

  async function saveCommission() {
    try {
      await setDoc(doc(db, "globilivePlatformSettings", "beanSettings"), { commission }, { merge: true });
      await addDoc(collection(db, "globiliveDiamondCommissionHistory"), {
        commission,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Commission Updated", description: `Diamond to Bean conversion commission set to ${commission}%.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update commission." });
    }
  }

  async function saveDiamondToBeanRate() {
    try {
      await setDoc(doc(db, "globilivePlatformSettings", "beanSettings"), { diamondToBeanRate }, { merge: true });
      await addDoc(collection(db, "globiliveDiamondToBeanRateHistory"), {
        rate: diamondToBeanRate,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Rate Updated", description: `Diamond to Bean conversion rate set to ${diamondToBeanRate} diamonds per bean.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update rate." });
    }
  }

  // Dollar Conversion Rates
  const [country, setCountry] = useState("");
  const [countryRate, setCountryRate] = useState<number | "">("");

  async function saveDollarConversionRate() {
    if (!country.trim() || !countryRate || Number(countryRate) <= 0) {
      toast({ title: "Invalid Input", description: "Please provide a country and a positive rate." });
      return;
    }
    
    try {
      await addDoc(collection(db, "globiliveDollarConversionHistory"), {
        country: country.trim(),
        rate: Number(countryRate),
        createdAt: serverTimestamp(),
      });
      toast({ title: "Rate Updated", description: `Dollar conversion rate for ${country} set to ${countryRate}.` });
      setCountry("");
      setCountryRate("");
    } catch (e) {
      toast({ title: "Error", description: "Failed to save rate." });
    }
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Beans Optimization</h2>
          <p className="text-muted-foreground">Manage global bean rates, generation, and role-based assignments.</p>
        </div>

        {/* Top Wallet Section */}
        <Card className="border-none shadow-premium bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Wallet size={120} />
             </div>
             <CardContent className="pt-6 relative z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Company Bean Wallet</p>
                        <h3 className="text-4xl font-black text-primary">{new Intl.NumberFormat().format(beanBalance)} <span className="text-xl font-normal text-muted-foreground ml-1">Beans Available</span></h3>
                    </div>
                </div>
             </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Beans Dollar Rate */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="text-primary w-5 h-5" /> Beans Dollar Rate
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">For Super Admins and Top up Agents</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Amount in Dollars ($)</label>
                    <Input type="number" placeholder="e.g. 10" value={dollarRate} onChange={(e) => setDollarRate(Number(e.target.value))} className="bg-background/50" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Beans Received</label>
                    <Input type="number" placeholder="e.g. 100000" value={beansPerRate} onChange={(e) => setBeansPerRate(Number(e.target.value))} className="bg-background/50" />
                </div>
                <Button onClick={saveRate} className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Set Exchange Rate</Button>
              </div>
            </CardContent>
          </Card>

          {/* Generate Beans */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PlusSquare className="text-purple-400 w-5 h-5" /> Generate Beans
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Direct Minting to Admin Wallet</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Quantity to Generate</label>
                    <Input placeholder="Enter bean count" type="number" value={generatedAmount} onChange={(e) => setGeneratedAmount(e.target.value === "" ? "" : Number(e.target.value))} className="bg-background/50 h-11" />
                </div>
                <Button onClick={generateBeans} className="w-full h-11 border-primary/20 hover:bg-primary/5" variant="outline">
                    Generate Beans
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assign Beans */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="text-green-400 w-5 h-5" /> Assign Beans
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Top-up Agents & Resellers Only</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Select Agent / Reseller</label>
                    <Select onValueChange={setAssigneeId} value={assigneeId}>
                        <SelectTrigger className="bg-background/50 h-11">
                            <SelectValue placeholder="Select Recipient" />
                        </SelectTrigger>
                        <SelectContent>
                            {recipients.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name} ({r.role})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Amount to Transfer</label>
                    <Input placeholder="Amount" type="number" value={assignAmount} onChange={(e) => setAssignAmount(e.target.value === "" ? "" : Number(e.target.value))} className="bg-background/50 h-11" />
                </div>
                <Button onClick={assignBeans} className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Authorize Assignment</Button>
              </div>
            </CardContent>
          </Card>

          {/* Diamond Commission */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Percent className="text-orange-400 w-5 h-5" /> Conversion Commission
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Diamond to Bean Conversion Tip</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Commission Percentage (%)</label>
                      <Input type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="bg-background/50 h-11" />
                  </div>
                  <Button onClick={saveCommission} className="w-full h-11 border-primary/20" variant="outline">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>

          {/* Diamond to Bean Rate */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Gem className="text-cyan-400 w-5 h-5" /> Conversion Ratio
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Diamonds Required per Bean</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Diamond/Bean Unit</label>
                      <Input type="number" value={diamondToBeanRate} onChange={(e) => setDiamondToBeanRate(Number(e.target.value))} className="bg-background/50 h-11" />
                  </div>
                  <Button onClick={saveDiamondToBeanRate} className="w-full h-11 border-primary/20" variant="outline">Save Rate</Button>
              </div>
            </CardContent>
          </Card>

          {/* Dollar Conversion Rates */}
          <Card className="border-none shadow-premium bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Globe className="text-indigo-400 w-5 h-5" /> Regional Dollar Rates
              </CardTitle>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Currency Exchange for Countries</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Country Tag</label>
                          <Input placeholder="e.g. PKR" value={country} onChange={(e) => setCountry(e.target.value)} className="bg-background/50" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-muted-foreground">Rate ($1 = ?)</label>
                          <Input placeholder="e.g. 250" type="number" value={countryRate} onChange={(e) => setCountryRate(e.target.value === "" ? "" : Number(e.target.value))} className="bg-background/50" />
                      </div>
                  </div>
                  <Button onClick={saveDollarConversionRate} className="w-full h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Set Regional Rate</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global History Ledger */}
        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <History className="text-primary w-5 h-5" />
                </div>
                <div>
                    <CardTitle>System Activity Ledger</CardTitle>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Historical Logs of All Bean Configurations</p>
                </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pt-4">
              <Tabs defaultValue="assigned" className="w-full" onValueChange={() => setCurrentPage(1)}>
                <TabsList className="bg-muted/30 ml-6 mb-4">
                  <TabsTrigger value="assigned">Assigned Beans</TabsTrigger>
                  <TabsTrigger value="generated">Generated Beans</TabsTrigger>
                  <TabsTrigger value="dollarRate">Bean Dollar Rate</TabsTrigger>
                  <TabsTrigger value="diamondRate">Bean to Diamond Rate</TabsTrigger>
                  <TabsTrigger value="commission">Diamond to Bean Commission</TabsTrigger>
                  <TabsTrigger value="conversion">Dollar Conversion Rates</TabsTrigger>
                </TabsList>
                
                <div className="border-t border-border/40">
                  <TabsContent value="assigned" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Recipient</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                          <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Transferred Amount</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(assignmentHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No assignment logs found.</TableCell></TableRow>
                          ) : getPaginatedData(assignmentHistory).map((a: any) => (
                          <TableRow key={a.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(a.date).toLocaleString()}</TableCell>
                              <TableCell>{a.recipientName}</TableCell>
                              <TableCell><Badge variant="secondary" className="font-mono text-[10px]">{a.recipientRole}</Badge></TableCell>
                              <TableCell className="text-right pr-6 font-black text-primary">{new Intl.NumberFormat().format(a.amount)} beans</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>
                  
                  <TabsContent value="generated" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                          <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Generated Amount</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(generationHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No generation logs found.</TableCell></TableRow>
                          ) : getPaginatedData(generationHistory).map((g: any) => (
                          <TableRow key={g.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(g.date).toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-6 font-black text-purple-400">+{new Intl.NumberFormat().format(g.amount)} beans</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>

                  <TabsContent value="dollarRate" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                              <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Rate Value</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(rateHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No rate logs found.</TableCell></TableRow>
                          ) : getPaginatedData(rateHistory).map((r: any) => (
                          <TableRow key={r.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(r.date).toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-6 font-semibold">{r.beansPerRate.toLocaleString()} beans per ${r.dollarRate}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>

                  <TabsContent value="diamondRate" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                              <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Ratio Setting</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(diamondToBeanRateHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No ratio logs found.</TableCell></TableRow>
                          ) : getPaginatedData(diamondToBeanRateHistory).map((r: any) => (
                          <TableRow key={r.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(r.date).toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-6 font-semibold">{r.rate} diamonds : 1 bean</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>

                  <TabsContent value="commission" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                              <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Percentage</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(commissionHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">No commission logs found.</TableCell></TableRow>
                          ) : getPaginatedData(commissionHistory).map((c: any) => (
                          <TableRow key={c.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(c.date).toLocaleString()}</TableCell>
                              <TableCell className="text-right pr-6 font-bold text-orange-400">{c.commission}%</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>

                  <TabsContent value="conversion" className="mt-0">
                      <Table>
                      <TableHeader>
                          <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="pl-6 text-[10px] font-black uppercase tracking-widest">Date & Time</TableHead>
                              <TableHead className="text-[10px] font-black uppercase tracking-widest">Regional Zone</TableHead>
                              <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Valuation</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getPaginatedData(dollarConversionRatesHistory).length === 0 ? (
                              <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No regional rate logs found.</TableCell></TableRow>
                          ) : getPaginatedData(dollarConversionRatesHistory).map((r: any) => (
                          <TableRow key={r.id} className="border-border/40 hover:bg-muted/20">
                              <TableCell className="pl-6 font-medium">{new Date(r.date).toLocaleString()}</TableCell>
                              <TableCell>{r.country}</TableCell>
                              <TableCell className="text-right pr-6 font-semibold text-indigo-400">1$ = {r.rate}</TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                      </Table>
                  </TabsContent>
                </div>
              </Tabs>
            <div className="flex justify-end items-center gap-2 mt-6 px-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-primary/20"
                >
                    Previous
                </Button>
                <div className="text-xs font-bold px-4">Page {currentPage}</div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="border-primary/20"
                >
                    Next
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
