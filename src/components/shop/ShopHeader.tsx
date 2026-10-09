"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  LayoutDashboard,
  Package,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface ShopHeaderProps {
  /** Called when already on /shop to scroll to sections; otherwise we link to /shop#... */
  onScrollTo?: (id: string) => void;
}

export function ShopHeader({ onScrollTo }: ShopHeaderProps) {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const isAdmin =
    status === "authenticated" &&
    ["SUPER_ADMIN", "ADMIN"].includes((session?.user as any)?.role);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const goHome = () => {
    if (pathname === "/shop" && onScrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goSection = (id: string) => {
    if (pathname === "/shop" && onScrollTo) {
      onScrollTo(id);
    } else {
      window.location.href = `/shop#${id}`;
    }
  };

  const menuItemCls =
    "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all duration-150 hover:bg-orange-50 hover:text-[var(--brand)] hover:translate-x-1 active:scale-[0.99]";

  return (
    <>
      <header className="bg-white border-b border-stone-200/70 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3 h-14">
            <Link href="/shop" className="flex items-center gap-2 shrink-0">
              <img
                src="/logo.png"
                alt="K-FORCE ETHIOPIA"
                className="w-8 h-8 rounded-full object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-extrabold tracking-tight">
                  K-FORCE <span className="text-[var(--brand)]">ETHIOPIA</span>
                </span>
                <span className="text-[9px] text-stone-400 tracking-[0.18em] uppercase">
                  {t("shopTagline")}
                </span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-5 text-[12px] font-semibold mx-6">
              <Link
                href="/shop"
                onClick={goHome}
                className="text-[var(--brand)] uppercase tracking-wide hover:opacity-80 transition-opacity"
              >
                {t("home")}
              </Link>
              <button
                onClick={() => goSection("categories")}
                className="text-stone-600 hover:text-[var(--brand)] transition-colors uppercase tracking-wide"
              >
                {t("categories")}
              </button>
              <button
                onClick={() => goSection("products")}
                className="text-stone-600 hover:text-[var(--brand)] transition-colors uppercase tracking-wide"
              >
                {t("allProducts")}
              </button>
              {/* My Orders is visible to everyone (guests use guest_id cookie) */}
              <Link
                href="/shop/orders"
                className="text-stone-600 hover:text-[var(--brand)] transition-colors uppercase tracking-wide"
              >
                {t("myOrders")}
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="text-stone-600 hover:text-[var(--brand)] transition-colors uppercase tracking-wide flex items-center gap-1"
                >
                  {t("dashboard")}{" "}
                  <span className="text-[9px] bg-[var(--brand)] text-white px-1.5 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Language stays visible on desktop */}
              <LanguageSwitcher className="hidden md:flex" />
              {status === "loading" ? (
                <div className="w-16 h-8 bg-stone-200 rounded-full animate-pulse" />
              ) : session ? (
                <>
                  <Link href="/profile" className="hidden sm:block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-stone-700 gap-1.5 rounded-full hover:bg-orange-50 hover:text-[var(--brand)] transition-colors"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-400 hover:text-[var(--brand)] hover:bg-orange-50 rounded-full transition-colors"
                    onClick={() => setShowSignOutConfirm(true)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/sign-in">
                  <Button
                    size="sm"
                    className="bg-[var(--brand)] hover:bg-[#A34D0B] text-white font-semibold px-4 rounded-md h-8 text-xs"
                  >
                    <User className="h-3.5 w-3.5 mr-1" /> {t("signIn")}
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-stone-700 -mr-1 hover:bg-orange-50 hover:text-[var(--brand)] transition-colors"
                aria-label={mobileMenuOpen ? t("close") : t("menu")}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((v) => !v)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu — styled, hover effects, dashboard for admins */}
        <div
          className={cn(
            "lg:hidden fixed inset-0 z-40 transition-opacity duration-200",
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            className={cn(
              "relative bg-white shadow-xl border-b border-stone-200 rounded-b-2xl transition-transform duration-200 ease-out",
              mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
            )}
          >
            <div className="px-3 py-3 space-y-1">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(menuItemCls, "text-stone-900 bg-stone-50")}
              >
                <Home className="h-4 w-4 text-[var(--brand)]" /> {t("home")}
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  goSection("categories");
                }}
                className={cn(menuItemCls, "text-stone-600")}
              >
                <LayoutGrid className="h-4 w-4 text-[var(--brand)]" /> {t("categories")}
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  goSection("products");
                }}
                className={cn(menuItemCls, "text-stone-600")}
              >
                <Package className="h-4 w-4 text-[var(--brand)]" /> {t("allProducts")}
              </button>
              <Link
                href="/shop/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(menuItemCls, "text-stone-600")}
              >
                <ShoppingBag className="h-4 w-4 text-[var(--brand)]" /> {t("myOrders")}
              </Link>
              {isAdmin && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(menuItemCls, "text-stone-600")}
                >
                  <LayoutDashboard className="h-4 w-4 text-[var(--brand)]" /> {t("dashboard")}{" "}
                  <span className="text-[9px] bg-[var(--brand)] text-white px-1.5 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                </Link>
              )}
              {session ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(menuItemCls, "text-stone-600")}
                >
                  <User className="h-4 w-4 text-[var(--brand)]" /> {t("profile")}
                </Link>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(menuItemCls, "text-stone-600")}
                >
                  <User className="h-4 w-4 text-[var(--brand)]" /> {t("signIn")}
                </Link>
              )}
              <div className="px-4 py-3 mt-1 border-t border-stone-100 flex items-center justify-between rounded-xl hover:bg-orange-50 transition-colors">
                <span className="text-sm font-semibold text-stone-600">{t("language")}</span>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      </header>

      <ConfirmDialog
        open={showSignOutConfirm}
        title={t("signOutConfirmTitle")}
        message={t("signOutConfirmMessage")}
        confirmLabel={t("signOut")}
        variant="warning"
        onConfirm={() => {
          import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: "/shop" }));
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </>
  );
}
