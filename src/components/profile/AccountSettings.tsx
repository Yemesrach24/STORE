"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Globe, Shield, Palette, Clock, Mail } from "lucide-react";

const accountSettingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().min(1, "Language is required"),
  currency: z.string().min(1, "Currency is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  emailNotifications: z.boolean(),
  lowStockAlerts: z.boolean(),
  weeklyReports: z.boolean(),
  marketingEmails: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
  autoLogout: z.boolean(),
  twoFactorAuth: z.boolean(),
});

type AccountSettingsData = z.infer<typeof accountSettingsSchema>;

export function AccountSettings() {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<AccountSettingsData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      emailNotifications: true,
      lowStockAlerts: true,
      weeklyReports: false,
      marketingEmails: false,
      theme: "system",
      autoLogout: true,
      twoFactorAuth: false,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: AccountSettingsData) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // In a real app, you'd save these settings to your database
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      toast("Settings updated", {
        description: "Your account settings have been successfully updated.",
      });

      reset(data);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast("Error", {
        description: "Failed to update settings. Please try again.",
        className: "text-destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = (field: keyof AccountSettingsData) => {
    setValue(field, !watchedValues[field], { shouldDirty: true });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Configure your regional preferences for dates, times, and currency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={watchedValues.timezone}
                  onValueChange={(value) => setValue("timezone", value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-sm text-destructive">{errors.timezone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={watchedValues.language}
                  onValueChange={(value) => setValue("language", value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
                {errors.language && (
                  <p className="text-sm text-destructive">{errors.language.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watchedValues.currency}
                  onValueChange={(value) => setValue("currency", value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                    <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                    <SelectItem value="CAD">Canadian Dollar (C$)</SelectItem>
                    <SelectItem value="AUD">Australian Dollar (A$)</SelectItem>
                    <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                    <SelectItem value="CNY">Chinese Yuan (¥)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={watchedValues.dateFormat}
                  onValueChange={(value) => setValue("dateFormat", value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                  </SelectContent>
                </Select>
                {errors.dateFormat && (
                  <p className="text-sm text-destructive">{errors.dateFormat.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose which notifications you'd like to receive via email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates and alerts via email
                  </p>
                </div>
                <Switch
                  checked={watchedValues.emailNotifications}
                  onCheckedChange={() => handleToggle("emailNotifications")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when items are running low on stock
                  </p>
                </div>
                <Switch
                  checked={watchedValues.lowStockAlerts}
                  onCheckedChange={() => handleToggle("lowStockAlerts")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly inventory summary reports
                  </p>
                </div>
                <Switch
                  checked={watchedValues.weeklyReports}
                  onCheckedChange={() => handleToggle("weeklyReports")}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch
                  checked={watchedValues.marketingEmails}
                  onCheckedChange={() => handleToggle("marketingEmails")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={watchedValues.theme}
                  onValueChange={(value) => setValue("theme", value as "light" | "dark" | "system", { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                {errors.theme && (
                  <p className="text-sm text-destructive">{errors.theme.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Logout</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out after 30 minutes of inactivity
                  </p>
                </div>
                <Switch
                  checked={watchedValues.autoLogout}
                  onCheckedChange={() => handleToggle("autoLogout")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={watchedValues.twoFactorAuth}
                  onCheckedChange={() => handleToggle("twoFactorAuth")}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base">Password</Label>
                <p className="text-sm text-muted-foreground">
                  Last changed: Never
                </p>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base">Active Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  1 active session
                </p>
                <Button variant="outline" size="sm">
                  Manage Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isUpdating}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUpdating ? "Updating..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
} 