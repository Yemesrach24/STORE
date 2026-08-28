"use client";

import { useState, useEffect, useRef } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Package, Plus, Edit, Trash2, Loader2, Search, Upload, X, Image as ImageIcon } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  uniqueNumber: string;
  categoryId: { _id: string; name: string; imageUrl?: string } | string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  supplier?: string;
  companyName?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  location?: string;
  isActive: boolean;
  createdAt: string;
}

interface ItemFormData {
  name: string;
  description: string;
  uniqueNumber: string;
  categoryId: string;
  size: string;
  color: string;
  price: string;
  quantity: string;
  supplier: string;
  companyName: string;
  companyPhone: string;
  companyWhatsapp: string;
  companyTelegram: string;
  companyInstagram: string;
  companyEmail: string;
  imageUrl: string;
  imageUrls: string[];
  tags: string;
  location: string;
  autoGenerate: boolean;
}

const emptyForm: ItemFormData = {
  name: "",
  description: "",
  uniqueNumber: "",
  categoryId: "",
  size: "",
  color: "",
  price: "",
  quantity: "",
  supplier: "",
  companyName: "",
  companyPhone: "",
  companyWhatsapp: "",
  companyTelegram: "",
  companyInstagram: "",
  companyEmail: "",
  imageUrl: "",
  imageUrls: [],
  tags: "",
  location: "",
  autoGenerate: true,
};

export default function AdminItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/shop/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
      });
      if (searchTerm) params.set("search", searchTerm);
      if (categoryFilter !== "all") params.set("categoryId", categoryFilter);

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems();
  };

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      const catId = typeof item.categoryId === "object" ? item.categoryId._id : item.categoryId;
      const allImages = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
      setForm({
        name: item.name,
        description: item.description,
        uniqueNumber: item.uniqueNumber,
        categoryId: catId,
        size: item.size || "",
        color: item.color || "",
        price: item.price.toString(),
        quantity: item.quantity.toString(),
        supplier: item.supplier || "",
        companyName: item.companyName || "",
        companyPhone: item.companyPhone || "",
        companyWhatsapp: item.companyWhatsapp || "",
        companyTelegram: item.companyTelegram || "",
        companyInstagram: item.companyInstagram || "",
        companyEmail: item.companyEmail || "",
        imageUrl: item.imageUrl || "",
        imageUrls: allImages,
        tags: item.tags?.join(", ") || "",
        location: item.location || "",
        autoGenerate: false,
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
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
      formData.append("folder", "items");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const result = await response.json();
      const newUrl = result.url;

      setForm((prev) => {
        const newUrls = [...prev.imageUrls, newUrl];
        return {
          ...prev,
          imageUrls: newUrls,
          imageUrl: newUrls[0] || "",
        };
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newUrls = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: newUrls,
        imageUrl: newUrls[0] || "",
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string | number | string[] | boolean> = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      };

      if (!form.autoGenerate || editingItem) {
        body.uniqueNumber = form.uniqueNumber;
      }

      if (form.size) body.size = form.size;
      if (form.color) body.color = form.color;
      if (form.supplier) body.supplier = form.supplier;
      if (form.location) body.location = form.location;
      if (form.companyName) body.companyName = form.companyName;
      if (form.companyPhone) body.companyPhone = form.companyPhone;
      if (form.companyWhatsapp) body.companyWhatsapp = form.companyWhatsapp;
      if (form.companyTelegram) body.companyTelegram = form.companyTelegram;
      if (form.companyInstagram) body.companyInstagram = form.companyInstagram;
      if (form.companyEmail) body.companyEmail = form.companyEmail;
      if (form.imageUrls.length > 0) {
        body.imageUrls = form.imageUrls;
        body.imageUrl = form.imageUrls[0];
      }
      if (form.tags) {
        body.tags = form.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      const url = editingItem ? `/api/items/${editingItem._id}` : "/api/items";
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save item");
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(null);
    try {
      const response = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  const getStockBadge = (status: string, quantity: number) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-100 text-green-800">In Stock ({quantity})</Badge>;
      case "low_stock":
        return <Badge className="bg-yellow-100 text-yellow-800">Low Stock ({quantity})</Badge>;
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryName = (categoryId: string | { _id: string; name: string } | undefined) => {
    if (typeof categoryId === "object" && categoryId?.name) return categoryId.name;
    const cat = categories.find((c) => c._id === categoryId);
    return cat?.name || "Unknown";
  };

  const updateForm = (key: keyof ItemFormData, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Items</h1>
              <p className="text-muted-foreground">
                Manage your product catalog. Add, edit, and remove items.
              </p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-[var(--brand)]">
                  {items.filter((i) => i.stockStatus === "out_of_stock").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <select
                  className="p-2 border rounded text-sm min-w-[180px]"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchItems}>Try Again</Button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">No items yet</p>
                  <p className="text-muted-foreground mb-4">
                    Create your first product to get started.
                  </p>
                  <Button onClick={() => openModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(item.imageUrls && item.imageUrls.length > 0) ? (
                              <img
                                src={item.imageUrls[0]}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryName(item.categoryId)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          Br {(item.price ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{item.companyName || "-"}</TableCell>
                        <TableCell>
                          {getStockBadge(item.stockStatus, item.quantity)}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {item.uniqueNumber || item._id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openModal(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteConfirmId(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Delete confirmation */}
          <ConfirmDialog
            open={!!deleteConfirmId}
            title="Delete Item"
            message="Are you sure you want to delete this item? This cannot be undone."
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Add/Edit Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Basic Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="e.g., Single Pad, Double Pad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <select
                      id="categoryId"
                      className="w-full p-2 border rounded text-sm"
                      value={form.categoryId}
                      onChange={(e) => updateForm("categoryId", e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="uniqueNumber">Unique Number</Label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.autoGenerate}
                          onChange={(e) => updateForm("autoGenerate", e.target.checked)}
                          className="rounded"
                        />
                        Auto-generate
                      </label>
                    </div>
                    <Input
                      id="uniqueNumber"
                      value={form.uniqueNumber}
                      onChange={(e) => updateForm("uniqueNumber", e.target.value)}
                      placeholder="e.g., TKD-001 or leave blank for auto"
                      disabled={form.autoGenerate && !editingItem}
                    />
                    {form.autoGenerate && !editingItem && (
                      <p className="text-xs text-muted-foreground">
                        A unique number will be generated automatically if left blank.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Size (optional)</Label>
                      <Input
                        id="size"
                        value={form.size}
                        onChange={(e) => updateForm("size", e.target.value)}
                        placeholder="e.g., M, L, XL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">Color (optional)</Label>
                      <Input
                        id="color"
                        value={form.color}
                        onChange={(e) => updateForm("color", e.target.value)}
                        placeholder="e.g., Black, White"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      placeholder="Describe the product..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Pricing & Stock
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Sale Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => updateForm("price", e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Current Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={form.quantity}
                        onChange={(e) => updateForm("quantity", e.target.value)}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Company / Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Company & Contact Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                      placeholder="e.g., TKD Supplies Ethiopia"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Phone</Label>
                      <Input
                        id="companyPhone"
                        value={form.companyPhone}
                        onChange={(e) => updateForm("companyPhone", e.target.value)}
                        placeholder="e.g., +251911234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email</Label>
                      <Input
                        id="companyEmail"
                        value={form.companyEmail}
                        onChange={(e) => updateForm("companyEmail", e.target.value)}
                        placeholder="e.g., info@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyWhatsapp">WhatsApp</Label>
                      <Input
                        id="companyWhatsapp"
                        value={form.companyWhatsapp}
                        onChange={(e) => updateForm("companyWhatsapp", e.target.value)}
                        placeholder="e.g., +251911234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyTelegram">Telegram</Label>
                      <Input
                        id="companyTelegram"
                        value={form.companyTelegram}
                        onChange={(e) => updateForm("companyTelegram", e.target.value)}
                        placeholder="e.g., @company"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyInstagram">Instagram</Label>
                    <Input
                      id="companyInstagram"
                      value={form.companyInstagram}
                      onChange={(e) => updateForm("companyInstagram", e.target.value)}
                      placeholder="e.g., @company"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Additional Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={form.supplier}
                      onChange={(e) => updateForm("supplier", e.target.value)}
                      placeholder="Producer / supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => updateForm("tags", e.target.value)}
                      placeholder="e.g., protective, training, beginner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => updateForm("location", e.target.value)}
                      placeholder="e.g., Warehouse A, Shelf 3"
                    />
                  </div>
                </div>

                {/* Images Upload - Up to 3 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Images (up to 3)
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {form.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={url}
                          alt={`Product ${idx + 1}`}
                          className="w-full aspect-square rounded object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {idx === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-[10px]" variant="default">Main</Badge>
                        )}
                      </div>
                    ))}
                    {form.imageUrls.length < 3 && (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded aspect-square">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex flex-col items-center h-full justify-center"
                        >
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin mb-1" />
                          ) : (
                            <Upload className="h-6 w-6 mb-1" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {isUploading ? "Uploading..." : "Add Image"}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP or GIF. Max 5MB each. First image is the main image.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingItem ? "Update Item" : "Create Item"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
