"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton({
  variant = "ghost",
  className,
  size = "sm",
}: {
  variant?: "ghost" | "outline" | "default" | "secondary" | "destructive" | "link";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}
