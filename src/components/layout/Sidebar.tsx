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
    <img src="/logo.png" alt="K-FORCE ETHIOPIA" className="w-10 h-10 rounded-full object-contain bg-white border border-stone-200 shrink-0" />
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const userRole = (session?.user as any)?.role || (session?.user as any)?.dbRole || null;
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const filteredAdminNav = adminNavigation.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  const linkCls = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 hover:translate-x-0.5",
      isActive
        ? "bg-[var(--brand)] text-white shadow-md"
        : "text-stone-600 hover:bg-orange-50 hover:text-[var(--brand)]"
    );

  return (
    <div className="p-3">
      <p className="px-3 py-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">{t("admin")}</p>
      <nav className="grid gap-1">
        {filteredAdminNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkCls(isActive)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <p className="px-3 py-2 mt-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">{t("shop")}</p>
      <nav className="grid gap-1">
        {buyerNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate} className={linkCls(isActive)}>
              <item.icon className="h-4 w-4 shrink-0" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <p className="px-3 pt-5 pb-2 text-[10px] font-semibold tracking-[0.18em] text-stone-400 uppercase leading-relaxed">
        Rise above your limits and embrace the warrior within
      </p>
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const { isOpen, setIsOpen } = useSidebar();
  const { t } = useLanguage();

  const brandHead = (
    <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1">
      <TKDLogo />
      <div className="flex flex-col min-w-0 leading-tight">
        <span className="font-extrabold text-stone-900 text-[15px] whitespace-nowrap">
          K-FORCE <span className="text-[var(--brand)]">ETHIOPIA</span>
        </span>
        <span className="text-[10px] text-stone-500 tracking-[0.18em] uppercase whitespace-nowrap">{t("adminPanel")}</span>
      </div>
    </Link>
  );

  return (
    <>
      {/* Mobile sidebar (drawer) — trigger lives in the Header */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-72 p-0 border-0">
          <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
          <div className="flex h-full flex-col bg-white">
            <div className="flex min-h-16 items-center gap-2 border-b border-stone-200 px-4 py-2">
              {brandHead}
              <LanguageSwitcher className="ml-auto shrink-0" />
            </div>
            <ScrollArea className="flex-1">
              <NavLinks onNavigate={() => setIsOpen(false)} />
            </ScrollArea>
            <div className="border-t border-stone-200 p-4">
              <SignOutButton />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar — white with hover effects */}
      <div className={cn("hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-50", className)}>
        <div className="flex h-full flex-col bg-white border-r border-stone-200 shadow-sm">
          <div className="flex min-h-16 items-center gap-2 border-b border-stone-200 px-4 py-2">
            {brandHead}
          </div>
          <ScrollArea className="flex-1">
            <NavLinks />
          </ScrollArea>
          <div className="border-t border-stone-200 p-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    </>
  );
}
