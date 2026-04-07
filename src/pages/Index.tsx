import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Shield, UserCog, Briefcase, Mic2, Users, DollarSign, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roles = [
  { title: "Company Panel", icon: Building2, path: "/company", color: "text-primary", desc: "Full platform control" },
  { title: "Super Admin", icon: Shield, path: "/super-admin", color: "text-accent", desc: "Manage operations" },
  { title: "Sub Admin", icon: UserCog, path: "/sub-admin", color: "text-success", desc: "Regional management" },
  { title: "Agency", icon: Briefcase, path: "/agency", color: "text-warning", desc: "Host management" },
  { title: "Host", icon: Mic2, path: "/host", color: "text-primary", desc: "Content creator" },
  { title: "User", icon: Users, path: "/user", color: "text-accent", desc: "End user panel" },
  { title: "Reseller", icon: DollarSign, path: "/reseller", color: "text-success", desc: "Sales operations" },
  { title: "Top-Up Agent", icon: Wallet, path: "/topup-agent", color: "text-primary", desc: "Transaction management" },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-6 shadow-glow">
            <span className="text-white font-bold text-3xl">GL</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">Globilive Admin Panel</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete multi-panel management system for the Globilive platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {roles.map((role, index) => (
            <Card
              key={role.path}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(role.path)}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-card border flex items-center justify-center group-hover:scale-110 transition-transform ${role.color}`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{role.desc}</p>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Access Panel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-card">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">System Overview</h2>
              <p className="text-muted-foreground mb-6">
                Multi-tier hierarchical system with 8 specialized panels for complete platform management
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-semibold text-2xl text-primary">8</p>
                  <p className="text-muted-foreground">Panels</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-semibold text-2xl text-success">100%</p>
                  <p className="text-muted-foreground">Functional</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-semibold text-2xl text-accent">∞</p>
                  <p className="text-muted-foreground">Scalable</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-semibold text-2xl text-warning">24/7</p>
                  <p className="text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
