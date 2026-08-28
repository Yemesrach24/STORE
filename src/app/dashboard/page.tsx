"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { Package, ShoppingBag, FolderTree, Clock } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalItems: number;
}

export default function DashboardPage() {
  const { status: authStatus } = useSession();
  const isSignedIn = authStatus === "authenticated";
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

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

  if (authStatus === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your store overview.
          </p>
        </div>

        {/* Stats Cards — all using brand color */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--brand)]/10 rounded-lg">
                    <Clock className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                    <p className="text-2xl font-bold">{pendingOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--brand)]/10 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/items">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--brand)]/10 rounded-lg">
                    <Package className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/categories">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[var(--brand)]/10 rounded-lg">
                    <FolderTree className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{totalCategories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/items">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 text-center">
                <Package className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">Manage Items</p>
                <p className="text-xs text-muted-foreground mt-1">Add, edit, remove items</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/categories">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 text-center">
                <FolderTree className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">Categories</p>
                <p className="text-xs text-muted-foreground mt-1">Manage product categories</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 text-center">
                <ShoppingBag className="h-7 w-7 mx-auto mb-2 text-[var(--brand)]" />
                <p className="font-semibold text-sm">Orders</p>
                <p className="text-xs text-muted-foreground mt-1">Approve or decline orders</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
