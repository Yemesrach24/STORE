"use client";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  Users,
  Package,
  Shield,
  Database,
  TrendingUp
} from "lucide-react";

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

          {/* Quick Stats — only totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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