"use client";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/i18n/LanguageProvider";
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
  const { t } = useLanguage();
  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("adminPanel")}</h1>
              <p className="text-muted-foreground">{t("adminPanelSubtitle")}</p>
            </div>
            <Badge variant="secondary" className="w-fit">
              <Shield className="mr-2 h-4 w-4" />
              {t("adminAccess")}
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalUsers")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0 {t("fromLastMonth")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalItems")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  +0 {t("fromLastMonth")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("activeSessions")}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">{t("currentlyOnline")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("systemStatus")}</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{t("online")}</div>
                <p className="text-xs text-muted-foreground">{t("allSystemsOperational")}</p>
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
                  {t("manageUsersTitle")}
                </CardTitle>
                <CardDescription>{t("userManagementDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("totalUsers")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("activeUsers")}:</span>
                    <span className="font-medium text-green-600">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("pendingApprovals")}:</span>
                    <span className="font-medium text-amber-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/users">{t("manageUsers")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Global Inventory */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("globalInventory")}
                </CardTitle>
                <CardDescription>{t("globalInventoryDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("totalItems")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("lowStockTitle")}:</span>
                    <span className="font-medium text-amber-600">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("outOfStock")}:</span>
                    <span className="font-medium text-red-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/inventory">{t("viewInventory")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("analytics")}
                </CardTitle>
                <CardDescription>{t("analyticsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("dailyActiveUsers")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("monthlyGrowth")}:</span>
                    <span className="font-medium text-green-600">+0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("systemUptime")}:</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/analytics">{t("viewAnalytics")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Role Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("roleManagement")}
                </CardTitle>
                <CardDescription>{t("roleManagementDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("admins")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("managers")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("regularUsers")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/roles">{t("manageRoles")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t("activityLogs")}
                </CardTitle>
                <CardDescription>{t("activityLogsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("todaysEvents")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("thisWeek")}:</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("alerts")}:</span>
                    <span className="font-medium text-red-600">0</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/logs">{t("viewLogs")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("systemSettings")}
                </CardTitle>
                <CardDescription>{t("systemSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("databaseSize")}:</span>
                    <span className="font-medium">0 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("backupStatus")}:</span>
                    <span className="font-medium text-green-600">{t("upToDate")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("lastMaintenance")}:</span>
                    <span className="font-medium">{t("today")}</span>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link href="/admin/settings">{t("configure")}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("recentActivity")}
              </CardTitle>
              <CardDescription>{t("recentActivityDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("noRecentActivity")}</h3>
                <p className="text-muted-foreground">{t("noRecentActivityDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
} 