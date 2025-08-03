"use client";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Package, 
  BarChart3, 
  Shield, 
  Activity, 
  Settings, 
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage users, inventory, and system settings.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              <Shield className="mr-2 h-4 w-4" />
              Admin Access
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0 from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts, roles, and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Users:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Users:</span>
                    <span className="font-medium text-green-600">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pending Approvals:</span>
                    <span className="font-medium text-amber-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/users">
                    Manage Users
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Global Inventory */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Global Inventory
                </CardTitle>
                <CardDescription>
                  Overview of all inventory across the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Items:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Low Stock:</span>
                    <span className="font-medium text-amber-600">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Out of Stock:</span>
                    <span className="font-medium text-red-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/inventory">
                    View Inventory
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  System-wide analytics and performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Active Users:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Growth:</span>
                    <span className="font-medium text-green-600">+0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>System Uptime:</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/analytics">
                    View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Role Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  Manage user roles and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Admins:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Managers:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Regular Users:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/roles">
                    Manage Roles
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Logs
                </CardTitle>
                <CardDescription>
                  Monitor user activity and system events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Events:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>This Week:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Alerts:</span>
                    <span className="font-medium text-red-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/logs">
                    View Logs
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Database Size:</span>
                    <span className="font-medium">0 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Backup Status:</span>
                    <span className="font-medium text-green-600">Up to date</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Maintenance:</span>
                    <span className="font-medium">Today</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/settings">
                    Configure
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest system events and user activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground">
                  Activity logs will appear here as users interact with the system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
} 