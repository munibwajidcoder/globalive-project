import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Gift, DollarSign } from "lucide-react";

export default function AgencyPerformance() {
  return (
    <DashboardLayout role="agency">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Performance Analytics</h2>
          <p className="text-muted-foreground mt-1">Track your agency's performance metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Growth Rate" value="24.5%" change="+5.2%" icon={TrendingUp} variant="success" />
          <MetricCard title="Active Hosts" value="28" change="+3" icon={Users} variant="primary" />
          <MetricCard title="Total Gifts" value="8,432" change="+245" icon={Gift} variant="default" />
          <MetricCard title="Revenue" value="$23,450" change="+12.5%" icon={DollarSign} variant="success" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Sarah Johnson", metric: "12,450 💎", percentage: 100 },
                  { name: "Mike Chen", metric: "10,920 💎", percentage: 87 },
                  { name: "Emma Davis", metric: "9,680 💎", percentage: 77 },
                ].map((host, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{host.name}</span>
                      <span className="text-muted-foreground">{host.metric}</span>
                    </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-emerald-400" 
                              style={{ width: `${host.percentage}%` }}
                            />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-success" 
                          style={{ width: `${60 + i * 5}%` }}
                        />
                      </div>
                      <span className="text-sm text-success">${(800 + i * 100)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
