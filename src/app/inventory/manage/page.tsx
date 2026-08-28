"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemFormModal } from "@/components/inventory/ItemFormModal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

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

export default function InventoryManagePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // The table will automatically refresh due to the useEffect dependency
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  };

  const handleViewItem = (item: InventoryItem) => {
    // Navigate to item details page
    window.location.href = `/inventory/${item._id}`;
  };

  const handleSaveItem = async (data: any) => {
    try {
      const url = editingItem 
        ? `/api/items/${editingItem._id}` 
        : "/api/items";
      
      const method = editingItem ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save item");
      }

      // The table will automatically refresh due to the useEffect dependency
    } catch (error) {
      console.error("Error saving item:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ErrorBoundary>
          <InventoryTable
            onAdd={handleAddItem}
            onEdit={handleEditItem as any}
            onDelete={handleDeleteItem as any}
            onView={handleViewItem as any}
          />

          <ItemFormModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            item={editingItem}
            onSave={handleSaveItem}
            onCancel={handleCancel}
          />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
} 