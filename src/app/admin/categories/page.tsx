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
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { Folder, Plus, Edit, Trash2, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  nameAm?: string;
  description?: string;
  descriptionAm?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const { t, ln } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formNameAm, setFormNameAm] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDescriptionAm, setFormDescriptionAm] = useState("");
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
      setFormNameAm(category.nameAm || "");
      setFormDescription(category.description || "");
      setFormDescriptionAm(category.descriptionAm || "");
      setFormImageUrl(category.imageUrl || "");
      setFormParentId(category.parentId || "");
      setFormSortOrder(String(category.sortOrder));
    } else {
      setEditingCategory(null);
      setFormName("");
      setFormNameAm("");
      setFormDescription("");
      setFormDescriptionAm("");
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
        throw new Error(err.error || t("uploadFailed"));
      }

      const result = await response.json();
      setFormImageUrl(result.url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : t("uploadFailedConfirm"));
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
        nameAm: formNameAm || undefined,
        description: formDescription || undefined,
        descriptionAm: formDescriptionAm || undefined,
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
              <p className="font-medium">{ln(cat.name, cat.nameAm)}</p>
              <p className="text-sm text-muted-foreground">{ln(cat.description, cat.descriptionAm) || t("noDescription")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">{t("itemsCountLabel", { count: cat.itemCount ?? 0 })}</span>
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
              <h1 className="text-3xl font-bold tracking-tight">{t("categoriesTitle2")}</h1>
              <p className="text-muted-foreground">{t("categoriesSubtitle")}</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="mr-2 h-4 w-4" /> {t("addCategory")}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("categoryTree")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">{t("noCategoriesYet")}</p>
                  <p className="text-muted-foreground mb-4">{t("createFirstCategory")}</p>
                  <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> {t("addCategory")}</Button>
                </div>
              ) : (
                <div>{renderCategoryTree(categories)}</div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? t("editCategory") : t("newCategory")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("nameEnglish")} *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t("categoryNamePlaceholder")} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("nameAmharic")}</Label>
                  <Input value={formNameAm} onChange={(e) => setFormNameAm(e.target.value)} placeholder={t("categoryNameAmPlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("descriptionLabel")}</Label>
                  <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={t("categoryDescriptionPlaceholder")} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>{t("descriptionAmLabel")}</Label>
                  <Textarea value={formDescriptionAm} onChange={(e) => setFormDescriptionAm(e.target.value)} placeholder={t("categoryDescriptionAmPlaceholder")} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>{t("categoryImage")}</Label>
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
                        {isUploading ? t("uploading") : t("uploadImage")}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">{t("imageRequirements")}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("parentCategory")}</Label>
                    <select className="w-full p-2 border rounded text-sm" value={formParentId} onChange={(e) => setFormParentId(e.target.value)}>
                      <option value="">{t("noneRoot")}</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{ln(c.name, c.nameAm)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("sortOrder")}</Label>
                    <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} min="0" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("cancel")}</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCategory ? t("update") : t("create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation */}
          <ConfirmDialog
            open={!!deleteConfirmId}
            title={t("deleteCategory")}
            message={t("deleteCategoryConfirm")}
            confirmLabel={t("delete")}
            variant="danger"
            onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            onCancel={() => setDeleteConfirmId(null)}
          />

          {/* Upload error */}
          <ConfirmDialog
            open={!!uploadError}
            title={t("uploadFailed")}
            message={uploadError || t("uploadFailedConfirm")}
            confirmLabel={t("ok")}
            variant="info"
            onConfirm={() => setUploadError(null)}
            onCancel={() => setUploadError(null)}
          />
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
