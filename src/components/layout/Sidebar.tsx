"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useSidebar } from "./sidebar-context";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { TranslationKey } from "@/lib/i18n";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  ShoppingCart,
  FolderTree,
  User,
  Store,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

function TKDLogo() {
  return (
    <img src="/logo.png" alt="K-FORCE ETHIOPIA" className="w-6 h-6 rounded-full object-contain" />
  );
}

const adminNavigation: { labelKey: TranslationKey; href: string; icon: typeof LayoutDashboard; superAdminOnly: boolean }[] = [
  { labelKey: "dashboard", href: "/admin", icon: LayoutDashboard, superAdminOnly: false },
  { labelKey: "orders", href: "/admin/orders", icon: ShoppingCart, superAdminOnly: false },
  { labelKey: "categories", href: "/admin/categories", icon: FolderTree, superAdminOnly: false },
  { labelKey: "itemsTitle", href: "/admin/items", icon: Package, superAdminOnly: false },
  { labelKey: "analytics", href: "/admin/analytics", icon: BarChart3, superAdminOnly: true },
  { labelKey: "users", href: "/admin/users", icon: Users, superAdminOnly: true },
];

const buyerNavigation: { labelKey: TranslationKey; href: string; icon: typeof Store }[] = [
  { labelKey: "shop", href: "/shop", icon: Store },
  { labelKey: "myOrders", href: "/shop/orders", icon: ShoppingCart },
  { labelKey: "profile", href: "/profile", icon: User },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const userRole = (session?.user as any)?.role || (session?.user as any)?.dbRole || null;
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const filteredAdminNav = adminNavigation.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <>
      {/* Mobile sidebar (drawer) — trigger lives in the Header */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0 border-0">
          <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
          <div className="flex h-full flex-col bg-gray-950">
            <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
              <Link href="/" className="flex items-center space-x-2 min-w-0">
                <TKDLogo />
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-white text-sm leading-tight truncate">K-FORCE ETHIOPIA</span>
                  <span className="text-[10px] text-gray-500 tracking-widest uppercase">{t("adminPanel")}</span>
                </div>
              </Link>
              <LanguageSwitcher dark className="ml-auto shrink-0" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3">
                <p className="px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("admin")}</p>
                <nav className="grid gap-1">
                  {filteredAdminNav.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-[var(--brand)] text-white shadow-md"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </nav>
                <p className="px-3 py-2 mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("shop")}</p>
                <nav className="grid gap-1">
                  {buyerNavigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-[var(--brand)] text-white shadow-md"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
            <div className="border-t border-gray-800 p-4">
              <SignOutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className={cn("hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50", className)}>
        <div className="flex h-full flex-col bg-gray-950 border-r border-gray-800">
          <div className="flex h-14 items-center gap-2 border-b border-gray-800 px-4">
            <Link href="/" className="flex items-center space-x-2 min-w-0">
              <TKDLogo />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-sm leading-tight truncate">K-FORCE ETHIOPIA</span>
                <span className="text-[10px] text-gray-500 tracking-widest uppercase">{t("adminPanel")}</span>
              </div>
            </Link>
            <LanguageSwitcher dark className="ml-auto shrink-0" />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              <p className="px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("admin")}</p>
              <nav className="grid gap-1">
                {filteredAdminNav.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
              <p className="px-3 py-2 mt-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t("shop")}</p>
              <nav className="grid gap-1">
                {buyerNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </ScrollArea>
          <div className="border-t border-gray-800 p-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    </>
  );
}
