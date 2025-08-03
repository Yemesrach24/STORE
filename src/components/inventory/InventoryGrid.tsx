"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryCard } from "./InventoryCard";
import { LoadingGrid } from "@/components/ui/loading";
import { Search, Filter, Plus, Package, AlertTriangle } from "lucide-react";
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

interface InventoryGridProps {
  items: InventoryItem[];
  isLoading?: boolean;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: string) => void;
  onView?: (item: InventoryItem) => void;
  className?: string;
}

export function InventoryGrid({ 
  items, 
  isLoading = false, 
  onEdit, 
  onDelete, 
  onView, 
  className 
}: InventoryGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map(item => item.category))];
    return uniqueCategories.sort();
  }, [items]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      // Stock filter
      let matchesStock = true;
      switch (stockFilter) {
        case "in-stock":
          matchesStock = item.quantity > 0;
          break;
        case "out-of-stock":
          matchesStock = item.quantity === 0;
          break;
        case "low-stock":
          matchesStock = item.quantity > 0 && item.quantity <= item.minQuantity;
          break;
        case "overstocked":
          matchesStock = item.quantity >= item.maxQuantity;
          break;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchQuery, categoryFilter, stockFilter]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity).length;

    return { totalItems, totalValue, outOfStock, lowStock };
  }, [items]);

  if (isLoading) {
    return <LoadingGrid count={6} />;
  }

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">
              Manage your inventory items and track stock levels
            </p>
          </div>
          <Link href="/inventory/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        {/* Search and filters */}
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
              {categories.map(category => (
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
              <SelectItem value="overstocked">Overstocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} of {items.length} items
        </p>
        {(searchQuery || categoryFilter !== "all" || stockFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setStockFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {items.length === 0 
                ? "Get started by adding your first inventory item."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            {items.length === 0 && (
              <Link href="/inventory/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}
    </div>
  );
} 