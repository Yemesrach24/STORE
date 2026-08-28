"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface InventoryCardProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: string) => void;
  onView?: (item: InventoryItem) => void;
  className?: string;
}

export function InventoryCard({ item, onEdit, onDelete, onView, className }: InventoryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getStockStatus = () => {
    if (item.quantity === 0) {
      return { status: "out-of-stock", label: "Out of Stock", color: "destructive" as const };
    }
    if (item.quantity <= item.minQuantity) {
      return { status: "low-stock", label: "Low Stock", color: "secondary" as const };
    }
    if (item.quantity >= item.maxQuantity) {
      return { status: "overstocked", label: "Overstocked", color: "secondary" as const };
    }
    return { status: "in-stock", label: "In Stock", color: "default" as const };
  };

  const stockStatus = getStockStatus();
  const totalValue = item.quantity * item.price;

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={cn("group hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-medium truncate">{item.name}</CardTitle>
              <CardDescription className="text-xs truncate">
                {item.sku || "No SKU"}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem key="view" onClick={() => onView(item)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem key="edit" onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  key="delete"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <Badge variant={stockStatus.color} className="text-xs">
              {stockStatus.label}
            </Badge>
            <div className="text-right">
              <p className="text-sm font-medium">{item.quantity} units</p>
              <p className="text-xs text-muted-foreground">
                Br {totalValue.toLocaleString()} value
              </p>
            </div>
          </div>

          {/* Price and Category */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Br {item.price.toLocaleString()}</span>
            <span className="text-muted-foreground">{item.category}</span>
          </div>

          {/* Location and Supplier */}
          {(item.location || item.supplier) && (
            <div className="text-xs text-muted-foreground space-y-1">
              {item.location && (
                <p className="truncate">📍 {item.location}</p>
              )}
              {item.supplier && (
                <p className="truncate">🏢 {item.supplier}</p>
              )}
            </div>
          )}

          {/* Low Stock Warning */}
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
} 