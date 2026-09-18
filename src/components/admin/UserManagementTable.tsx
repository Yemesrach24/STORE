"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Trash2, Crown, Shield, Users } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface User {
  _id: string;
  authId: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  shopName?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserManagementTableProps {
  users: User[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
}

export function UserManagementTable({
  users,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onEditUser,
  onDeleteUser,
  onBulkAction,
}: UserManagementTableProps) {
  const { t } = useLanguage();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="destructive"><Crown className="h-3 w-3 mr-1" />{t("superAdmin")}</Badge>;
      case 'ADMIN':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />{t("admin")}</Badge>;
      default:
        return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{t("customer")}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("usersCard")}</CardTitle>
          <CardDescription>{t("loadingUsers")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>{t("tryAgain")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("usersCard")}</CardTitle>
        <CardDescription>
          {t("usersFoundLabel", { count: users.length, current: currentPage, total: totalPages })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("noUsersFound")}</h3>
            <p className="text-muted-foreground">
              {t("noUsersMatch")}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("userColumn")}</TableHead>
                <TableHead>{t("emailColumn")}</TableHead>
                <TableHead>{t("roleColumn")}</TableHead>
                <TableHead>{t("statusColumn")}</TableHead>
                <TableHead>{t("createdColumn")}</TableHead>
                <TableHead>{t("actionsColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback>
                          {user.firstName?.charAt(0) || user.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteUser(user._id)}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              {t("previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pageOf", { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 