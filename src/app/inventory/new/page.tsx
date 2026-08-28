"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ItemFormModal } from "@/components/inventory/ItemFormModal";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function NewItemPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSaveItem = async (data: any) => {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create item");
    }

    router.push("/inventory");
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ErrorBoundary>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Creating a new inventory item...
              </p>
            </CardContent>
          </Card>

          <ItemFormModal
            open={isModalOpen}
            onOpenChange={(open) => {
              setIsModalOpen(open);
              if (!open) router.push("/inventory");
            }}
            item={null}
            onSave={handleSaveItem}
            onCancel={handleCancel}
          />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
