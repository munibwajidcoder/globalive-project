import { useMemo, useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gamepad2, Sparkles, Users, TrendingUp, Eye, Loader2, Calendar, Target, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import { toast } from "sonner";

const featuredGames = [
  {
    id: "GL-001",
    title: "Star Stream Royale",
    genre: "Talent Battle",
    activeHosts: 328,
    avgRevenue: 15200,
    status: "Featured",
  },
  {
    id: "GL-002",
    title: "Bean Rush Arena",
    genre: "Arcade",
    activeHosts: 212,
    avgRevenue: 9400,
    status: "Seasonal",
  },
  {
    id: "GL-003",
    title: "Night Wave Sessions",
    genre: "Music",
    activeHosts: 178,
    avgRevenue: 8600,
    status: "Trending",
  },
];

const catalog = [
  {
    id: "GL-001",
    name: "Star Stream Royale",
    launchDate: "2025-01-22",
    hostParticipation: 328,
    activeUsers: 15420,
    monetisation: "Beans",
    status: "Featured",
  },
  {
    id: "GL-002",
    name: "Bean Rush Arena",
    launchDate: "2025-03-04",
    hostParticipation: 212,
    activeUsers: 11890,
    monetisation: "Beans",
    status: "Seasonal",
  },
  {
    id: "GL-003",
    name: "Night Wave Sessions",
    launchDate: "2024-11-10",
    hostParticipation: 178,
    activeUsers: 9800,
    monetisation: "Diamonds",
    status: "Trending",
  },
  {
    id: "GL-004",
    name: "Quiz Galaxy",
    launchDate: "2024-08-19",
    hostParticipation: 142,
    activeUsers: 7550,
    monetisation: "Beans",
    status: "Active",
  },
];

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  Featured: "default",
  Seasonal: "secondary",
  Trending: "secondary",
  Active: "outline",
};

export default function CompanyGames() {
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState("");

  const totals = useMemo(() => {
    const totalHosts = catalog.reduce((sum, game) => sum + game.hostParticipation, 0);
    const totalUsers = catalog.reduce((sum, game) => sum + game.activeUsers, 0);
    const beanMonetised = catalog.filter((game) => game.monetisation === "Beans").length;

    return { totalHosts, totalUsers, beanMonetised };
  }, []);

  const handleCreateDraft = async () => {
    if (!draftTitle || !draftDate) {
      toast.error("Please fill in both the title and target date");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "globiliveGameDrafts"), {
        title: draftTitle,
        targetDate: draftDate,
        status: "Draft",
        createdAt: serverTimestamp(),
      });
      toast.success("Draft brief created successfully!");
      setDraftTitle("");
      setDraftDate("");
    } catch (error) {
      console.error("Error creating draft:", error);
      toast.error("Failed to create draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPerformance = (game: any) => {
    setSelectedGame(game);
    setPerformanceOpen(true);
  };

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold">Games Catalog</h2>
          <p className="text-muted-foreground">
            Track featured experiences, monitor host participation, and plan upcoming game launches.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Catalog size"
            value={`${catalog.length} games`}
            change="Active partnerships"
            icon={Gamepad2}
            variant="primary"
          />
          <MetricCard
            title="Participating hosts"
            value={`${totals.totalHosts.toLocaleString()} hosts`}
            change="Rolling 30 days"
            icon={Users}
            variant="default"
          />
          <MetricCard
            title="Active users"
            value={`${totals.totalUsers.toLocaleString()}`}
            change="Monthly unique players"
            icon={Sparkles}
            variant="success"
          />
          <MetricCard
            title="Bean monetised"
            value={`${totals.beanMonetised} titles`}
            change="Eligible for reseller promos"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Featured launches</CardTitle>
            <CardDescription>Spotlight current campaigns and forecast host demand.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {featuredGames.map((game) => (
              <div key={game.id} className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{game.genre}</span>
                  <Badge variant={statusBadgeVariant[game.status] ?? "outline"}>{game.status}</Badge>
                </div>
                <h4 className="text-lg font-semibold">{game.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {game.activeHosts} active hosts • Avg revenue ${game.avgRevenue.toLocaleString()}
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-primary/20 text-primary hover:bg-primary/5"
                  onClick={() => openPerformance(game)}
                >
                  <Eye className="mr-2 h-4 w-4" /> View performance
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game catalog</CardTitle>
            <CardDescription>All experiences managed by the company admin with monetisation channels.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedTable
              data={catalog}
              pageSize={8}
              searchKeys={["name", "status", "monetisation"]}
              columns={
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Launch date</TableHead>
                    <TableHead>Hosts</TableHead>
                    <TableHead>Active users</TableHead>
                    <TableHead>Monetisation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
              }
              renderRow={(game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.name}</TableCell>
                  <TableCell>{game.launchDate}</TableCell>
                  <TableCell>{game.hostParticipation.toLocaleString()}</TableCell>
                  <TableCell>{game.activeUsers.toLocaleString()}</TableCell>
                  <TableCell>{game.monetisation}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[game.status] ?? "outline"}>{game.status}</Badge>
                  </TableCell>
                </TableRow>
              )}
            />
          </CardContent>
        </Card>
        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <CardTitle>Plan new release</CardTitle>
            <CardDescription>Capture working title and expected launch to brief the content team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="working-title">Working title</Label>
                  <Input 
                    id="working-title" 
                    placeholder="Project Aurora" 
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-date">Target launch date</Label>
                  <Input 
                    id="target-date" 
                    type="date" 
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full md:w-fit gradient-primary shadow-glow" 
                onClick={handleCreateDraft}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create draft brief
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Modal */}
        <Dialog open={performanceOpen} onOpenChange={setPerformanceOpen}>
          <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-none shadow-premium">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Performance: {selectedGame?.title || selectedGame?.name}
              </DialogTitle>
              <DialogDescription>
                Detailed breakdown of host engagement and monetisation trends.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Retention</p>
                <p className="text-2xl font-black text-emerald-500">84.2%</p>
                <p className="text-[10px] text-muted-foreground mt-1">High engagement index</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Peak Concurrent</p>
                <p className="text-2xl font-black text-primary">12.4K</p>
                <p className="text-[10px] text-muted-foreground mt-1">Saturday PM prime time</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Growth</p>
                <p className="text-2xl font-black text-blue-500">+12%</p>
                <p className="text-[10px] text-muted-foreground mt-1">MoM participation rise</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <h5 className="font-bold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Quarterly Goals
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The goal is to increase host participation by 15% through targeted bean promotions and exclusive streamer badges. Current roadmap suggests a V2 update in mid-Q3.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/40">
                  <p className="text-xs font-bold mb-1">Top Region</p>
                  <p className="text-sm font-semibold">South East Asia</p>
                </div>
                <div className="p-4 rounded-xl border border-border/40">
                  <p className="text-xs font-bold mb-1">Top Earner</p>
                  <p className="text-sm font-semibold">@StarHost_01</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Done</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
