import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "primary";
}

export function MetricCard({ title, value, change, icon: Icon, variant = "default" }: MetricCardProps) {
  const variantClasses = {
    default: "bg-card/50 border-border/50",
    success: "bg-success/5 border-success/20",
    warning: "bg-warning/5 border-warning/20",
    primary: "bg-primary/5 border-primary/20",
  };

  const iconVariantClasses = {
    default: "bg-muted/30 text-foreground shadow-sm",
    success: "bg-success/15 text-success shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    warning: "bg-warning/15 text-warning shadow-[0_0_15px_rgba(234,179,8,0.15)]",
    primary: "bg-primary/15 text-primary shadow-[0_0_15px_rgba(139,92,246,0.15)]",
  };

  const isPositiveTrend = typeof change === 'string' && change.startsWith('+');
  const isNegativeTrend = typeof change === 'string' && change.startsWith('-');
  const isStatusText = change && !isPositiveTrend && !isNegativeTrend;

  return (
    <Card className={`${variantClasses[variant]} border backdrop-blur-sm animate-fade-in hover:shadow-xl transition-all duration-300 group rounded-2xl`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">{title}</p>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground group-hover:translate-x-1 transition-transform duration-300">
                {value}
              </h3>
              {change && (
                <div className="flex items-center gap-1.5 min-h-[1.25rem]">
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full transition-colors",
                    isPositiveTrend && "bg-success/10 text-success uppercase",
                    isNegativeTrend && "bg-destructive/10 text-destructive uppercase",
                    isStatusText && "bg-muted/50 text-muted-foreground uppercase"
                  )}>
                    {change}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
            iconVariantClasses[variant]
          )}>
            <Icon className="h-6 w-6 stroke-[1.5px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
