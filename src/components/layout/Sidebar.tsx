"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Users,
  FileText,
  Bell,
  Search,
  Table,
  User,
  Shield,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Manage Items",
    href: "/inventory/manage",
    icon: Table,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Shield,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Package className="h-6 w-6" />
                <span className="font-bold">Inventory Manager</span>
              </Link>
            </div>
            <ScrollArea className="flex-1">
              <nav className="grid gap-1 p-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="border-t p-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50",
          className
        )}
      >
        <div className="flex h-full flex-col border-r bg-background">
          <div className="flex h-14 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-bold">Inventory Manager</span>
            </Link>
          </div>
          <ScrollArea className="flex-1">
            <nav className="grid gap-1 p-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="border-t p-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </>
  );
} 