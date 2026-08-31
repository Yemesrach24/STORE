"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowLeft, Loader2, ShoppingBag, Phone, MessageCircle, Send, Mail,
  Package, Copy, Check, ChevronLeft, ChevronRight, Minus, Plus,
} from "lucide-react";

interface Item {
  _id: string;
  name: string;
  description: string;
  uniqueNumber: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  imageUrls?: string[];
  stockStatus: string;
  categoryId: { _id: string; name: string; imageUrl?: string };
  size?: string;
  color?: string;
  tags?: string[];
  supplier?: string;
  companyName?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
  location?: string;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);

  useEffect(() => {
    if (params.id) fetchItem(params.id as string);
  }, [params.id]);

  const fetchItem = async (id: string) => {
    try {
      const response = await fetch(`/api/shop/items/${id}`);
      if (!response.ok) throw new Error("Item not found");
      const data = await response.json();
      setItem(data.item || data);
    } catch {
      setError("Product not found");
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!session) {
      router.push("/sign-in");
      return;
    }
    if (!item) return;
    setOrdering(true);
    setShowOrderConfirm(false);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item._id,
          quantity: orderQuantity,
          message: orderMessage,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Failed to place order");
        return;
      }
      setOrderSuccess(true);
    } catch {
      alert("Failed to place order. Please try again.");
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
          <p className="text-gray-600 mb-4">{error || "Product not found"}</p>
          <Link href="/shop">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Your order for <strong>{item.name}</strong> has been received. The seller will contact you soon to arrange payment and delivery.
          </p>

          {/* Show seller contact after order */}
          {(item.companyPhone || item.companyWhatsapp) && (
            <div className="max-w-sm mx-auto bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">{item.companyName || "TKD Store"}</p>
              <p className="text-xs text-gray-500 mb-3">Contact the seller directly:</p>
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
              <Button className="bg-gray-900 hover:bg-gray-800">View My Orders</Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = getAllImages();
  const totalPrice = (item.price ?? 0) * orderQuantity;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="px-3 sm:px-4 lg:px-6 h-14 flex items-center">
          <Link href="/shop" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </div>

      {/* Main content — sticky image on left, scrollable info on right */}
      <div className="px-3 sm:px-4 lg:px-6 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Sticky Image */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {images.length > 0 ? (
              <>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                  <img
                    src={images[currentImageIndex]}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentImageIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                            idx === currentImageIndex ? "border-[var(--brand)]" : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : 0))}
                      className="rounded-full h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <div className="text-center">
                  <img src="/logo.png" alt="No image" className="w-20 h-20 mx-auto object-contain opacity-30" />
                  <p className="text-sm text-gray-400 mt-3">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Compact Details */}
          <div className="space-y-4">
            {/* Title & Price */}
            <div>
              <p className="text-xs text-[var(--brand)] font-semibold uppercase tracking-wider mb-1">
                {item.categoryId?.name || "Uncategorized"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
              <p className="text-3xl font-bold text-gray-900">Br {(item.price ?? 0).toLocaleString()}</p>
              {item.supplier && (
                <p className="text-sm text-gray-500 mt-1">by {item.supplier}</p>
              )}
            </div>

            {/* Compact specs grid */}
            <div className="grid grid-cols-2 gap-2">
              {item.size && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 uppercase">Size</p>
                  <p className="text-sm font-medium text-gray-900">{item.size}</p>
                </div>
              )}
              {item.color && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 uppercase">Color</p>
                  <p className="text-sm font-medium text-gray-900">{item.color}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-400 uppercase">In Stock</p>
                <p className="text-sm font-medium text-gray-900">{item.quantity} units</p>
              </div>
              {item.location && (
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 uppercase">Location</p>
                  <p className="text-sm font-medium text-gray-900">{item.location}</p>
                </div>
              )}
            </div>

            {/* Description — compact */}
            {item.description && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs border-gray-200 text-gray-500">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Quantity + Total Price */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-lg font-bold text-gray-900 w-8 text-center">{orderQuantity}</span>
                  <button
                    onClick={() => setOrderQuantity(Math.min(item.quantity, orderQuantity + 1))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Total Price</span>
                <span className="text-xl font-bold text-gray-900">Br {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Contact info — compact */}
            {(item.companyPhone || item.companyWhatsapp || item.companyTelegram || item.companyInstagram || item.companyEmail) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">{item.companyName || "TKD Store"}</p>
                <div className="space-y-2">
                  {item.companyPhone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${item.companyPhone}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-[var(--brand)] transition-colors flex-1 min-w-0">
                        <Phone className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="truncate">{item.companyPhone}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyPhone!, "phone")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title="Copy phone">
                        {copiedField === "phone" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                  {item.companyWhatsapp && (
                    <div className="flex items-center gap-2">
                      <a href={`https://wa.me/${item.companyWhatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-green-400 transition-colors flex-1 min-w-0">
                        <MessageCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="truncate">{item.companyWhatsapp}</span>
                      </a>
                      <button onClick={() => copyToClipboard(item.companyWhatsapp!, "wa")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title="Copy WhatsApp">
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
                      <button onClick={() => copyToClipboard(item.companyTelegram!, "tg")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title="Copy username">
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
                      <button onClick={() => copyToClipboard(item.companyInstagram!, "ig")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title="Copy username">
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
                      <button onClick={() => copyToClipboard(item.companyEmail!, "email")} className="p-2 text-gray-400 hover:text-gray-700 shrink-0" title="Copy email">
                        {copiedField === "email" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Form */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                Message to seller (optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Any questions or special requests..."
                value={orderMessage}
                onChange={(e) => setOrderMessage(e.target.value)}
                className="min-h-[60px] border-gray-200 text-sm"
              />
              <Button
                onClick={() => setShowOrderConfirm(true)}
                disabled={ordering}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium h-12 rounded-lg"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Place Order — Br {totalPrice.toLocaleString()}
              </Button>
              <p className="text-xs text-gray-400 text-center">
                You&apos;ll contact the seller directly to arrange payment and delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order confirmation dialog */}
      <ConfirmDialog
        open={showOrderConfirm}
        title="Confirm Order"
        message={`Place order for ${item.name} (×${orderQuantity})? Total: Br ${totalPrice.toLocaleString()}. Contact the seller to arrange payment and delivery.`}
        confirmLabel="Place Order"
        variant="success"
        onConfirm={handleOrder}
        onCancel={() => setShowOrderConfirm(false)}
      />
    </div>
  );
}
