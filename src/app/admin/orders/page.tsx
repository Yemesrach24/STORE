"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  RotateCcw,
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
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerClub?: string;
  itemName: string;
  itemNameAm?: string;
  itemCategory: string;
  itemCategoryAm?: string;
  itemColor?: string;
  itemImage?: string;
  lineItems: LineItem[];
  totalPrice: number;
  message?: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  statusNote?: string;
  orderDate: string;
  companyName?: string;
  companyNameAm?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const { t, ln, locale } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allCounts, setAllCounts] = useState({ total: 0, PENDING: 0, APPROVED: 0, DECLINED: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: "APPROVED" | "DECLINED" | "PENDING" } | null>(null);
  const [editingLineItems, setEditingLineItems] = useState<LineItem[]>([]);
  const [isEditingQty, setIsEditingQty] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchAllCounts();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCounts = async () => {
    try {
      const [allRes, pendingRes, approvedRes, declinedRes] = await Promise.all([
        fetch("/api/orders?limit=1"),
        fetch("/api/orders?status=PENDING&limit=1"),
        fetch("/api/orders?status=APPROVED&limit=1"),
        fetch("/api/orders?status=DECLINED&limit=1"),
      ]);
      const [all, pending, approved, declined] = await Promise.all([
        allRes.json(),
        pendingRes.json(),
        approvedRes.json(),
        declinedRes.json(),
      ]);
      setAllCounts({
        total: all.pagination?.total || 0,
        PENDING: pending.pagination?.total || 0,
        APPROVED: approved.pagination?.total || 0,
        DECLINED: declined.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const confirmStatusChange = (orderId: string, status: "APPROVED" | "DECLINED" | "PENDING") => {
    setConfirmAction({ orderId, status });
  };

  const startEditQty = (order: Order) => {
    setEditingLineItems(order.lineItems.map(li => ({ ...li })));
    setIsEditingQty(true);
  };

  const saveQty = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineItems: editingLineItems }),
      });
      if (res.ok) {
        setIsEditingQty(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      console.error("Error updating qty:", err);
    }
  };

  const updateLineItemQty = (idx: number, qty: number) => {
    setEditingLineItems(prev => prev.map((li, i) => i === idx ? { ...li, quantity: Math.max(1, qty) } : li));
  };

  const updateOrderStatus = async () => {
    if (!confirmAction) return;
    setUpdatingId(confirmAction.orderId);
    try {
      const response = await fetch(`/api/orders/${confirmAction.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: confirmAction.status }),
      });
      if (!response.ok) {
        const err = await response.json();
        console.error("Update failed:", err);
        return;
      }
      setConfirmAction(null);
      setSelectedOrder(null);
      fetchOrders();
      fetchAllCounts();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            {t("pending")}
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("approved")}
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            {t("declined")}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED": return t("approve");
      case "DECLINED": return t("decline");
      case "PENDING": return t("setPending");
      default: return status;
    }
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("ordersTitle")}</h1>
            <p className="text-muted-foreground text-sm">{t("ordersSubtitle")}</p>
          </div>

          {/* Stats - always show ALL counts regardless of filter */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("pending")}</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">{allCounts.PENDING}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("approved")}</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{allCounts.APPROVED}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">{t("declined")}</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{allCounts.DECLINED}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allOrders")}</SelectItem>
                <SelectItem value="PENDING">{t("pending")}</SelectItem>
                <SelectItem value="APPROVED">{t("approved")}</SelectItem>
                <SelectItem value="DECLINED">{t("declined")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold">{t("noOrdersFoundAdmin")}</p>
                  <p className="text-sm text-muted-foreground">
                    {statusFilter !== "all" ? t("tryDifferentFilter") : t("ordersWillAppear")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile: Card layout */}
                  <div className="md:hidden space-y-3 p-3">
                    {orders.map((order) => (
                      <div key={order._id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{order.orderNumber}</p>
                            <p className="font-medium text-sm">{ln(order.itemName, order.itemNameAm)}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{t("buyer")}: {order.buyerName}</p>
                          {order.buyerPhone && <p>{t("phone")}: {order.buyerPhone}</p>}
                          {order.buyerClub && <p>{t("club")}: {order.buyerClub}</p>}
                          {(order.companyName || order.companyNameAm) && <p>{t("company")}: {ln(order.companyName, order.companyNameAm)}</p>}
                          <p>{t("qty")}: {order.lineItems?.reduce((s: number, li: LineItem) => s + li.quantity, 0) ?? 0} — {t("total")}: Br {(order.totalPrice ?? 0).toLocaleString()}</p>
                          <p>{new Date(order.orderDate).toLocaleDateString(locale)}</p>
                        </div>
                        <div className="flex gap-1 pt-1">
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-3 w-3 mr-1" /> {t("view")}
                          </Button>
                          {order.status !== "APPROVED" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmStatusChange(order._id, "APPROVED")}>
                              <CheckCircle className="h-3 w-3 mr-1" /> {t("approve")}
                            </Button>
                          )}
                          {order.status !== "DECLINED" && (
                            <Button size="sm" variant="destructive" onClick={() => confirmStatusChange(order._id, "DECLINED")}>
                              <XCircle className="h-3 w-3 mr-1" /> {t("decline")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: Table layout */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("adminOrderNumber")}</TableHead>
                          <TableHead>{t("item")}</TableHead>
                          <TableHead>{t("buyer")}</TableHead>
                          <TableHead>{t("company")}</TableHead>
                          <TableHead>{t("qty")}</TableHead>
                          <TableHead>{t("total")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead>{t("date")}</TableHead>
                          <TableHead>{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{ln(order.itemName, order.itemNameAm)}</p>
                              <p className="text-xs text-muted-foreground">{ln(order.itemCategory, order.itemCategoryAm)}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{order.buyerName}</p>
                              {order.buyerPhone && <p className="text-xs text-muted-foreground">{order.buyerPhone}</p>}
                              {order.buyerClub && <p className="text-xs text-muted-foreground">{order.buyerClub}</p>}
                            </TableCell>
                            <TableCell className="text-sm">{ln(order.companyName, order.companyNameAm) || "—"}</TableCell>
                            <TableCell>{order.lineItems?.reduce((s: number, li: LineItem) => s + li.quantity, 0) ?? 0}</TableCell>
                            <TableCell className="font-medium">Br {(order.totalPrice ?? 0).toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-sm">{new Date(order.orderDate).toLocaleDateString(locale)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {order.status !== "APPROVED" && (
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmStatusChange(order._id, "APPROVED")}>
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {order.status !== "DECLINED" && (
                                  <Button size="sm" variant="destructive" onClick={() => confirmStatusChange(order._id, "DECLINED")}>
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Detail Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
              <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{t("orderNumber")}{selectedOrder.orderNumber}</h2>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground text-xs">{t("item")}</p>
                      <p className="font-medium">{ln(selectedOrder.itemName, selectedOrder.itemNameAm)}</p>
                      <p className="text-muted-foreground">{ln(selectedOrder.itemCategory, selectedOrder.itemCategoryAm)}</p>
                      {selectedOrder.itemColor && <p>{t("color")}: {selectedOrder.itemColor}</p>}
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-xs">{t("buyer")}</p>
                      <p className="font-medium">{selectedOrder.buyerName}</p>
                      {selectedOrder.buyerPhone && <p className="text-muted-foreground">{selectedOrder.buyerPhone}</p>}
                      {selectedOrder.buyerClub && <p className="text-muted-foreground">{selectedOrder.buyerClub}</p>}
                    </div>
                  </div>

                  {(selectedOrder.companyName || selectedOrder.companyNameAm) && (
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground text-xs">{t("company")}</p>
                      <p>{ln(selectedOrder.companyName, selectedOrder.companyNameAm)}</p>
                    </div>
                  )}

                  <div className="text-sm border-t pt-3 space-y-1">
                    {isEditingQty ? (
                      editingLineItems.map((li: LineItem, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20">
                            {li.source === 'local' ? t('sourceLocal') : t('sourceImported')}{li.size ? ` ${li.size}` : ''}
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={li.quantity}
                            onChange={(e) => updateLineItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-16 border rounded px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">× Br {(li.unitPrice ?? 0).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      selectedOrder.lineItems?.map((li: LineItem, idx: number) => (
                        <p key={idx}>
                          {li.source === 'local' ? t('sourceLocal') : t('sourceImported')} {li.size ? `${li.size} × ` : ''}{li.quantity} @ Br {(li.unitPrice ?? 0).toLocaleString()}
                        </p>
                      ))
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-lg font-bold">{t("total")}: Br {(isEditingQty ? editingLineItems.reduce((s, li) => s + (li.unitPrice ?? 0) * li.quantity, 0) : selectedOrder.totalPrice ?? 0).toLocaleString()}</p>
                      {!isEditingQty ? (
                        <Button variant="ghost" size="sm" onClick={() => startEditQty(selectedOrder)}>{t("edit")}</Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditingQty(false)}>{t("cancel")}</Button>
                          <Button size="sm" onClick={saveQty}>{t("save")}</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOrder.message && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-muted-foreground mb-1">{t("buyerMessage")}</p>
                      <p>{selectedOrder.message}</p>
                    </div>
                  )}

                  {/* ALL status buttons always visible with confirmation */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">{t("changeStatus")}</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedOrder.status !== "PENDING" && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "PENDING"); }} disabled={updatingId === selectedOrder._id}>
                          <RotateCcw className="h-3 w-3 mr-1" /> {t("setPending")}
                        </Button>
                      )}
                      {selectedOrder.status !== "APPROVED" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "APPROVED"); }} disabled={updatingId === selectedOrder._id}>
                          <CheckCircle className="h-3 w-3 mr-1" /> {t("approve")}
                        </Button>
                      )}
                      {selectedOrder.status !== "DECLINED" && (
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "DECLINED"); }} disabled={updatingId === selectedOrder._id}>
                          <XCircle className="h-3 w-3 mr-1" /> {t("decline")}
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedOrder.statusNote && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-muted-foreground mb-1">{t("statusNote")}</p>
                      <p>{selectedOrder.statusNote}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full" onClick={() => setSelectedOrder(null)}>
                    {t("close")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => !updatingId && setConfirmAction(null)}>
              <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    confirmAction.status === "APPROVED" ? "bg-green-100" :
                    confirmAction.status === "DECLINED" ? "bg-red-100" : "bg-amber-100"
                  }`}>
                    {confirmAction.status === "APPROVED" ? <CheckCircle className="h-6 w-6 text-green-600" /> :
                     confirmAction.status === "DECLINED" ? <XCircle className="h-6 w-6 text-red-600" /> :
                     <RotateCcw className="h-6 w-6 text-amber-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t("areYouSure")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("wantToStatusOrder", { action: getStatusLabel(confirmAction.status).toLowerCase() })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={updatingId !== null}>
                      {t("cancel")}
                    </Button>
                    <Button
                      className={`flex-1 ${
                        confirmAction.status === "APPROVED" ? "bg-green-600 hover:bg-green-700" :
                        confirmAction.status === "DECLINED" ? "" : ""
                      }`}
                      variant={confirmAction.status === "DECLINED" ? "destructive" : "default"}
                      onClick={updateOrderStatus}
                      disabled={updatingId !== null}
                    >
                      {updatingId ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      {updatingId ? t("updating") : t("yesStatus", { action: getStatusLabel(confirmAction.status) })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
