"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Order {
  _id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  itemName: string;
  itemCategory: string;
  itemSize?: string;
  itemColor?: string;
  itemImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  message?: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  statusNote?: string;
  orderDate: string;
  companyName?: string;
  companyPhone?: string;
  companyWhatsapp?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allCounts, setAllCounts] = useState({ total: 0, PENDING: 0, APPROVED: 0, DECLINED: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: "APPROVED" | "DECLINED" | "PENDING" } | null>(null);

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
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED": return "Approve";
      case "DECLINED": return "Decline";
      case "PENDING": return "Set to Pending";
      default: return status;
    }
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground text-sm">
              Manage customer orders and update status.
            </p>
          </div>

          {/* Stats - always show ALL counts regardless of filter */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600">{allCounts.PENDING}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{allCounts.APPROVED}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Declined</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{allCounts.DECLINED}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
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
                  <p className="text-lg font-semibold">No orders found</p>
                  <p className="text-sm text-muted-foreground">
                    {statusFilter !== "all" ? "Try a different filter" : "Orders will appear here when customers place them"}
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
                            <p className="font-medium text-sm">{order.itemName}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Buyer: {order.buyerName}</p>
                          {order.companyName && <p>Company: {order.companyName}</p>}
                          <p>Qty: {order.quantity} — Total: Br {(order.totalPrice ?? 0).toLocaleString()}</p>
                          <p>{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1 pt-1">
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {order.status !== "APPROVED" && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => confirmStatusChange(order._id, "APPROVED")}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                          )}
                          {order.status !== "DECLINED" && (
                            <Button size="sm" variant="destructive" onClick={() => confirmStatusChange(order._id, "DECLINED")}>
                              <XCircle className="h-3 w-3 mr-1" /> Decline
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
                          <TableHead>Order #</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order._id}>
                            <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{order.itemName}</p>
                              <p className="text-xs text-muted-foreground">{order.itemCategory}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{order.buyerName}</p>
                              <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                            </TableCell>
                            <TableCell className="text-sm">{order.companyName || "—"}</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell className="font-medium">Br {(order.totalPrice ?? 0).toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-sm">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
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
                    <h2 className="text-lg font-bold">Order #{selectedOrder.orderNumber}</h2>
                    {getStatusBadge(selectedOrder.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground text-xs">Item</p>
                      <p className="font-medium">{selectedOrder.itemName}</p>
                      <p className="text-muted-foreground">{selectedOrder.itemCategory}</p>
                      {selectedOrder.itemSize && <p>Size: {selectedOrder.itemSize}</p>}
                      {selectedOrder.itemColor && <p>Color: {selectedOrder.itemColor}</p>}
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground text-xs">Buyer</p>
                      <p className="font-medium">{selectedOrder.buyerName}</p>
                      <p className="text-muted-foreground">{selectedOrder.buyerEmail}</p>
                      {selectedOrder.buyerPhone && <p>{selectedOrder.buyerPhone}</p>}
                    </div>
                  </div>

                  {selectedOrder.companyName && (
                    <div className="text-sm">
                      <p className="font-medium text-muted-foreground text-xs">Company</p>
                      <p>{selectedOrder.companyName}</p>
                    </div>
                  )}

                  <div className="text-sm border-t pt-3">
                    <p>Qty: {selectedOrder.quantity} × Br {(selectedOrder.unitPrice ?? 0).toLocaleString()}</p>
                    <p className="text-lg font-bold">Total: Br {(selectedOrder.totalPrice ?? 0).toLocaleString()}</p>
                  </div>

                  {selectedOrder.message && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Buyer Message:</p>
                      <p>{selectedOrder.message}</p>
                    </div>
                  )}

                  {/* ALL status buttons always visible with confirmation */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Change Status</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedOrder.status !== "PENDING" && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "PENDING"); }} disabled={updatingId === selectedOrder._id}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Set Pending
                        </Button>
                      )}
                      {selectedOrder.status !== "APPROVED" && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "APPROVED"); }} disabled={updatingId === selectedOrder._id}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {selectedOrder.status !== "DECLINED" && (
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedOrder(null); confirmStatusChange(selectedOrder._id, "DECLINED"); }} disabled={updatingId === selectedOrder._id}>
                          <XCircle className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedOrder.statusNote && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Status Note:</p>
                      <p>{selectedOrder.statusNote}</p>
                    </div>
                  )}

                  <Button variant="outline" className="w-full" onClick={() => setSelectedOrder(null)}>
                    Close
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
                    <h3 className="font-bold text-lg">Are you sure?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Do you want to {getStatusLabel(confirmAction.status).toLowerCase()} this order?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)} disabled={updatingId !== null}>
                      Cancel
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
                      {updatingId ? "Updating..." : `Yes, ${getStatusLabel(confirmAction.status)}`}
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
