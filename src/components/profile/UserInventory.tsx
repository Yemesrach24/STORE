"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingGrid } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import Link from "next/link";

interface InventoryItem {
  _id: string;
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

interface UserInventoryProps {
  userId: string;
}

export function UserInventory({ userId }: UserInventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  useEffect(() => {
    const fetchUserInventory = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          userId: userId,
          ...(searchQuery && { search: searchQuery }),
          ...(categoryFilter !== "all" && { category: categoryFilter }),
          ...(stockFilter === "in-stock" && { inStock: "true" }),
          ...(stockFilter === "out-of-stock" && { inStock: "false" }),
          ...(stockFilter === "low-stock" && { lowStock: "true" }),
        });

        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) throw new Error("Failed to fetch inventory items");
        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInventory();
  }, [userId, searchQuery, categoryFilter, stockFilter]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: "Out of Stock", color: "destructive" as const };
    }
    if (item.quantity <= item.minQuantity) {
      return { status: "Low Stock", color: "warning" as const };
    }
    return { status: "In Stock", color: "default" as const };
  };

  const categories = Array.from(new Set(items.map((item) => item.category))).sort();

  const stats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    outOfStock: items.filter(item => item.quantity === 0).length,
    lowStock: items.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity).length,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading inventory</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Inventory</h2>
          <p className="text-muted-foreground">
            Manage your personal inventory items
          </p>
        </div>
        <Link href="/inventory/manage">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Low Stock</p>
                <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <ErrorBoundary>
        {isLoading ? (
          <LoadingGrid count={6} />
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || categoryFilter !== "all" || stockFilter !== "all"
                  ? "No items match your current filters."
                  : "You haven't added any inventory items yet."}
              </p>
              <Link href="/inventory/manage">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const stockStatus = getStockStatus(item);
              const totalValue = item.quantity * item.price;

              return (
                <Card key={item._id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {item.name}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {item.sku || "No SKU"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/inventory/${item._id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/inventory/${item._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant={stockStatus.color} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.quantity} units</p>
                          <p className="text-xs text-muted-foreground">
                            ${totalValue.toFixed(2)} value
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">{item.category}</span>
                      </div>

                      {item.location && (
                        <p className="text-xs text-muted-foreground truncate">
                          📍 {item.location}
                        </p>
                      )}

                      {item.quantity <= item.minQuantity && item.quantity > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Stock level below minimum ({item.minQuantity})</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
} 