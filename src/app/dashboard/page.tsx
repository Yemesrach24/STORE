"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryGrid } from "@/components/inventory/InventoryGrid";
import { LoadingStats, LoadingSpinner } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, TrendingUp, TrendingDown, AlertTriangle, DollarSign, RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { useNetworkStatus } from "@/hooks/use-network-status";

// TypeScript interfaces
interface DashboardStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentTransactions: number;
  monthlyGrowth: number;
  summary?: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
  };
  recentActivity?: {
    recentTransactions: any[];
    monthlyStats: {
      inTransactions: number;
      outTransactions: number;
    };
  };
  analytics?: {
    topCategories: any[];
  };
}

interface InventoryItem {
  _id: string;
  id?: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  sku?: string;
  imageUrl?: string;
  minQuantity: number;
  maxQuantity: number;
  location?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function DashboardPage() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const { apiRequest } = useApi();
  const { isOnline, isOffline } = useNetworkStatus();
  
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Authentication check
  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [authLoaded, isSignedIn, router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      setLoadingState('loading');
      setError(null);

      // Check network status
      if (isOffline) {
        throw new Error('You are currently offline. Please check your internet connection.');
      }

      // Fetch dashboard stats and inventory items in parallel
      const [statsResponse, itemsResponse] = await Promise.all([
        apiRequest<DashboardStats>('/api/dashboard'),
        apiRequest<{ items: InventoryItem[] }>('/api/items?limit=12')
      ]);

      // Check for errors
      if (statsResponse.error) {
        throw new Error(statsResponse.error);
      }

      if (itemsResponse.error) {
        throw new Error(itemsResponse.error);
      }

      setStats(statsResponse.data!);
      setItems(itemsResponse.data?.items || []);
      setLoadingState('success');
      setRetryCount(0);

      // Show success toast for first load
      if (retryCount === 0) {
        toast.success('Dashboard loaded successfully');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLoadingState('error');
      setRetryCount(prev => prev + 1);

      // Show error toast
      toast.error(errorMessage);

      console.error('Dashboard fetch error:', err);
    }
  }, [isSignedIn, isOffline, apiRequest, retryCount]);

  // Initial data fetch
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      fetchDashboardData();
    }
  }, [authLoaded, isSignedIn, fetchDashboardData]);

  // Item management handlers
  const handleEditItem = useCallback((item: InventoryItem) => {
    const itemId = item._id || item.id;
    if (itemId) {
      router.push(`/inventory/${itemId}/edit`);
    }
  }, [router]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      const response = await apiRequest(`/api/items/${itemId}`, { method: 'DELETE' });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Remove item from state
      setItems(prev => prev.filter(item => (item._id || item.id) !== itemId));
      toast.success('Item deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      toast.error(errorMessage);
      console.error('Error deleting item:', err);
    }
  }, [apiRequest]);

  const handleViewItem = useCallback((item: InventoryItem) => {
    const itemId = item._id || item.id;
    if (itemId) {
      router.push(`/inventory/${itemId}`);
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Loading state
  if (!authLoaded) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  // Authentication required
  if (!isSignedIn) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground text-center mb-4">
                Please sign in to access the dashboard.
              </p>
              <Button onClick={() => router.push('/sign-in')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && loadingState === 'error') {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's an overview of your inventory.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-4">
              <div>
                <strong>Error loading dashboard:</strong> {error}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleRetry} 
                  disabled={loadingState === 'loading'}
                  size="sm"
                >
                  {loadingState === 'loading' ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Try Again
                </Button>
                {isOffline && (
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    size="sm"
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Check Connection
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Network Status */}
          {isOffline && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You are currently offline. Please check your internet connection and try again.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your inventory.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/new">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="outline">
                View All
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRetry}
              disabled={loadingState === 'loading'}
            >
              <RefreshCw className={`h-4 w-4 ${loadingState === 'loading' ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Network Status Indicator */}
        {isOffline && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You are currently offline. Some features may not work properly.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {loadingState === 'loading' ? (
          <LoadingStats />
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Items</p>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Out of Stock</p>
                    <p className="text-2xl font-bold text-destructive">{stats.outOfStockItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">Low Stock</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.lowStockItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Recent Inventory Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent Items</h2>
              <p className="text-muted-foreground">
                Latest inventory items added to your system
              </p>
            </div>
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                View All Items
              </Button>
            </Link>
          </div>

          <ErrorBoundary>
            <InventoryGrid
              items={items}
              isLoading={loadingState === 'loading'}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onView={handleViewItem}
            />
          </ErrorBoundary>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/inventory/new">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Add New Item
                </Button>
              </Link>
              <Link href="/transactions">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Transactions
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingDown className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alerts</CardTitle>
              <CardDescription>
                Items that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.outOfStockItems || stats?.lowStockItems ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Out of stock items</span>
                    <Badge variant="destructive">{stats.outOfStockItems}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low stock items</span>
                    <Badge variant="secondary">{stats.lowStockItems}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No alerts at the moment</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>
                Latest transactions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Recent transactions</span>
                  <Badge variant="outline">{stats?.recentTransactions || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Monthly growth</span>
                  <Badge variant={stats?.monthlyGrowth && stats.monthlyGrowth > 0 ? "default" : "secondary"}>
                    {stats?.monthlyGrowth ? `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth}%` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 