"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  Package, TrendingUp, TrendingDown, ShoppingCart, Clock,
  Users, BarChart3, Loader2, Download, Building2, Shield,
} from "lucide-react";

interface AnalyticsData {
  period?: string;
  inventory: { totalItems: number; totalCategories: number; lowStockItems: number; outOfStockItems: number };
  orders: { total: number; pending: number; approved: number; declined: number };
  users: { totalCustomers: number; totalAdmins: number };
  revenue: { total: number; average: number };
  recentOrders: any[];
  topItems: any[];
  categoryStats: any[];
  companyStats?: { _id: string; count: number; revenue: number }[];
}

const PERIODS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "day", label: "" },   // label resolved via t()
  { value: "week", label: "" },
  { value: "month", label: "" },
  { value: "year", label: "" },
];

const PERIOD_TKEY: Record<string, "daily" | "weekly" | "monthly" | "yearly"> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
  year: "yearly",
};

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const { t, ln } = useLanguage();
  const userRole = (session?.user as any)?.role;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("all");

  const isSuperAdmin = userRole === "SUPER_ADMIN";

  useEffect(() => {
    // Wait for session to load before checking role
    if (userRole !== undefined && !isSuperAdmin && userRole) {
      setLoading(false);
      return;
    }
    if (userRole === undefined) return; // Still loading session
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then(async (r) => {
        if (r.status === 403) throw new Error("Only Super Admin can access analytics");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setAnalytics(data))
      .catch((err) => {
        setError(err.message || "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, userRole, period]);

  const exportCSV = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Orders", analytics.orders.total],
      ["Pending Orders", analytics.orders.pending],
      ["Approved Orders", analytics.orders.approved],
      ["Declined Orders", analytics.orders.declined],
      ["Total Revenue (Br)", analytics.revenue.total],
      ["Average Order Value (Br)", analytics.revenue.average],
      ["Total Items", analytics.inventory.totalItems],
      ["Total Categories", analytics.inventory.totalCategories],
      [],
      ["Category", "Orders", "Revenue (Br)"],
      ...analytics.categoryStats.map((c: any) => [c._id, c.count, c.revenue]),
      [],
      ["Company", "Orders", "Revenue (Br)"],
      ...(analytics.companyStats || []).map((c: any) => [c._id || "Unknown", c.count, c.revenue]),
      [],
      ["Top Items", "Orders", "Revenue (Br)"],
      ...analytics.topItems.map((i: any) => [i.itemName, i.count, i.revenue]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Non-super-admin access
  if (!loading && !isSuperAdmin && userRole && userRole !== "undefined") {
    return (
      <AdminGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>{t("accessRestricted")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t("onlySuperAdminAnalytics")}
                </p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AdminGuard>
    );
  }

  if (loading) {
    return (
      <AdminGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DashboardLayout>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <DashboardLayout>
          <div className="p-6">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>{error.includes("Super Admin") ? t("accessRestricted") : t("error")}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">{error}</p>
                {!error.includes("Super Admin") && (
                  <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AdminGuard>
    );
  }

  if (!analytics) return null;

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("analytics")}</h1>
              <p className="text-muted-foreground">{t("analyticsSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Period selector */}
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 p-1 bg-white">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      period === p.value
                        ? "bg-[var(--brand)] text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {p.value === "all" ? t("all") : t(PERIOD_TKEY[p.value])}
                  </button>
                ))}
              </div>
              <Button onClick={exportCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t("exportCsv")}
              </Button>
            </div>
          </div>

          {/* Orders Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalOrders")}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.orders.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("pending")}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{analytics.orders.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("approved")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.orders.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("declined")}</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics.orders.declined}</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue & Inventory */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Br {(analytics.revenue.total || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{t("fromApprovedOrders")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("avgOrderValue")}</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Br {(analytics.revenue.average || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalItems")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.inventory.totalItems}</div>
                <p className="text-xs text-muted-foreground">{analytics.inventory.totalCategories} {t("categoriesSuffix")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Order Table: Category, Item, Quantity, Company */}
          {analytics.recentOrders && analytics.recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("recentOrdersDetails")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">{t("adminOrderNumber")}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t("itemColumn")}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t("categoryColumn")}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t("qtyColumn")}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t("companyColumn")}</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">{t("totalColumn")}</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">{t("statusHeading")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentOrders.map((o: any) => (
                        <tr key={o._id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{o.orderNumber}</td>
                          <td className="py-2">{ln(o.itemName, o.itemNameAm)}</td>
                          <td className="py-2">{ln(o.itemCategory, o.itemCategoryAm)}</td>
                          <td className="py-2">{o.quantity}</td>
                          <td className="py-2">{ln(o.companyName, o.companyNameAm) || "—"}</td>
                          <td className="py-2 text-right font-medium">Br {(o.totalPrice || 0).toLocaleString()}</td>
                          <td className="py-2 text-right">
                            <span className={`text-xs font-medium ${o.status === "APPROVED" ? "text-green-600" : o.status === "DECLINED" ? "text-red-600" : "text-yellow-600"}`}>
                              {o.status === "APPROVED" ? t("approved") : o.status === "DECLINED" ? t("declined") : t("pending")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category & Company Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.categoryStats && analytics.categoryStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("ordersByCategory")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.categoryStats.map((cat: any) => (
                      <div key={cat._id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{cat._id}</span>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">{t("ordersCount", { count: cat.count })}</span>
                          <span className="ml-2 font-medium">Br {(cat.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analytics.companyStats && analytics.companyStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> {t("ordersByCompany")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.companyStats.map((comp: any) => (
                      <div key={comp._id || "unknown"} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{comp._id || t("unknown")}</span>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">{t("ordersCount", { count: comp.count })}</span>
                          <span className="ml-2 font-medium">Br {(comp.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Items */}
          {analytics.topItems && analytics.topItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("topItemsByOrders")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.topItems.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{ln(item.itemName, item.itemNameAm)}</span>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">{t("ordersCount", { count: item.count })}</span>
                        <span className="ml-2 font-medium">Br {(item.revenue || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
