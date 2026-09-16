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
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Package, Plus, Edit, Trash2, Loader2, Search, Upload, X, Image as ImageIcon, GripVertical } from "lucide-react";

/* ---------- helpers ---------- */
interface SizeRow {
  name: string;
  nameAm: string;
  price: string; // optional — empty means use base price
}

interface SourceBlock {
  enabled: boolean;
  basePrice: string;
  sizes: SizeRow[];
}

const emptySizeRow = (): SizeRow => ({ name: "", nameAm: "", price: "" });

const emptySource = (): SourceBlock => ({
  enabled: false,
  basePrice: "",
  sizes: [],
});

/* ---------- interfaces ---------- */
interface Category {
  _id: string;
  name: string;
  nameAm?: string;
  imageUrl?: string;
}

interface ServerSize {
  name: string;
  price?: number;
}
interface ServerSource {
  enabled: boolean;
  basePrice: number;
  sizes: ServerSize[];
}

interface Item {
  _id: string;
  name: string;
  nameAm?: string;
  description: string;
  descriptionAm?: string;
  uniqueNumber: string;
  categoryId: { _id: string; name: string; imageUrl?: string } | string;
  color?: string;
  local: ServerSource;
  imported: ServerSource;
  supplier?: string;
  supplierAm?: string;
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  location?: string;
  isActive: boolean;
  createdAt: string;
}

interface ItemFormData {
  name: string;
  nameAm: string;
  description: string;
  descriptionAm: string;
  uniqueNumber: string;
  categoryId: string;
  color: string;
  colorAm: string;
  local: SourceBlock;
  imported: SourceBlock;
  supplier: string;
  supplierAm: string;
  companyName: string;
  companyNameAm: string;
  companyPhone: string;
  companyWhatsapp: string;
  companyTelegram: string;
  companyInstagram: string;
  companyEmail: string;
  imageUrl: string;
  imageUrls: string[];
  tags: string;
  tagsAm: string;
  location: string;
  autoGenerate: boolean;
}

const emptyForm: ItemFormData = {
  name: "",
  nameAm: "",
  description: "",
  descriptionAm: "",
  uniqueNumber: "",
  categoryId: "",
  color: "",
  colorAm: "",
  local: emptySource(),
  imported: emptySource(),
  supplier: "",
  supplierAm: "",
  companyName: "",
  companyNameAm: "",
  companyPhone: "",
  companyWhatsapp: "",
  companyTelegram: "",
  companyInstagram: "",
  companyEmail: "",
  imageUrl: "",
  imageUrls: [],
  tags: "",
  tagsAm: "",
  location: "",
  autoGenerate: true,
};

/* ---------- Source block sub-component ---------- */
function SourceBlockEditor({
  label,
  block,
  onChange,
}: {
  label: string;
  block: SourceBlock;
  onChange: (b: SourceBlock) => void;
}) {
  const { t } = useLanguage();

  const updateSize = (idx: number, field: keyof SizeRow, value: string) => {
    const sizes = block.sizes.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    onChange({ ...block, sizes });
  };

  // Helper to resolve translation key or fallback
  const tl = (enKey: string, amKey?: string) => {
    try { return t(enKey as any); } catch { return enKey; }
  };

  const addSize = () => onChange({ ...block, sizes: [...block.sizes, emptySizeRow()] });
  const removeSize = (idx: number) => onChange({ ...block, sizes: block.sizes.filter((_, i) => i !== idx) });

  return (
    <div className={`rounded-lg border p-4 space-y-3 transition-colors ${block.enabled ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={block.enabled}
          onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
          className="h-4 w-4 rounded"
        />
        <Label className="font-semibold text-sm">{label}</Label>
      </div>
      {block.enabled && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("basePrice")} *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={block.basePrice}
              onChange={(e) => onChange({ ...block, basePrice: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t("sizes")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSize} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" /> {t("addSize")}
              </Button>
            </div>
            {block.sizes.length === 0 && (
              <p className="text-xs text-muted-foreground italic">{t("noSizesHint")}</p>
            )}
            {block.sizes.map((sz, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Input
                    value={sz.name}
                    onChange={(e) => updateSize(idx, "name", e.target.value)}
                    placeholder={t("sizeNamePlaceholder")}
                    className="flex-1"
                  />
                  <Input
                    value={sz.nameAm}
                    onChange={(e) => updateSize(idx, "nameAm", e.target.value)}
                    placeholder={t("sizeNameAmPlaceholder")}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sz.price}
                    onChange={(e) => updateSize(idx, "price", e.target.value)}
                    placeholder={t("sizePricePlaceholder")}
                    className="w-28"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSize(idx)} className="text-red-500 hover:text-red-600 h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {block.sizes.length > 0 && (
              <p className="text-[11px] text-muted-foreground">{t("sizePriceHint")}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Main page ---------- */
export default function AdminItemsPage() {
  const { t, ln } = useLanguage();
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

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => { fetchItems(); }, [currentPage, categoryFilter]);

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
      const params = new URLSearchParams({ page: currentPage.toString(), limit: "15" });
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

  const handleSearch = () => { setCurrentPage(1); fetchItems(); };

  const serverSourceToForm = (s?: ServerSource): SourceBlock => {
    if (!s || !s.enabled) return emptySource();
    return {
      enabled: true,
      basePrice: String(s.basePrice ?? ""),
      sizes: (s.sizes || []).map((sz) => ({ name: sz.name, nameAm: (sz as any).nameAm || "", price: sz.price != null ? String(sz.price) : "" })),
    };
  };

  const openModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      const catId = typeof item.categoryId === "object" ? item.categoryId._id : item.categoryId;
      const allImages = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : []);
      setForm({
        name: item.name,
        nameAm: (item as any).nameAm || "",
        description: item.description,
        descriptionAm: (item as any).descriptionAm || "",
        uniqueNumber: item.uniqueNumber,
        categoryId: catId,
        color: item.color || "",
        colorAm: (item as any).colorAm || "",
        local: serverSourceToForm(item.local),
        imported: serverSourceToForm(item.imported),
        supplier: item.supplier || "",
        supplierAm: item.supplierAm || "",
        companyName: item.companyName || "",
        companyNameAm: item.companyNameAm || "",
        companyPhone: item.companyPhone || "",
        companyWhatsapp: item.companyWhatsapp || "",
        companyTelegram: item.companyTelegram || "",
        companyInstagram: item.companyInstagram || "",
        companyEmail: item.companyEmail || "",
        imageUrl: item.imageUrl || "",
        imageUrls: allImages,
        tags: item.tags?.join(", ") || "",
        tagsAm: (item as any).tagsAm?.join(", ") || "",
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
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || t("uploadFailed"));
      }
      const result = await response.json();
      const newUrl = result.url;
      setForm((prev) => {
        const newUrls = [...prev.imageUrls, newUrl];
        return { ...prev, imageUrls: newUrls, imageUrl: newUrls[0] || "" };
      });
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : t("uploadFailedConfirm"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const newUrls = prev.imageUrls.filter((_, i) => i !== index);
      return { ...prev, imageUrls: newUrls, imageUrl: newUrls[0] || "" };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, any> = {
        name: form.name,
        description: form.description,
        categoryId: form.categoryId,
      };

      if (form.nameAm) body.nameAm = form.nameAm;
      if (form.descriptionAm) body.descriptionAm = form.descriptionAm;
      if (!form.autoGenerate || editingItem) body.uniqueNumber = form.uniqueNumber;
      if (form.color) body.color = form.color;
      if (form.colorAm) body.colorAm = form.colorAm;

      // Local / Imported source blocks
      body.local = {
        enabled: form.local.enabled,
        basePrice: form.local.enabled ? parseFloat(form.local.basePrice) || 0 : 0,
        sizes: form.local.sizes.filter((s) => s.name.trim()).map((s) => ({
          name: s.name.trim(),
          nameAm: s.nameAm.trim() || undefined,
          price: s.price !== "" ? parseFloat(s.price) || undefined : undefined,
        })),
      };
      body.imported = {
        enabled: form.imported.enabled,
        basePrice: form.imported.enabled ? parseFloat(form.imported.basePrice) || 0 : 0,
        sizes: form.imported.sizes.filter((s) => s.name.trim()).map((s) => ({
          name: s.name.trim(),
          nameAm: s.nameAm.trim() || undefined,
          price: s.price !== "" ? parseFloat(s.price) || undefined : undefined,
        })),
      };

      if (form.supplier) body.supplier = form.supplier;
      if (form.supplierAm) body.supplierAm = form.supplierAm;
      if (form.location) body.location = form.location;
      if (form.companyName) body.companyName = form.companyName;
      if (form.companyNameAm) body.companyNameAm = form.companyNameAm;
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
      if (form.tagsAm) {
        body.tagsAm = form.tagsAm.split(",").map((t: string) => t.trim()).filter(Boolean);
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

  const getPriceDisplay = (item: Item) => {
    const parts: string[] = [];
    if (item.local?.enabled) parts.push(`Local: Br ${item.local.basePrice.toLocaleString()}`);
    if (item.imported?.enabled) parts.push(`Imported: Br ${item.imported.basePrice.toLocaleString()}`);
    return parts.length > 0 ? parts.join(" | ") : `Br ${(item as any).price?.toLocaleString() || "0"}`;
  };

  const getCategoryName = (categoryId: string | { _id: string; name: string; nameAm?: string } | undefined) => {
    if (typeof categoryId === "object" && categoryId?.name) return ln(categoryId.name, categoryId.nameAm);
    const cat = categories.find((c) => c._id === categoryId);
    return cat ? ln(cat.name, cat.nameAm) : t("unknown");
  };

  const updateForm = (key: keyof ItemFormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateLocal = (block: SourceBlock) => setForm((prev) => ({ ...prev, local: block }));
  const updateImported = (block: SourceBlock) => setForm((prev) => ({ ...prev, imported: block }));

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("itemsTitle")}</h1>
              <p className="text-muted-foreground">{t("itemsSubtitle")}</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" /> {t("addItem")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{t("totalItems")}</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{t("categories")}</p>
                <p className="text-2xl font-bold">{categories.length}</p>
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
                    placeholder={t("searchItemsPlaceholder")}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <select
                  className="p-2 border rounded text-sm min-w-[180px]"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">{t("allCategories")}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{ln(cat.name, cat.nameAm)}</option>
                  ))}
                </select>
                <Button onClick={handleSearch}>{t("search")}</Button>
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
                  <Button onClick={fetchItems}>{t("tryAgain")}</Button>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">{t("noItemsYet")}</p>
                  <p className="text-muted-foreground mb-4">{t("createFirstProduct")}</p>
                  <Button onClick={() => openModal()}>
                    <Plus className="mr-2 h-4 w-4" /> {t("addItem")}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("itemColumn")}</TableHead>
                      <TableHead>{t("categoryColumn")}</TableHead>
                      <TableHead>{t("priceColumn")}</TableHead>
                      <TableHead>{t("companyColumn")}</TableHead>
                      <TableHead>{t("idColumn")}</TableHead>
                      <TableHead>{t("actionsColumn")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(item.imageUrls && item.imageUrls.length > 0) ? (
                              <img src={item.imageUrls[0]} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{ln(item.name, item.nameAm)}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {ln(item.description, item.descriptionAm)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryName(item.categoryId)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{getPriceDisplay(item)}</TableCell>
                        <TableCell>{ln(item.companyName, item.companyNameAm) || "-"}</TableCell>
                        <TableCell className="text-sm font-mono">{item.uniqueNumber || item._id.slice(-8)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openModal(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteConfirmId(item._id)}>
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
            title={t("deleteItem")}
            message={t("deleteItemConfirm")}
            confirmLabel={t("delete")}
            variant="danger"
            onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
          />

          <ConfirmDialog
            open={!!uploadError}
            title={t("uploadFailed")}
            message={uploadError || t("uploadFailedConfirm")}
            confirmLabel={t("ok")}
            variant="info"
            onConfirm={() => setUploadError(null)}
            onCancel={() => setUploadError(null)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pageOf", { current: currentPage, total: totalPages })}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                {t("next")}
              </Button>
            </div>
          )}

          {/* Add/Edit Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? t("editItem") : t("addNewItem")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    {t("basicInformation")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("itemNameEnglish")} *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder={t("itemNamePlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameAm">{t("itemNameAmharic")}</Label>
                    <Input
                      id="nameAm"
                      value={form.nameAm}
                      onChange={(e) => updateForm("nameAm", e.target.value)}
                      placeholder={t("itemNameAmPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">{t("category")} *</Label>
                    <select
                      id="categoryId"
                      className="w-full p-2 border rounded text-sm"
                      value={form.categoryId}
                      onChange={(e) => updateForm("categoryId", e.target.value)}
                      required
                    >
                      <option value="">{t("selectCategory")}</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{ln(cat.name, cat.nameAm)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="uniqueNumber">{t("uniqueNumber")}</Label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.autoGenerate}
                          onChange={(e) => updateForm("autoGenerate", e.target.checked)}
                          className="rounded"
                        />
                        {t("autoGenerate")}
                      </label>
                    </div>
                    <Input
                      id="uniqueNumber"
                      value={form.uniqueNumber}
                      onChange={(e) => updateForm("uniqueNumber", e.target.value)}
                      placeholder={t("uniqueNumberPlaceholder")}
                      disabled={form.autoGenerate && !editingItem}
                    />
                    {form.autoGenerate && !editingItem && (
                      <p className="text-xs text-muted-foreground">{t("autoGenerateHint")}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">{t("colorOptional")}</Label>
                      <Input
                        id="color"
                        value={form.color}
                        onChange={(e) => updateForm("color", e.target.value)}
                        placeholder={t("colorPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="colorAm">{t("colorAmOptional")}</Label>
                      <Input
                        id="colorAm"
                        value={form.colorAm}
                        onChange={(e) => updateForm("colorAm", e.target.value)}
                        placeholder={t("colorAmPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t("descriptionEnglish")} *</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => updateForm("description", e.target.value)}
                      placeholder={t("descriptionPlaceholder")}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAm">{t("descriptionAmharic")}</Label>
                    <Textarea
                      id="descriptionAm"
                      value={form.descriptionAm}
                      onChange={(e) => updateForm("descriptionAm", e.target.value)}
                      placeholder={t("descriptionAmPlaceholder")}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Local & Imported Pricing */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    {t("pricingBySource")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("pricingBySourceHint")}</p>
                  <div className="space-y-3">
                    <SourceBlockEditor label={t("sourceLocal")} block={form.local} onChange={updateLocal} />
                    <SourceBlockEditor label={t("sourceImported")} block={form.imported} onChange={updateImported} />
                  </div>
                </div>

                {/* Company / Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    {t("companyContactInfo")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("companyName")}</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onChange={(e) => updateForm("companyName", e.target.value)}
                      placeholder={t("companyNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyNameAm">{t("companyNameAm")}</Label>
                    <Input
                      id="companyNameAm"
                      value={form.companyNameAm}
                      onChange={(e) => updateForm("companyNameAm", e.target.value)}
                      placeholder={t("companyNameAmPlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">{t("phone")}</Label>
                      <Input
                        id="companyPhone"
                        value={form.companyPhone}
                        onChange={(e) => updateForm("companyPhone", e.target.value)}
                        placeholder={t("companyPhonePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">{t("email")}</Label>
                      <Input
                        id="companyEmail"
                        value={form.companyEmail}
                        onChange={(e) => updateForm("companyEmail", e.target.value)}
                        placeholder={t("companyEmailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyWhatsapp">{t("whatsapp")}</Label>
                      <Input
                        id="companyWhatsapp"
                        value={form.companyWhatsapp}
                        onChange={(e) => updateForm("companyWhatsapp", e.target.value)}
                        placeholder={t("companyPhonePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyTelegram">{t("telegram")}</Label>
                      <Input
                        id="companyTelegram"
                        value={form.companyTelegram}
                        onChange={(e) => updateForm("companyTelegram", e.target.value)}
                        placeholder={t("companyTelegramPlaceholder")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyInstagram">{t("instagram")}</Label>
                    <Input
                      id="companyInstagram"
                      value={form.companyInstagram}
                      onChange={(e) => updateForm("companyInstagram", e.target.value)}
                      placeholder={t("companyTelegramPlaceholder")}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    {t("additionalInformation")}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="supplier">{t("supplier")}</Label>
                    <Input
                      id="supplier"
                      value={form.supplier}
                      onChange={(e) => updateForm("supplier", e.target.value)}
                      placeholder={t("supplierPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplierAm">{t("supplierAm")}</Label>
                    <Input
                      id="supplierAm"
                      value={form.supplierAm}
                      onChange={(e) => updateForm("supplierAm", e.target.value)}
                      placeholder={t("supplierAmPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">{t("tagsComma")}</Label>
                    <Input
                      id="tags"
                      value={form.tags}
                      onChange={(e) => updateForm("tags", e.target.value)}
                      placeholder={t("tagsPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagsAm">{t("tagsAm")}</Label>
                    <Input
                      id="tagsAm"
                      value={form.tagsAm}
                      onChange={(e) => updateForm("tagsAm", e.target.value)}
                      placeholder={t("tagsAmPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t("locationOptional")}</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => updateForm("location", e.target.value)}
                      placeholder={t("locationPlaceholder")}
                    />
                  </div>
                </div>

                {/* Images Upload - Up to 3 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    {t("imagesUpTo3")}
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
                          <Badge className="absolute bottom-1 left-1 text-[10px]" variant="default">{t("main")}</Badge>
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
                            {isUploading ? t("uploading") : t("addImage")}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("imagesHint")}</p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? t("updateItem") : t("createItem")}
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
