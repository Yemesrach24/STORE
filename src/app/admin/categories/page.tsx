"use client";

import { useState, useEffect, useRef } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Folder, Plus, Edit, Trash2, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories?tree=true");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormName(category.name);
      setFormDescription(category.description || "");
      setFormImageUrl(category.imageUrl || "");
      setFormParentId(category.parentId || "");
      setFormSortOrder(String(category.sortOrder));
    } else {
      setEditingCategory(null);
      setFormName("");
      setFormDescription("");
      setFormImageUrl("");
      setFormParentId("");
      setFormSortOrder("0");
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const result = await response.json();
      setFormImageUrl(result.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = {
        name: formName,
        description: formDescription || undefined,
        imageUrl: formImageUrl || undefined,
        parentId: formParentId || undefined,
        sortOrder: parseInt(formSortOrder) || 0,
      };
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save category");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: unknown) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete category");
      fetchCategories();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const renderCategoryTree = (cats: Category[], depth = 0): React.ReactNode => {
    return cats.map((cat) => (
      <div key={cat._id}>
        <div className={`flex items-center justify-between p-3 border-b hover:bg-muted/50 ${depth > 0 ? "ml-8 border-l-2" : ""}`}>
          <div className="flex items-center gap-3">
            {cat.imageUrl ? (
              <img src={cat.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-medium">{cat.name}</p>
              <p className="text-sm text-muted-foreground">{cat.description || "No description"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">{cat.itemCount ?? 0} items</span>
            <Button variant="ghost" size="sm" onClick={() => openModal(cat)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirmId(cat._id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {cat.children && cat.children.length > 0 && renderCategoryTree(cat.children, depth + 1)}
      </div>
    ));
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
              <p className="text-muted-foreground">Manage product categories. Create parent-child relationships.</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Tree</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No categories yet</p>
                  <p className="text-muted-foreground mb-4">Create your first category to organize products.</p>
                  <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                </div>
              ) : (
                <div>{renderCategoryTree(categories)}</div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Pads, Uniforms, Gloves" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Category description" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Category Image</Label>
                  <div className="flex items-center gap-4">
                    {formImageUrl ? (
                      <div className="relative">
                        <img
                          src={formImageUrl}
                          alt="Category preview"
                          className="w-20 h-20 rounded object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl("")}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded border-2 border-dashed flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPEG, PNG, WebP or GIF. Max 5MB.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <select className="w-full p-2 border rounded text-sm" value={formParentId} onChange={(e) => setFormParentId(e.target.value)}>
                      <option value="">None (Root)</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} min="0" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation */}
          <ConfirmDialog
            open={!!deleteConfirmId}
            title="Delete Category"
            message="Are you sure you want to delete this category? This cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
          />

          {/* Upload error */}
          <ConfirmDialog
            open={!!uploadError}
            title="Upload Failed"
            message={uploadError || "Failed to upload image"}
            confirmLabel="OK"
            variant="info"
            onConfirm={() => setUploadError(null)}
            onCancel={() => setUploadError(null)}
          />
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
