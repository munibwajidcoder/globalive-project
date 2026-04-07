import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    agencyCommission: 20,
    resellerCommission: 10,
    newUserRegistration: true,
    agencyApplications: true,
    cashoutRequests: true,
    emailNotifications: true,
    smsAlerts: false,
  });

  useEffect(() => {
    const settingsRef = doc(db, "globiliveSettings", "platform-config");
    
    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings((prev) => ({ ...prev, ...data }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings from database");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "globiliveSettings", "platform-config");
      await setDoc(settingsRef, settings, { merge: true });
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    // Automatically save toggles for better UX
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Optional: Auto-save toggles logic here if desired
      return next;
    });
  };

  if (loading) {
    return (
      <DashboardLayout role="company">
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold">Platform Settings</h2>
            <p className="text-muted-foreground mt-1">Configure system-wide settings and preferences</p>
          </div>
          <Button 
            className="gradient-primary shadow-glow" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save All Changes
          </Button>
        </div>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <CardTitle>Commission Structure</CardTitle>
            <CardDescription>Set commission rates for different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency-commission">Agency Commission (%)</Label>
                <Input 
                  id="agency-commission" 
                  type="number" 
                  value={settings.agencyCommission} 
                  onChange={(e) => updateSetting("agencyCommission", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reseller-commission">Reseller Commission (%)</Label>
                <Input 
                  id="reseller-commission" 
                  type="number" 
                  value={settings.resellerCommission} 
                  onChange={(e) => updateSetting("resellerCommission", Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New User Registration</p>
                <p className="text-sm text-muted-foreground">Allow new users to register</p>
              </div>
              <Switch 
                checked={settings.newUserRegistration} 
                onCheckedChange={(val) => updateSetting("newUserRegistration", val)}
              />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Agency Applications</p>
                <p className="text-sm text-muted-foreground">Accept new agency registrations</p>
              </div>
              <Switch 
                checked={settings.agencyApplications} 
                onCheckedChange={(val) => updateSetting("agencyApplications", val)}
              />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cash-out Requests</p>
                <p className="text-sm text-muted-foreground">Enable cash-out functionality</p>
              </div>
              <Switch 
                checked={settings.cashoutRequests} 
                onCheckedChange={(val) => updateSetting("cashoutRequests", val)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive email alerts for important events</p>
              </div>
              <Switch 
                checked={settings.emailNotifications} 
                onCheckedChange={(val) => updateSetting("emailNotifications", val)}
              />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Get SMS for critical issues</p>
              </div>
              <Switch 
                checked={settings.smsAlerts} 
                onCheckedChange={(val) => updateSetting("smsAlerts", val)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
