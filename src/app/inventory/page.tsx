"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryGrid } from "@/components/inventory/InventoryGrid";
import { LoadingGrid } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Settings, Table } from "lucide-react";
import Link from "next/link";

interface InventoryItem {
  id: string;
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

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/items?limit=12');
        if (!response.ok) throw new Error('Failed to fetch inventory items');
        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const handleEditItem = (item: InventoryItem) => {
    // Navigate to edit page
    window.location.href = `/inventory/${item.id}/edit`;
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
      // Remove item from state
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      // You might want to show a toast notification here
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    // Navigate to item details page
    window.location.href = `/inventory/${item.id}`;
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error loading inventory</h3>
                <p className="text-muted-foreground text-center mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Try Again
                </button>
              </CardContent>
            </Card>
          </div>
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
            <h1 className="text-3xl font-bold tracking-tight">Inventory Overview</h1>
            <p className="text-muted-foreground">
              View and manage your inventory items
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory/manage">
              <Button variant="outline">
                <Table className="mr-2 h-4 w-4" />
                Table View
              </Button>
            </Link>
            <Link href="/inventory/new">
              <Button>
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">
                    {items.filter(item => item.quantity > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">
                    {items.filter(item => item.quantity === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {items.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ErrorBoundary>
          <InventoryGrid
            items={items}
            isLoading={isLoading}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onView={handleViewItem}
          />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
} 