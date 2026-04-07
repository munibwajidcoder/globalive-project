import { DashboardLayout } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableRow, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function CompanyPolicy() {
  const [policyHistory, setPolicyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<string>("");
  const [viewingPolicy, setViewingPolicy] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, "globilivePolicies"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text || "",
        author: doc.data().author || "",
        createdAt: doc.data().createdAt,
        date: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      setPolicyHistory(list);
      setLoading(false);
      
      // Auto-fill editor with latest policy if it's currently empty
      if (list.length > 0 && text === "") {
        setText((list[0] as any).text);
      }
    }, (error) => {
      console.error("Error fetching policies:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [text]);

  function handleClear() {
    setText("");
  }

  async function handleSave() {
    if (!text.trim()) {
        toast({ title: "Error", description: "Policy cannot be empty.", variant: "destructive" });
        return;
    }
    
    try {
      await addDoc(collection(db, "globilivePolicies"), {
        text: text,
        author: "Company Admin",
        createdAt: serverTimestamp(),
      });
      toast({ title: "Saved successfully", description: "New policy version has been published." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save policy.", variant: "destructive" });
    }
  }

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in max-w-5xl pb-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Company Policy</h2>
          <p className="text-muted-foreground">Edit and publish company-wide policies and notices</p>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Policy Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border/40">
              <Textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                rows={12} 
                placeholder="Enter company policy here..."
                className="resize-y border-none shadow-inner bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm leading-relaxed"
              />
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={handleClear} className="w-24">Clear</Button>
                <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 shadow-md transition-all">Save Policy</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <CardTitle className="text-xl">Policy Update History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
             <EnhancedTable
                data={policyHistory}
                pageSize={5}
                searchKeys={["id", "date", "text"]}
                columns={
                    <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-4">Policy ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date Published</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Author</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Excerpt</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                }
                renderRow={(p: any) => (
                    <TableRow key={p.id} className="border-border/40">
                        <TableCell className="font-medium text-xs pl-4">{p.id}</TableCell>
                        <TableCell className="text-sm">{new Date(p.date).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">{p.author}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {p.text.substring(0, 50)}...
                        </TableCell>
                        <TableCell className="text-right pr-4">
                            <Button variant="secondary" size="sm" onClick={() => setViewingPolicy(p)} className="shadow-sm bg-background">
                                View Snapshot
                            </Button>
                        </TableCell>
                    </TableRow>
                )}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!viewingPolicy} onOpenChange={() => setViewingPolicy(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col border-none shadow-premium bg-background/95 backdrop-blur-xl">
            <DialogHeader className="flex-none">
                <DialogTitle className="text-2xl">Policy Snapshot</DialogTitle>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                   <span>Published: <strong className="text-foreground">{viewingPolicy ? new Date(viewingPolicy.date).toLocaleString() : ''}</strong></span>
                   <span>ID: <strong className="text-foreground">{viewingPolicy?.id}</strong></span>
                </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4 pr-2">
                <div className="prose dark:prose-invert max-w-none bg-muted/40 p-6 rounded-xl border border-border/40 shadow-inner">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                        {viewingPolicy?.text}
                    </pre>
                </div>
            </div>
            <DialogFooter className="flex-none mt-6">
                <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">Close Snapshot</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
