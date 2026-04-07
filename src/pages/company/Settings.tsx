import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <DashboardLayout role="company">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h2 className="text-3xl font-bold">Platform Settings</h2>
          <p className="text-muted-foreground mt-1">Configure system-wide settings and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commission Structure</CardTitle>
            <CardDescription>Set commission rates for different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency-commission">Agency Commission (%)</Label>
                <Input id="agency-commission" type="number" defaultValue="20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reseller-commission">Reseller Commission (%)</Label>
                <Input id="reseller-commission" type="number" defaultValue="10" />
              </div>
            </div>
            <Button className="gradient-primary">Save Commission Rates</Button>
          </CardContent>
        </Card>

        <Card>
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Agency Applications</p>
                <p className="text-sm text-muted-foreground">Accept new agency registrations</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cash-out Requests</p>
                <p className="text-sm text-muted-foreground">Enable cash-out functionality</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Get SMS for critical issues</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
