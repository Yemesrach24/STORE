"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DashboardLayout } from "@/components/layout";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { UserFormModal } from "@/components/admin/UserFormModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, Filter, Shield } from "lucide-react";

interface User {
  _id: string;
  authId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    if (userRole !== undefined && !isSuperAdmin && userRole) {
      setLoading(false);
      return;
    }
    if (userRole === undefined) return; // Still loading session
    fetchUsers();
  }, [currentPage, roleFilter, isSuperAdmin, userRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(roleFilter !== "all" && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.status === 403) {
        setError("Only Super Admin can manage users. You don't have permission.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination?.pages || 1);
      setTotalUsers(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to deactivate user");
      fetchUsers();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    fetchUsers();
  };

  // Non-super-admin access
  if (!loading && !isSuperAdmin && userRole && userRole !== "undefined") {
    return (
      <AdminGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle>Access Restricted</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Only Super Admin can manage users. You don&apos;t have permission to view this page.
                </p>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts, roles, and permissions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateUser}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-[var(--brand)]">
                  {users.filter(u => ['SUPER_ADMIN', 'ADMIN'].includes(u.role)).length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isActive).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <UserManagementTable
            users={users}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onBulkAction={handleBulkAction}
          />

          <UserFormModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            user={editingUser}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchUsers();
            }}
          />
        </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
