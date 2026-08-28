"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import Link from "next/link";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AdminGuard ensures the user is authenticated before rendering children.
 * Role-based access control (SUPER_ADMIN vs ADMIN) is enforced server-side
 * in API routes and page data fetching. This component only gates on login.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
