import { useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EnhancedTable from "@/components/ui/EnhancedTable";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gamepad2, Sparkles, Users, TrendingUp, Eye } from "lucide-react";

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
  const totals = useMemo(() => {
    const totalHosts = catalog.reduce((sum, game) => sum + game.hostParticipation, 0);
    const totalUsers = catalog.reduce((sum, game) => sum + game.activeUsers, 0);
    const beanMonetised = catalog.filter((game) => game.monetisation === "Beans").length;

    return { totalHosts, totalUsers, beanMonetised };
  }, []);

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
                <Button size="sm" variant="outline" className="w-full">
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

        <Card>
          <CardHeader>
            <CardTitle>Plan new release</CardTitle>
            <CardDescription>Capture working title and expected launch to brief the content team.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="working-title">Working title</Label>
              <Input id="working-title" placeholder="Project Aurora" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">Target launch date</Label>
              <Input id="target-date" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Button className="w-full md:w-fit">Create draft brief</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
