import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export default function Analytics() {
  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold">Platform Analytics</h2>
          <p className="text-muted-foreground mt-1">Comprehensive insights and performance metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Users" value="124,567" change="+12.5%" icon={Users} variant="primary" />
          <MetricCard title="Revenue (30d)" value="$2.4M" change="+18.2%" icon={DollarSign} variant="success" />
          <MetricCard title="Active Sessions" value="8,432" change="+5.3%" icon={Activity} variant="default" />
          <MetricCard title="Growth Rate" value="23.5%" change="+3.2%" icon={TrendingUp} variant="success" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { source: "Google Play", amount: "$1.2M", percentage: 50 },
                  { source: "Resellers", amount: "$800K", percentage: 33 },
                  { source: "Direct Sales", amount: "$400K", percentage: 17 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.source}</span>
                      <span className="text-muted-foreground">{item.amount}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-emerald-400" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
                  <div key={month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-green-500" 
                          style={{ width: `${50 + i * 8}%` }}
                        />
                      </div>
                      <span className="text-sm text-success">+{5 + i * 2}%</span>
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
