"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import {
  Search, Loader2, ChevronRight, User, LogOut, Menu, X,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  itemCount?: number;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  uniqueNumber: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  imageUrls?: string[];
  stockStatus: string;
  categoryId: { _id: string; name: string; imageUrl?: string };
  size?: string;
  color?: string;
  tags?: string[];
  supplier?: string;
}

export default function ShopPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchItems()]);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  // Close mobile menu on Escape and lock body scroll while open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/shop/categories");
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedCategory) params.set("categoryId", selectedCategory);
      if (searchTerm) params.set("search", searchTerm);
      const response = await fetch(`/api/shop/items?${params}`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchItems();

  const getItemImage = (item: Item) => {
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0];
    if (item.imageUrl) return item.imageUrl;
    return null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="TKD Store" className="w-10 h-10 rounded-full object-contain" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 tracking-tight leading-none">TKD Store</span>
                <span className="text-[10px] sm:text-[11px] text-gray-400 tracking-widest uppercase">Taekwondo Equipment</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm">
              <Link href="/shop" className="font-medium text-gray-900">Home</Link>
              <a href="#equipment" className="font-medium text-gray-500 hover:text-gray-900 transition-colors">Categories</a>
              <a href="#products" className="font-medium text-gray-500 hover:text-gray-900 transition-colors">All Products</a>
              {status === "authenticated" && (
                <Link href="/shop/orders" className="font-medium text-gray-500 hover:text-gray-900 transition-colors">My Orders</Link>
              )}
              {status === "authenticated" && (session?.user as any)?.role && ["SUPER_ADMIN", "ADMIN"].includes((session?.user as any)?.role) && (
                <Link href="/dashboard" className="font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors">
                  Dashboard →
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {status === "loading" ? (
                <div className="w-20 h-8 bg-gray-100 rounded-md animate-pulse" />
              ) : session ? (
                <>
                  <Link href="/profile" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="text-gray-700 gap-1.5">
                      <User className="h-4 w-4" /> Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-[var(--brand)] gap-1.5"
                    onClick={() => setShowSignOutConfirm(true)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden text-gray-700 -mr-1"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((v) => !v)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button size="sm" className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-medium px-4 sm:px-5">
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden text-gray-700 -mr-1"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((v) => !v)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu — overlay + slide-down panel */}
        <div
          className={cn(
            "md:hidden fixed inset-0 z-40 transition-opacity duration-200",
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
              "relative bg-white shadow-xl border-b border-gray-200 transition-transform duration-200 ease-out",
              mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
            )}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-md"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-2 py-2">
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-900 hover:bg-gray-50">Home</Link>
              <a href="#equipment" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">Categories</a>
              <a href="#products" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">All Products</a>
              {status === "authenticated" && (
                <>
                  <Link href="/shop/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">My Orders</Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">Profile</Link>
                </>
              )}
              {status === "authenticated" && (session?.user as any)?.role && ["SUPER_ADMIN", "ADMIN"].includes((session?.user as any)?.role) && (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-lg px-3 py-3 text-base font-semibold text-[var(--brand)] hover:bg-gray-50">
                  Dashboard →
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      <div className="px-3 sm:px-4 lg:px-6 py-6">
        {/* Search */}
        <div className="max-w-xl mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search taekwondo gear..."
                className="pl-10 h-11 bg-white border-gray-200 rounded-lg"
                suppressHydrationWarning
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-11 px-6 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium" suppressHydrationWarning>
              Search
            </Button>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div id="equipment" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Equipment Categories</h2>
                <p className="text-sm text-gray-500 mt-1">Browse by category to find exactly what you need</p>
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-[var(--brand)] hover:text-[var(--brand-dark)] font-medium transition-colors"
                >
                  ← View All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* All Equipment Card */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-left rounded-xl border-2 transition-all overflow-hidden bg-white group ${
                  !selectedCategory
                    ? "border-[var(--brand)] shadow-md"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center overflow-hidden">
                  <div className="text-center group-hover:scale-105 transition-transform">
                    <img src="/logo.png" alt="All" className="w-16 h-16 mx-auto mb-2 object-contain" />
                    <p className="text-xs font-semibold text-gray-700">{items.length} items</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-gray-900">All Equipment</p>
                  <p className="text-xs text-gray-500 mt-0.5">Browse everything</p>
                </div>
              </button>

              {/* Category Cards */}
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`text-left rounded-xl border-2 transition-all overflow-hidden bg-white group ${
                    selectedCategory === cat._id
                      ? "border-[var(--brand)] shadow-md"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-gray-400">{cat.name.charAt(0)}</span>
                        </div>
                        <p className="text-xs text-gray-400">{cat.itemCount || 0} items</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div id="products">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedCategory
                  ? categories.find((c) => c._id === selectedCategory)?.name || "Products"
                  : "All Products"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{items.length} products available</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="h-7 w-7 text-gray-300" />
              </div>
              <p className="font-medium text-gray-700 mb-1">No products found</p>
              <p className="text-sm text-gray-500">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {items.map((item) => {
                const imgSrc = getItemImage(item);
                return (
                  <Link key={item._id} href={`/shop/${item._id}`}>
                    <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all cursor-pointer h-full overflow-hidden group rounded-xl">
                      <div className="aspect-square bg-gray-50 overflow-hidden relative">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <img src="/logo.png" alt="No image" className="w-16 h-16 object-contain opacity-30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <p className="text-xs text-[var(--brand)] font-semibold uppercase tracking-wide mb-1">
                          {item.categoryId?.name ?? "Uncategorized"}
                        </p>
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                          {item.name}
                        </h3>
                        {item.supplier && (
                          <p className="text-xs text-gray-400 mb-1">
                            supplier: {item.supplier}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3 min-h-[2rem]">
                          {item.description}
                        </p>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-3">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0 text-gray-500 border-gray-200">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-end justify-between pt-2 border-t border-gray-100">
                          <span className="text-lg font-bold text-gray-900">
                            Br {(item.price ?? 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-[var(--brand)] font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="px-3 sm:px-4 lg:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="TKD Store" className="w-8 h-8 rounded-full object-contain" />
                <span className="font-bold text-gray-900">TKD Store</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Premium taekwondo & martial arts equipment for practitioners of all levels in Ethiopia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Shop</h4>
              <ul className="space-y-2">
                <li><Link href="/shop" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">All Products</Link></li>
                <li><a href="#equipment" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Categories</a></li>
                {session && <li><Link href="/shop/orders" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">My Orders</Link></li>}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Support</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-500">Telegram: @tkd_equp_bot</span></li>
                <li><span className="text-sm text-gray-500">Email: info@tkdstore.et</span></li>
                <li><span className="text-sm text-gray-500">Addis Ababa, Ethiopia</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-3">Account</h4>
              <ul className="space-y-2">
                {session ? (
                  <>
                    <li><Link href="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Profile</Link></li>
                    <li><Link href="/shop/orders" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">My Orders</Link></li>
                  </>
                ) : (
                  <li><Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign In</Link></li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© 2026 TKD Store. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign-out confirmation dialog */}
      <ConfirmDialog
        open={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        variant="warning"
        onConfirm={() => {
          import("next-auth/react").then(({ signOut }) =>
            signOut({ callbackUrl: "/shop" })
          );
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
