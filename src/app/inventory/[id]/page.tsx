"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ArrowLeft, Edit, Package, AlertTriangle, MapPin, Building, Calendar, Tag } from "lucide-react";
import Link from "next/link";

interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  costPrice: number;
  category: string;
  sku?: string;
  barcode?: string;
  unit: string;
  minQuantity: number;
  maxQuantity: number;
  location?: string;
  supplier?: string;
  imageUrl?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/items/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        const data = await response.json();
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: "Out of Stock", color: "destructive" as const };
    }
    if (item.quantity <= item.minQuantity) {
      return { status: "Low Stock", color: "secondary" as const };
    }
    return { status: "In Stock", color: "default" as const };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !item) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Item not found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {error || "The requested item could not be found."}
              </p>
              <Link href="/inventory">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const stockStatus = getStockStatus(item);
  const totalValue = item.quantity * item.price;
  const profitMargin = item.price > item.costPrice ? ((item.price - item.costPrice) / item.price * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
              <p className="text-muted-foreground">{item.category}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/inventory/${item._id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p className="font-mono">{item.sku || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                    <p className="font-mono">{item.barcode || "Not specified"}</p>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">{item.quantity} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Min Quantity</p>
                    <p className="text-2xl font-bold">{item.minQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Max Quantity</p>
                    <p className="text-2xl font-bold">{item.maxQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={stockStatus.color} className="mt-1">
                      {stockStatus.status}
                    </Badge>
                  </div>
                </div>

                {item.quantity <= item.minQuantity && item.quantity > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Low stock alert: Current quantity is below minimum threshold
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sale Price</p>
                    <p className="text-2xl font-bold">Br {(item.price ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost Price</p>
                    <p className="text-2xl font-bold">Br {(item.costPrice ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">Br {(totalValue ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Update Stock
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  View History
                </Button>
              </CardContent>
            </Card>

            {/* Location & Supplier */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                )}
                
                {item.supplier && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Supplier</p>
                      <p className="text-sm text-muted-foreground">{item.supplier}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 