"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingTable } from "@/components/ui/loading";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  Download,
  Filter,
  Search,
  Package,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  sku?: string;
  imageUrl?: string;
  minQuantity: number;
  maxQuantity: number;
  location?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryTableProps {
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: string) => void;
  onView?: (item: InventoryItem) => void;
  onAdd?: () => void;
  className?: string;
}

type SortField = "name" | "quantity" | "price" | "category" | "createdAt";
type SortOrder = "asc" | "desc";

export function InventoryTable({
  onEdit,
  onDelete,
  onView,
  onAdd,
  className,
}: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Fetch items from API
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: sortField,
        sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(stockFilter === "in-stock" && { inStock: "true" }),
        ...(stockFilter === "out-of-stock" && { inStock: "false" }),
        ...(stockFilter === "low-stock" && { lowStock: "true" }),
      });

      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      setItems(data.items);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize, sortField, sortOrder, searchQuery, categoryFilter, stockFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map((item) => item.category))];
    return uniqueCategories.sort();
  }, [items]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!itemToDelete || !onDelete) return;

    try {
      await onDelete(itemToDelete._id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems(); // Refresh the list
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Name",
      "SKU",
      "Category",
      "Quantity",
      "Price",
      "Total Value",
      "Location",
      "Supplier",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...items.map((item) => [
        `"${item.name}"`,
        item.sku || "",
        item.category,
        item.quantity,
        item.price,
        (item.quantity * item.price).toFixed(2),
        item.location || "",
        item.supplier || "",
        item.quantity === 0
          ? "Out of Stock"
          : item.quantity <= item.minQuantity
          ? "Low Stock"
          : "In Stock",
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: "Out of Stock", color: "destructive" as const };
    }
    if (item.quantity <= item.minQuantity) {
      return { status: "Low Stock", color: "secondary" as const };
    }
    return { status: "In Stock", color: "default" as const };
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading inventory</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={fetchItems}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Inventory Items</CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalItems} items • Page {currentPage} of {totalPages}
              </p>
            </div>
            <div className="flex gap-2">
              {onAdd && (
                <Button onClick={onAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              )}
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <LoadingTable />
          ) : (
            <>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("name")}
                          className="h-auto p-0 font-medium"
                        >
                          Name
                          <SortIcon field="name" />
                        </Button>
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("category")}
                          className="h-auto p-0 font-medium"
                        >
                          Category
                          <SortIcon field="category" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("quantity")}
                          className="h-auto p-0 font-medium"
                        >
                          Quantity
                          <SortIcon field="quantity" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort("price")}
                          className="h-auto p-0 font-medium"
                        >
                          Price
                          <SortIcon field="price" />
                        </Button>
                      </TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No items found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => {
                        const stockStatus = getStockStatus(item);
                        const totalValue = item.quantity * item.price;

                        return (
                          <TableRow key={item._id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {item.sku || "—"}
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.quantity}</span>
                                {item.quantity <= item.minQuantity && item.quantity > 0 && (
                                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>Br {(item.price ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">
                              Br {(totalValue ?? 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.color}>
                                {stockStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {onView && (
                                    <DropdownMenuItem onClick={() => onView(item)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                  )}
                                  {onEdit && (
                                    <DropdownMenuItem onClick={() => onEdit(item)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {onDelete && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setItemToDelete(item);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 