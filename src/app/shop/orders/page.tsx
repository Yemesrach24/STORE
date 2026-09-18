"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  ArrowLeft, Package, Loader2, Clock, CheckCircle, XCircle,
  ShoppingBag, Phone, MessageCircle, Send, Mail, Copy, Check, Pencil, Trash2
} from "lucide-react";

interface LineItem {
  source: 'local' | 'imported';
  size?: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  itemName: string;
  itemNameAm?: string;
  itemCategory: string;
  itemCategoryAm?: string;
  itemImage?: string;
  itemColor?: string;
  lineItems: LineItem[];
  totalPrice: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  message?: string;
  orderDate: string;
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  companyTelegram?: string;
  companyInstagram?: string;
  companyEmail?: string;
}

export default function ShopOrdersPage() {
  const { data: session, status } = useSession();
  const { t, ln, locale } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "declined">("all");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
    } else if (status === "unauthenticated") {
      // Guests may still view their orders via the guest_id cookie.
      // Only redirect to sign-in if there's no guest identity at all.
      fetchOrders();
    }
  }, [status, router]);

  // Keep order statuses fresh: refetch when the tab regains focus/visibility,
  // and on a slow poll while it's open, so admin status changes show up
  // without requiring a manual reload.
  useEffect(() => {
    if (status === "loading") return;
    const onFocus = () => fetchOrders();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = setInterval(fetchOrders, 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, [status]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders?limit=50");
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else if (response.status === 401) {
        // No session and no guest identity — guest has no order history.
        setOrders([]);
        setRequiresSignIn(true);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const startEdit = (order: Order) => {
    setEditingOrder(order);
    setEditMessage(order.message || "");
  };

  const saveEdit = async () => {
    if (!editingOrder) return;
    try {
      const res = await fetch(`/api/orders/${editingOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editingOrder.status,
          message: editMessage,
        }),
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        console.error("Edit failed:", err);
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
      APPROVED: "bg-green-50 text-green-700 border border-green-200",
      DECLINED: "bg-red-50 text-[var(--brand)] border border-red-200",
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="h-3 w-3" />,
      APPROVED: <CheckCircle className="h-3 w-3" />,
      DECLINED: <XCircle className="h-3 w-3" />,
    };
    const labels: Record<string, string> = {
      PENDING: t("pending"),
      APPROVED: t("approved"),
      DECLINED: t("declined"),
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[s] || ""}`}>
        {icons[s]} {labels[s] || s}
      </span>
    );
  };

  const filteredOrders = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab.toUpperCase());
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    approved: orders.filter(o => o.status === "APPROVED").length,
    declined: orders.filter(o => o.status === "DECLINED").length,
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{t("myOrders")}</h1>
          </div>
          <Link href="/shop">
            <Button variant="outline" size="sm" className="font-medium gap-1.5">
              <ShoppingBag className="h-4 w-4" /> {t("shop")}
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-3 sm:px-4 lg:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {(["all", "pending", "approved", "declined"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab === "all" ? t("all") : tab === "pending" ? t("pending") : tab === "approved" ? t("approved") : t("declined")} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">
              {requiresSignIn && status !== "authenticated" ? t("signInToViewHistory") : t("noOrdersFound")}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {requiresSignIn && status !== "authenticated"
                ? t("signInToViewHistory")
                : activeTab === "all" ? t("noOrdersYet") : t("noOrdersFound")}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/shop">
                <Button variant="outline" size="sm">{t("browseProducts")}</Button>
              </Link>
              {requiresSignIn && status !== "authenticated" && (
                <Link href="/sign-in">
                  <Button size="sm" className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white">{t("signIn")}</Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                    {statusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {order.status === "PENDING" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-gray-500 hover:text-gray-900"
                          onClick={() => startEdit(order)}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> {t("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[var(--brand)] hover:text-[var(--brand-dark)]"
                          onClick={() => setDeleteConfirmId(order._id)}
                          disabled={deletingId === order._id}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> {t("delete")}
                        </Button>
                      </>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(order.orderDate || order._id).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      {order.itemImage ? (
                        <img src={order.itemImage} alt={order.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase font-medium">{ln(order.itemCategory, order.itemCategoryAm)}</p>
                      <p className="font-semibold text-gray-900 truncate">{ln(order.itemName, order.itemNameAm)}</p>
                      {(order.companyName || order.companyNameAm) && (
                        <p className="text-xs text-[var(--brand)] font-medium">{ln(order.companyName, order.companyNameAm)}</p>
                      )}
                      {order.itemColor && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.itemColor}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 mt-0.5 space-y-0.5">
                        {order.lineItems?.map((li: LineItem, idx: number) => (
                          <p key={idx}>
                            {li.source === 'local' ? t('sourceLocal') : t('sourceImported')} {li.size ? `${li.size} × ` : ''}{li.quantity} @ Br {(li.unitPrice ?? 0).toLocaleString()}
                          </p>
                        ))}
                        <p className="font-semibold text-gray-900">Br {(order.totalPrice ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {order.message && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 border border-gray-100">
                      <span className="font-medium text-gray-700">{t("yourMessage")}</span> {order.message}
                    </div>
                  )}

                  {/* Contact info */}
                  {(order.companyPhone || order.companyWhatsapp || order.companyTelegram || order.companyEmail || order.companyInstagram) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        {order.status === "APPROVED" ? t("contactSellerArrange") : t("sellerContactInfo")}
                      </p>
                      <div className="space-y-2">
                        {(order.companyName || order.companyNameAm) && (
                          <p className="text-xs font-semibold text-gray-900 mb-1">{ln(order.companyName, order.companyNameAm)}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {order.companyPhone && (
                            <div className="flex items-center gap-1">
                              <a href={`tel:${order.companyPhone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                <Phone className="h-3 w-3" /> {t("call")}
                              </a>
                              <button
                                onClick={() => copyToClipboard(order.companyPhone!, `phone-${order._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title={t("copyPhone")}
                              >
                                {copiedField === `phone-${order._id}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                          {order.companyWhatsapp && (
                            <div className="flex items-center gap-1">
                              <a href={`https://wa.me/${order.companyWhatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                <MessageCircle className="h-3 w-3" /> {t("whatsapp")}
                              </a>
                              <button
                                onClick={() => copyToClipboard(order.companyWhatsapp!, `wa-${order._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title={t("copyWhatsapp")}
                              >
                                {copiedField === `wa-${order._id}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                          {order.companyTelegram && (
                            <div className="flex items-center gap-1">
                              <a href={`https://t.me/${order.companyTelegram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                <Send className="h-3 w-3" /> {t("telegram")}
                              </a>
                              <button
                                onClick={() => copyToClipboard(order.companyTelegram!, `tg-${order._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title={t("copyUsername")}
                              >
                                {copiedField === `tg-${order._id}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                          {order.companyEmail && (
                            <div className="flex items-center gap-1">
                              <a href={`mailto:${order.companyEmail}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                                <Mail className="h-3 w-3" /> {t("email")}
                              </a>
                              <button
                                onClick={() => copyToClipboard(order.companyEmail!, `email-${order._id}`)}
                                className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                title={t("copyEmail")}
                              >
                                {copiedField === `email-${order._id}` ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                          {order.companyInstagram && (
                            <a href={`https://instagram.com/${order.companyInstagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
                              {t("instagram")}
                            </a>
                          )}
                        </div>
                        {(order.companyPhone || order.companyWhatsapp) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 mb-1">{t("contactDetailsTap")}</p>
                            <div className="space-y-0.5 text-xs text-gray-700">
                              {order.companyPhone && (
                                <button
                                  onClick={() => copyToClipboard(order.companyPhone!, `fullphone-${order._id}`)}
                                  className="block w-full text-left hover:text-[var(--brand)] transition-colors"
                                >
                                  📞 {order.companyPhone}
                                </button>
                              )}
                              {order.companyWhatsapp && (
                                <button
                                  onClick={() => copyToClipboard(order.companyWhatsapp!, `fullwa-${order._id}`)}
                                  className="block w-full text-left hover:text-[var(--brand)] transition-colors"
                                >
                                  💬 {order.companyWhatsapp}
                                </button>
                              )}
                            </div>
                            {copiedField?.startsWith(`full`) && copiedField.endsWith(`-${order._id}`) && (
                              <p className="text-[10px] text-green-600 mt-1">✓ {t("copied")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingOrder(null)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">{t("editOrder")} #{editingOrder.orderNumber}</h3>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {editingOrder.lineItems?.map((li: LineItem, idx: number) => (
                  <p key={idx}>
                    {li.source === 'local' ? t('sourceLocal') : t('sourceImported')} {li.size ? `${li.size} × ` : ''}{li.quantity} @ Br {(li.unitPrice ?? 0).toLocaleString()}
                  </p>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("messageToSeller")}</label>
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder={t("messageToSeller")}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingOrder(null)}>{t("cancel")}</Button>
                <Button size="sm" className="bg-gray-900 hover:bg-gray-800" onClick={saveEdit}>{t("save")}</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteConfirmId}
        title={t("deleteOrder")}
        message={t("deleteOrderConfirm")}
        confirmLabel={t("delete")}
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => deleteConfirmId && deleteOrder(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
