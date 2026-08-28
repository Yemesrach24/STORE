"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  BarChart3,
  Settings
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Transactions', href: '/transactions', icon: TrendingUp },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Inventory</span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex items-center space-x-2",
                        isActive && "bg-blue-600 text-white hover:bg-blue-700"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
