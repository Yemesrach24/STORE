"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/layout";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PersonalInventory } from "@/components/profile/PersonalInventory";
import { AccountSettings } from "@/components/profile/AccountSettings";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Package, Settings, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and view your personal inventory.
            </p>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                <AvatarFallback className="text-lg">
                  {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-xl">{user.fullName || "User"}</CardTitle>
                <CardDescription className="text-base">
                  {user.emailAddresses[0]?.emailAddress}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">
                    {user.createdAt ? `Member since ${new Date(user.createdAt).toLocaleDateString()}` : "Member"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">My Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <PersonalInventory />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <ChangePasswordForm />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 