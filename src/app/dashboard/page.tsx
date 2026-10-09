"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { formatPrice } from "@/lib/price";
import { Package, ShoppingBag, FolderTree, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalItems: number;
}

interface DashItem {
  _id: string;
  name: string;
  nameAm?: string;
  imageUrl?: string;
  imageUrls?: string[];
  categoryId?: { _id: string; name: string; nameAm?: string } | string;
  local?: { enabled: boolean; basePrice: number | string };
  imported?: { enabled: boolean; basePrice: number | string };
  companyName?: string;
  companyNameAm?: string;
  uniqueNumber?: string;
}

const ITEMS_PER_PAGE = 6;

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const { t, ln } = useLanguage();
  const isSignedIn = authStatus === "authenticated";
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recentItems, setRecentItems] = useState<DashItem[]>([]);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPages, setItemsPages] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (isSignedIn) {
      Promise.all([
        fetch("/api/dashboard").then((r) => r.json()).catch(() => null),
        fetch("/api/orders?status=PENDING&limit=1").then((r) => r.json()).catch(() => null),
        fetch("/api/orders?limit=1").then((r) => r.json()).catch(() => null),
        fetch("/api/shop/categories").then((r) => r.json()).catch(() => null),
      ]).then(([dashData, pendingData, allData, catData]) => {
        if (dashData) setStats(dashData);
        if (pendingData?.pagination) setPendingOrders(pendingData.pagination.total || 0);
        if (allData?.pagination) setTotalOrders(allData.pagination.total || 0);
        if (catData?.categories) setTotalCategories(catData.categories.length || 0);
        setLoading(false);
      });
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    setItemsLoading(true);
    fetch(`/api/items?page=${itemsPage}&limit=${ITEMS_PER_PAGE}`)
      .then((r) => r.json())
      .then((data) => {
        setRecentItems(data.items || []);
        setItemsPages(data.pagination?.pages || 1);
        setItemsTotal(data.pagination?.total || 0);
      })
      .catch(() => null)
      .finally(() => setItemsLoading(false));
  }, [isSignedIn, itemsPage]);

  if (authStatus === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const priceLabel = (item: DashItem) => {
    const parts: string[] = [];
    if (item.local?.enabled) parts.push(formatPrice(item.local.basePrice));
    if (item.imported?.enabled) parts.push(formatPrice(item.imported.basePrice));
    return parts.length > 0 ? parts.join(" / ") : formatPrice(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome banner — plain white card */}
        <div className="relative overflow-hidden rounded-2xl bg-white text-stone-900 border border-stone-200/80 shadow-sm p-6 sm:p-8">
          <h1 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight">{t("dashboard")}</h1>
          <p className="relative text-stone-500 text-sm mt-1">{t("welcomeBack")}</p>
          <div className="relative flex flex-wrap gap-2 mt-4">
            <Link href="/admin/items">
              <Button size="sm" className="bg-[#0E2B1E] text-white hover:bg-[#1a4530] font-semibold rounded-full">
                <Package className="h-4 w-4 mr-1" /> {t("manageItems")}
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button size="sm" variant="outline" className="font-semibold rounded-full">
                <ShoppingBag className="h-4 w-4 mr-1" /> {t("orders")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards — all using brand color */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-400">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("pendingOrders")}</p>
                    <p className="text-2xl font-bold">{pendingOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[var(--brand)]">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--brand)]/10 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("totalOrders")}</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/items">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("totalItems")}</p>
                    <p className="text-2xl font-bold">{stats?.totalItems ?? itemsTotal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/categories">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderTree className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("categories")}</p>
                    <p className="text-2xl font-bold">{totalCategories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Items with pagination */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{t("recentItems")}</h2>
                <p className="text-xs text-muted-foreground">
                  {itemsTotal > 0 ? t("itemsCount", { count: itemsTotal }) : t("recentItemsDesc")}
                </p>
              </div>
              <Link href="/admin/items" className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-dark)] flex items-center gap-1">
                {t("viewAllItems")} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : recentItems.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold">{t("noItemsYet")}</p>
                <p className="text-xs text-muted-foreground mb-4">{t("createFirstProduct")}</p>
                <Link href="/admin/items">
                  <Button size="sm">{t("addItem")}</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentItems.map((item) => {
                    const img = item.imageUrls?.[0] || item.imageUrl;
                    return (
                      <div key={item._id} className="flex items-center gap-3 border rounded-xl p-3 hover:shadow-sm transition-shadow bg-card">
                        {img ? (
                          <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{ln(item.name, item.nameAm)}</p>
                          <p className="text-xs text-muted-foreground font-mono">{item.uniqueNumber || item._id.slice(-8)}</p>
                          <p className="text-sm font-bold text-[var(--brand)]">{priceLabel(item)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {itemsPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={itemsPage === 1}
                      onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                    >
                      {t("previous")}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t("pageOf", { current: itemsPage, total: itemsPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={itemsPage === itemsPages}
                      onClick={() => setItemsPage((p) => Math.min(itemsPages, p + 1))}
                    >
                      {t("next")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/items">
            <Card className="hover:shadow-md hover:border-[var(--brand)]/40 transition-all cursor-pointer">
              <CardContent className="p-5 text-center">
                <Package className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">{t("manageItems")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("manageItemsDesc")}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/categories">
            <Card className="hover:shadow-md hover:border-[var(--brand)]/40 transition-all cursor-pointer">
              <CardContent className="p-5 text-center">
                <FolderTree className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">{t("categories")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("categoriesDesc")}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md hover:border-[var(--brand)]/40 transition-all cursor-pointer">
              <CardContent className="p-5 text-center">
                <ShoppingBag className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">{t("orders")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("ordersDesc")}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
