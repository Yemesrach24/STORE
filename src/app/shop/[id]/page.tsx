"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  ArrowLeft, Loader2, ShoppingBag, Phone, MessageCircle, Send, Mail,
  Package, Copy, Check, ChevronLeft, ChevronRight, Minus, Plus,
} from "lucide-react";

/* ---------- Types ---------- */
interface ItemSize {
  name: string;
  price?: number;
}
interface ItemSource {
  enabled: boolean;
  basePrice: number;
  sizes: ItemSize[];
}

interface Item {
  _id: string;
  name: string;
  nameAm?: string;
  description: string;
  descriptionAm?: string;
  uniqueNumber: string;
  categoryId: { _id: string; name: string; nameAm?: string; imageUrl?: string };
  color?: string;
  local: ItemSource;
  imported: ItemSource;
  imageUrl?: string;
  imageUrls?: string[];
  tags?: string[];
  supplier?: string;
  supplierAm?: string;
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  location?: string;
}

/** What the customer is ordering — one per source type */
interface SourceOrder {
  source: "local" | "imported";
  sizes: { name: string; price: number; qty: number }[];
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t, ln } = useLanguage();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerClub, setBuyerClub] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; club?: string }>({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);

  // Source selection state — which sources the customer is ordering from
  const [selectedLocal, setSelectedLocal] = useState(false);
  const [selectedImported, setSelectedImported] = useState(false);
  // Per-source per-size quantities: { "local-SizeName": qty, ... }
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (params.id) fetchItem(params.id as string);
  }, [params.id]);

  // Auto-select source when only one is enabled
  useEffect(() => {
    if (!item) return;
    const hasBoth = item.local.enabled && item.imported.enabled;
    if (!hasBoth) {
      if (item.local.enabled) setSelectedLocal(true);
      if (item.imported.enabled) setSelectedImported(true);
    }
  }, [item]);

  const fetchItem = async (id: string) => {
    try {
      const response = await fetch(`/api/shop/items/${id}`);
      if (!response.ok) throw new Error("Item not found");
      const data = await response.json();
      setItem(data.item || data);
    } catch {
      setError(t("productNotFound"));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { name?: string; phone?: string; club?: string } = {};
    if (!buyerName.trim()) errors.name = t("fillName");
    if (!buyerPhone.trim()) errors.phone = t("fillPhone");
    if (!buyerClub.trim()) errors.club = t("fillClub");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Get the price for a size in a source block */
  const sizePrice = (source: ItemSource, sizeName: string): number => {
    const sz = source.sizes.find((s) => s.name === sizeName);
    if (sz && sz.price != null) return sz.price;
    return source.basePrice;
  };

  /** Build line items for order from current selections */
  const buildLineItems = (): { source: "local" | "imported"; size?: string; quantity: number; unitPrice: number }[] => {
    if (!item) return [];
    const lineItems: { source: "local" | "imported"; size?: string; quantity: number; unitPrice: number }[] = [];

    if (selectedLocal && item.local.enabled) {
      if (item.local.sizes.length === 0) {
        // No sizes — order from base price
        const key = "local-";
        const qty = sizeQuantities[key] || 0;
        if (qty > 0) lineItems.push({ source: "local", quantity: qty, unitPrice: item.local.basePrice });
      } else {
        for (const sz of item.local.sizes) {
          const key = `local-${sz.name}`;
          const qty = sizeQuantities[key] || 0;
          if (qty > 0) lineItems.push({ source: "local", size: sz.name, quantity: qty, unitPrice: sizePrice(item.local, sz.name) });
        }
      }
    }
    if (selectedImported && item.imported.enabled) {
      if (item.imported.sizes.length === 0) {
        const key = "imported-";
        const qty = sizeQuantities[key] || 0;
        if (qty > 0) lineItems.push({ source: "imported", quantity: qty, unitPrice: item.imported.basePrice });
      } else {
        for (const sz of item.imported.sizes) {
          const key = `imported-${sz.name}`;
          const qty = sizeQuantities[key] || 0;
          if (qty > 0) lineItems.push({ source: "imported", size: sz.name, quantity: qty, unitPrice: sizePrice(item.imported, sz.name) });
        }
      }
    }
    return lineItems;
  };

  const totalPrice = buildLineItems().reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);

  const handleOrder = async () => {
    if (!item) return;
    if (!validateForm()) return;

    const lineItems = buildLineItems();
    if (lineItems.length === 0) {
      alert(t("selectAtLeastOne"));
      return;
    }

    setOrdering(true);
    setShowOrderConfirm(false);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item._id,
          lineItems,
          message: orderMessage,
          buyerName: buyerName.trim() || undefined,
          buyerPhone: buyerPhone.trim() || undefined,
          buyerClub: buyerClub.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || t("placeOrderFailed"));
        return;
      }
      setOrderSuccess(true);
    } catch {
      alert(t("placeOrderFailedRetry"));
    } finally {
      setOrdering(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getAllImages = () => {
    if (!item) return [];
    const images: string[] = [];
    if (item.imageUrls && item.imageUrls.length > 0) images.push(...item.imageUrls);
    else if (item.imageUrl) images.push(item.imageUrl);
    return images;
  };

  const localizedName = () => ln(item?.name, item?.nameAm);
  const localizedDescription = () => ln(item?.description, item?.descriptionAm);
  const localizedCategoryName = () => {
    const cat = item?.categoryId as any;
    if (!cat) return t("uncategorized");
    return ln(cat.name, cat.nameAm) || t("uncategorized");
  };

  const toggleSizeQty = (key: string, delta: number) => {
    setSizeQuantities((prev) => {
      const current = prev[key] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!item || error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-3 sm:px-4 lg:px-6 py-16 text-center">
          <Package className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{t("productNotFound")}</p>
          <Link href="/shop">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t("backToShop")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-3 sm:px-4 lg:px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("orderPlacedSuccess")}</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {t("orderReceivedMessage", { name: localizedName() })}
          </p>

          {(item.companyPhone || item.companyWhatsapp) && (
            <div className="max-w-sm mx-auto bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">{ln(item.companyName, item.companyNameAm) || "TKD Store"}</p>
              <p className="text-xs text-gray-500 mb-3">{t("contactSellerDirectly")}</p>
              <div className="space-y-2">
                {item.companyPhone && (
                  <div className="flex items-center gap-2">
                    <a href={`tel:${item.companyPhone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 transition-colors flex-1">
                      <Phone className="h-3 w-3 text-green-600" /> {item.companyPhone}
                    </a>
                    <button onClick={() => copyToClipboard(item.companyPhone!, "post-order-phone")} className="p-1.5 text-gray-400 hover:text-gray-700">
                      {copiedField === "post-order-phone" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
                {item.companyWhatsapp && (
                  <div className="flex items-center gap-2">
                    <a href={`https://wa.me/${item.companyWhatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-gray-300 transition-colors flex-1">
                      <MessageCircle className="h-3 w-3 text-green-500" /> WhatsApp: {item.companyWhatsapp}
                    </a>
                    <button onClick={() => copyToClipboard(item.companyWhatsapp!, "post-order-wa")} className="p-1.5 text-gray-400 hover:text-gray-700">
                      {copiedField === "post-order-wa" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Link href="/shop/orders">
              <Button className="bg-gray-900 hover:bg-gray-800">{t("viewMyOrders")}</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">{t("continueShopping")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = getAllImages();
  const hasBothSources = item.local.enabled && item.imported.enabled;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="px-3 sm:px-4 lg:px-6 h-14 flex items-center">
          <Link href="/shop" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> {t("backToShop")}
          </Link>
        </div>
      </div>

      <div className="px-3 sm:px-4 lg:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Sticky Image */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {images.length > 0 ? (
              <>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img src={images[currentImageIndex]} alt={item.name} className="w-full h-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))} className="rounded-full h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {images.map((img, idx) => (
                        <button key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentImageIndex ? "border-[var(--brand)]" : "border-gray-200 hover:border-gray-400"}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))} className="rounded-full h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <div className="text-center">
                  <img src="/logo.png" alt="No image" className="w-20 h-20 mx-auto object-contain opacity-30" />
                  <p className="text-sm text-gray-400 mt-3">{t("noImage")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Product info + order form */}
          <div className="space-y-4">
            {/* Title & Price */}
            <div>
              <p className="text-xs text-[var(--brand)] font-semibold uppercase tracking-wider mb-1">
                {localizedCategoryName()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{localizedName()}</h1>

              {/* Price display: show both if both enabled */}
              <div className="flex flex-wrap gap-3">
                {item.local.enabled && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">Br {item.local.basePrice.toLocaleString()}</span>
                    <span className="text-xs font-medium text-green-600">{t("sourceLocal")}</span>
                  </div>
                )}
                {item.imported.enabled && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">Br {item.imported.basePrice.toLocaleString()}</span>
                    <span className="text-xs font-medium text-blue-600">{t("sourceImported")}</span>
                  </div>
                )}
              </div>

              {item.color && (
                <p className="text-sm text-gray-500 mt-1">{t("color")}: {item.color}</p>
              )}
              {(item.supplier || item.supplierAm) && (
                <p className="text-sm text-gray-500 mt-1">{t("bySupplier")} {ln(item.supplier, item.supplierAm)}</p>
              )}
            </div>

            {/* Description */}
            {localizedDescription() && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t("description")}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{localizedDescription()}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-gray-200 text-gray-500">{tag}</Badge>
                ))}
              </div>
            )}

            {/* ORDERING SECTION */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-900">{t("placeOrder")}</p>

              {/* Source selection — show checkboxes if both enabled, auto-select if only one */}
              {hasBothSources && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase">{t("selectSource")}</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedLocal} onChange={(e) => setSelectedLocal(e.target.checked)} className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium">{t("sourceLocal")} — Br {item.local.basePrice.toLocaleString()}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedImported} onChange={(e) => setSelectedImported(e.target.checked)} className="h-4 w-4 rounded" />
                      <span className="text-sm font-medium">{t("sourceImported")} — Br {item.imported.basePrice.toLocaleString()}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Auto-select if only one source */}

              {/* Per-source size selection */}
              {selectedLocal && (
                <SourceSizeSelector
                  label={t("sourceLocal")}
                  source={item.local}
                  sourceKey="local"
                  sizeQuantities={sizeQuantities}
                  toggleSizeQty={toggleSizeQty}
                />
              )}
              {selectedImported && (
                <SourceSizeSelector
                  label={t("sourceImported")}
                  source={item.imported}
                  sourceKey="imported"
                  sizeQuantities={sizeQuantities}
                  toggleSizeQty={toggleSizeQty}
                />
              )}

              {/* Total */}
              {totalPrice > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t("totalPrice")}</span>
                  <span className="text-xl font-bold text-gray-900">Br {totalPrice.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Buyer info */}
            <div className="space-y-3 rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">{t("yourInformation")} <span className="text-[var(--brand)]">*</span></p>
              <div className="space-y-2">
                <Label htmlFor="buyerName" className="text-sm font-medium text-gray-700">{t("fullName")} <span className="text-[var(--brand)]">*</span></Label>
                <Input
                  id="buyerName"
                  placeholder={t("yourNamePlaceholder")}
                  value={buyerName}
                  onChange={(e) => { setBuyerName(e.target.value); if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined })); }}
                  className={`border-gray-200 text-sm ${formErrors.name ? "border-red-500" : ""}`}
                />
                {formErrors.name && <p className="text-xs text-red-600">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerPhone" className="text-sm font-medium text-gray-700">{t("phoneNumber")} <span className="text-[var(--brand)]">*</span></Label>
                <Input
                  id="buyerPhone"
                  placeholder="+251 9XX XXX XXX"
                  value={buyerPhone}
                  onChange={(e) => { setBuyerPhone(e.target.value); if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined })); }}
                  className={`border-gray-200 text-sm ${formErrors.phone ? "border-red-500" : ""}`}
                />
                {formErrors.phone && <p className="text-xs text-red-600">{formErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerClub" className="text-sm font-medium text-gray-700">{t("club")} <span className="text-[var(--brand)]">*</span></Label>
                <Input
                  id="buyerClub"
                  placeholder={t("clubPlaceholder")}
                  value={buyerClub}
                  onChange={(e) => { setBuyerClub(e.target.value); if (formErrors.club) setFormErrors((p) => ({ ...p, club: undefined })); }}
                  className={`border-gray-200 text-sm ${formErrors.club ? "border-red-500" : ""}`}
                />
                {formErrors.club && <p className="text-xs text-red-600">{formErrors.club}</p>}
              </div>
            </div>

            {/* Message + Submit */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">{t("messageToSeller")}</Label>
              <Textarea
                id="message"
                placeholder={t("messagePlaceholder")}
                value={orderMessage}
                onChange={(e) => setOrderMessage(e.target.value)}
                className="min-h-[60px] border-gray-200 text-sm"
              />
              <Button
                onClick={() => {
                  const lineItems = buildLineItems();
                  if (lineItems.length === 0) { alert(t("selectAtLeastOne")); return; }
                  if (validateForm()) setShowOrderConfirm(true);
                }}
                disabled={ordering}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium h-12 rounded-lg"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t("placeOrder")}{totalPrice > 0 ? ` — Br ${totalPrice.toLocaleString()}` : ""}
              </Button>
              <p className="text-xs text-gray-400 text-center">{t("contactSellerToArrange")}</p>
            </div>

            {/* Contact info */}
            {(item.companyPhone || item.companyWhatsapp || item.companyTelegram || item.companyInstagram || item.companyEmail) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">{ln(item.companyName, item.companyNameAm) || "TKD Store"}</p>
                <div className="space-y-2">
                  {item.companyPhone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${item.companyPhone}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[var(--brand)] transition-colors flex-1 min-w-0">
                        <Phone className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="truncate">{item.companyPhone}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyPhone!, "phone")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title={t("copyPhone")}>
                        {copiedField === "phone" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  {item.companyWhatsapp && (
                    <div className="flex items-center gap-2">
                      <a href={`https://wa.me/${item.companyWhatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-green-400 transition-colors flex-1 min-w-0">
                        <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="truncate">WhatsApp: {item.companyWhatsapp}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyWhatsapp!, "wa")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title={t("copyWhatsapp")}>
                        {copiedField === "wa" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  {item.companyTelegram && (
                    <div className="flex items-center gap-2">
                      <a href={`https://t.me/${item.companyTelegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 transition-colors flex-1 min-w-0">
                        <Send className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate">@{item.companyTelegram.replace("@", "")}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyTelegram!, "tg")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title={t("copyUsername")}>
                        {copiedField === "tg" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  {item.companyInstagram && (
                    <div className="flex items-center gap-2">
                      <a href={`https://instagram.com/${item.companyInstagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-pink-400 transition-colors flex-1 min-w-0">
                        <Send className="h-4 w-4 text-pink-500 shrink-0" />
                        <span className="truncate">@{item.companyInstagram.replace("@", "")}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyInstagram!, "ig")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title={t("copyUsername")}>
                        {copiedField === "ig" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  {item.companyEmail && (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${item.companyEmail}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors flex-1 min-w-0">
                        <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                        <span className="truncate">{item.companyEmail}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyEmail!, "email")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title={t("copyEmail")}>
                        {copiedField === "email" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order confirmation dialog */}
      <ConfirmDialog
        open={showOrderConfirm}
        title={t("confirmOrderTitle")}
        message={t("confirmOrderMessage", {
          name: localizedName(),
          qty: buildLineItems().reduce((s, li) => s + li.quantity, 0),
          total: totalPrice.toLocaleString(),
        })}
        confirmLabel={t("placeOrder")}
        variant="success"
        onConfirm={handleOrder}
        onCancel={() => setShowOrderConfirm(false)}
      />
    </div>
  );
}

/* ---------- Source Size Selector Component ---------- */
function SourceSizeSelector({
  label,
  source,
  sourceKey,
  sizeQuantities,
  toggleSizeQty,
}: {
  label: string;
  source: ItemSource;
  sourceKey: "local" | "imported";
  sizeQuantities: Record<string, number>;
  toggleSizeQty: (key: string, delta: number) => void;
}) {
  const hasSizes = source.sizes.length > 0;

  if (!hasSizes) {
    // No sizes — just a quantity picker for the base price
    const key = `${sourceKey}-`;
    const qty = sizeQuantities[key] || 0;
    return (
      <div className="rounded-lg border border-gray-200 p-3 space-y-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Br {source.basePrice.toLocaleString()}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => toggleSizeQty(key, -1)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-lg font-bold text-gray-900 w-8 text-center">{qty}</span>
            <button onClick={() => toggleSizeQty(key, 1)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {source.sizes.map((sz) => {
        const key = `${sourceKey}-${sz.name}`;
        const qty = sizeQuantities[key] || 0;
        const price = sz.price != null ? sz.price : source.basePrice;
        return (
          <div key={sz.name} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
            <div>
              <span className="text-sm font-medium text-gray-900">{sz.name}</span>
              <span className="text-sm text-gray-500 ml-2">Br {price.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleSizeQty(key, -1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-base font-bold text-gray-900 w-6 text-center">{qty}</span>
              <button onClick={() => toggleSizeQty(key, 1)} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
