import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type AgencyTarget = {
  id: string;
  name: string;
  diamonds: number;
  target: number;
  hosts: number;
  rank: number;
};

const mockTopAgencies: AgencyTarget[] = [
  { id: "AG-001", name: "Star Talent Agency", diamonds: 125000, target: 100000, hosts: 45, rank: 1 },
  { id: "AG-005", name: "Ace Management", diamonds: 112000, target: 100000, hosts: 38, rank: 2 },
  { id: "AG-012", name: "Elite Streamers", diamonds: 98000, target: 80000, hosts: 32, rank: 3 },
  { id: "AG-003", name: "Global Reach", diamonds: 85000, target: 75000, hosts: 28, rank: 4 },
  { id: "AG-009", name: "Visionary Media", diamonds: 72000, target: 70000, hosts: 24, rank: 5 },
  { id: "AG-020", name: "Alpha Squad", diamonds: 68000, target: 60000, hosts: 21, rank: 6 },
  { id: "AG-015", name: "Pulse Entertainment", diamonds: 54000, target: 50000, hosts: 19, rank: 7 },
  { id: "AG-007", name: "Nova Casting", diamonds: 51000, target: 50000, hosts: 18, rank: 8 },
  { id: "AG-022", name: "Peak Performers", diamonds: 48000, target: 45000, hosts: 15, rank: 9 },
  { id: "AG-011", name: "Rising Stars", diamonds: 42000, target: 40000, hosts: 14, rank: 10 },
];

export function TopAgencies() {
  return (
    <Card className="overflow-hidden border-none shadow-premium bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 10 Agencies
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Target Achievers Policy (Monthly)
            </p>
          </div>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Season: October 2024
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTopAgencies.map((agency) => (
            <div 
              key={agency.id} 
              className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-background/80 transition-all duration-300 border border-transparent hover:border-border hover:shadow-sm"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {agency.rank}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold truncate pr-2">{agency.name}</h4>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded">
                    <TrendingUp className="h-3 w-3" />
                    +{Math.round((agency.diamonds / agency.target) * 100 - 100)}%
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-2.5 w-2.5" />
                    {agency.diamonds.toLocaleString()} 💎
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {agency.hosts} Hosts
                  </span>
                </div>

                <Progress 
                  value={(agency.diamonds / agency.target) * 100} 
                  className="h-1 bg-muted/50" 
                />
              </div>

              {agency.rank <= 3 && (
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
