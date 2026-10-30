"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/price";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ShopHeader } from "@/components/shop/ShopHeader";
import {
  Search, Loader2, ChevronRight,
  ShieldCheck, Zap, Medal, Target,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  nameAm?: string;
  nameKo?: string;
  description?: string;
  descriptionAm?: string;
  descriptionKo?: string;
  imageUrl?: string;
  itemCount?: number;
}

interface Item {
  _id: string;
  name: string;
  nameAm?: string;
  nameKo?: string;
  description: string;
  descriptionAm?: string;
  descriptionKo?: string;
  uniqueNumber: string;
  imageUrl?: string;
  imageUrls?: string[];
  categoryId: { _id: string; name: string; nameAm?: string; nameKo?: string; imageUrl?: string };
  color?: string;
  local?: { enabled: boolean; basePrice: number | string };
  imported?: { enabled: boolean; basePrice: number | string };
  tags?: string[];
  supplier?: string;
  supplierAm?: string;
  supplierKo?: string;
}

export default function ShopPage() {
  const { data: session } = useSession();
  const { t, ln } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [promoIndex, setPromoIndex] = useState(0);
  const [mottoIndex, setMottoIndex] = useState(0);
  const promoRef = useRef<HTMLDivElement>(null);
  const mottoRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const PROMO_CARDS = [
    {
      src: "/photo%201.jpeg",
      eyebrow: t("promo1Eyebrow"),
      title: t("promo1Title"),
      desc: t("promo1Desc"),
    },
    {
      src: "/photo%202.jpeg",
      eyebrow: t("promo2Eyebrow"),
      title: t("promo2Title"),
      desc: t("promo2Desc"),
    },
  ];

  const MOTTOS = [
    { icon: Target, title: t("motto1Title"), desc: t("motto1Desc") },
    { icon: Zap, title: t("motto2Title"), desc: t("motto2Desc") },
    { icon: Medal, title: t("motto3Title"), desc: t("motto3Desc") },
    { icon: ShieldCheck, title: t("motto4Title"), desc: t("motto4Desc") },
  ];

  useEffect(() => {
    Promise.all([fetchCategories(), fetchItems()]);
    // scroll to hash when arriving from other pages (e.g. /shop#categories)
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Live debounced search — every keystroke filters after a short pause
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchItems();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // One-direction auto-slide: always moves forward (left), loops to start.
  // Pauses while the user is touching/dragging the carousel.
  const promoIndexRef = useRef(0);
  const mottoIndexRef = useRef(0);
  const promoPaused = useRef(false);
  const mottoPaused = useRef(false);

  const scrollPromoTo = (i: number) => {
    const el = promoRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-promo-card]");
    const w = card?.offsetWidth ?? el.clientWidth;
    el.scrollTo({ left: i * (w + 16), behavior: "smooth" });
  };

  const scrollMottoTo = (i: number) => {
    const el = mottoRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-motto-card]");
    const w = card?.offsetWidth ?? el.clientWidth;
    el.scrollTo({ left: i * (w + 12), behavior: "smooth" });
  };

  useEffect(() => {
    promoIndexRef.current = promoIndex;
  }, [promoIndex]);
  useEffect(() => {
    mottoIndexRef.current = mottoIndex;
  }, [mottoIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (promoPaused.current) return;
      const next = (promoIndexRef.current + 1) % PROMO_CARDS.length;
      promoIndexRef.current = next;
      setPromoIndex(next);
      scrollPromoTo(next);
    }, 4500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PROMO_CARDS.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (mottoPaused.current) return;
      const next = (mottoIndexRef.current + 1) % MOTTOS.length;
      mottoIndexRef.current = next;
      setMottoIndex(next);
      scrollMottoTo(next);
    }, 3500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MOTTOS.length]);

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
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
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

  const getPriceLabel = (item: Item) => {
    const parts: string[] = [];
    if (item.local?.enabled) parts.push(formatPrice(item.local.basePrice));
    if (item.imported?.enabled) parts.push(formatPrice(item.imported.basePrice));
    return parts.length > 0 ? parts.join(" / ") : formatPrice(0);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePromoScroll = () => {
    const el = promoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const idx = Math.round((el.scrollLeft / max) * (PROMO_CARDS.length - 1));
    setPromoIndex(idx);
  };

  const goToPromo = (i: number) => {
    promoIndexRef.current = i;
    setPromoIndex(i);
    scrollPromoTo(i);
  };

  const handleMottoScroll = () => {
    const el = mottoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const idx = Math.round((el.scrollLeft / max) * (MOTTOS.length - 1));
    setMottoIndex(idx);
  };

  const goToMotto = (i: number) => {
    mottoIndexRef.current = i;
    setMottoIndex(i);
    scrollMottoTo(i);
  };

  const renderProductCard = (item: Item) => {
    const imgSrc = getItemImage(item);
    const catName = item.categoryId ? ln(item.categoryId.name, item.categoryId.nameAm, item.categoryId.nameKo) : t("uncategorized");
    return (
      <Card
        key={item._id}
        className="bg-white border border-stone-200/80 hover:shadow-lg hover:-translate-y-0.5 transition-all h-full overflow-hidden rounded-xl py-0 gap-0"
      >
        <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden group">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src="/logo.png" alt="No image" className="w-16 h-16 object-contain opacity-30" />
            </div>
          )}
          <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-1 rounded bg-[#0E2B1E] text-white uppercase tracking-wide">
            {catName}
          </span>
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-1 rounded bg-[var(--brand)] text-white uppercase tracking-wide">
            {t("newBadge")}
          </span>
        </div>
        <CardContent className="p-3">
          {(item.supplier || item.supplierAm) && (
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider line-clamp-1 mb-0.5">
              {ln(item.supplier, item.supplierAm, item.supplierKo)}
            </p>
          )}
          <Link href={`/shop/${item._id}`}>
            <h3 className="font-bold text-[13px] leading-snug text-stone-900 line-clamp-2 min-h-[2.4rem] hover:text-[var(--brand)] transition-colors">
              {ln(item.name, item.nameAm, item.nameKo)}
            </h3>
          </Link>
          <div className="flex items-end justify-between pt-2 mt-2 border-t border-stone-100">
            <div>
              <p className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">{t("price")}</p>
              <p className="text-[15px] font-extrabold text-stone-900 leading-tight">
                {getPriceLabel(item)}
              </p>
            </div>
            <Link
              href={`/shop/${item._id}`}
              className="text-[11px] font-bold px-3.5 py-1.5 rounded-full bg-orange-50 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors flex items-center gap-0.5"
            >
              {t("view")} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const selectedCatName = selectedCategory
    ? (() => {
        const cat = categories.find((c) => c._id === selectedCategory);
        return cat ? ln(cat.name, cat.nameAm, cat.nameKo) : t("allProductsTitle");
      })()
    : t("allProductsTitle");

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-stone-900">
      <ShopHeader onScrollTo={scrollTo} />

      {/* ── Warrior strip — white text, no leading dot ── */}
      <div className="bg-[#0E2B1E] text-white">
        <p className="text-center text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase py-2 px-3">
          {t("warriorLine")}
        </p>
      </div>

      {/* ── Search ── */}
      <div className="bg-white border-b border-stone-200/70">
        <div className="px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder={t("searchPlaceholderLong")}
                className="pl-10 h-10 bg-stone-50 border-stone-200 rounded-md text-[13px]"
                suppressHydrationWarning
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-10 px-5 bg-[#0E2B1E] hover:bg-[#1a4530] rounded-md font-bold text-xs tracking-wide" suppressHydrationWarning>
              {t("search")} <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full-width content — edges close to the viewport */}
      <div className="px-3 sm:px-4 lg:px-6 py-5 space-y-8 w-full">
        {/* ── Equipment Categories ── */}
        <section id="categories" className="scroll-mt-32">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--brand)] uppercase flex items-center gap-1">
                <span className="text-xs">🏷️</span> {t("equipmentCategories")}
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">{t("browseSpecializedGear")}</h2>
            </div>
            <p className="hidden sm:block text-[11px] text-stone-400">{t("browseVerifiedInventory")}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => { setSelectedCategory(null); scrollTo("products"); }}
              className={cn(
                "bg-white rounded-xl border text-left overflow-hidden hover:shadow-md transition-all group",
                !selectedCategory ? "border-[var(--brand)] ring-1 ring-[var(--brand)]/30" : "border-stone-200/80"
              )}
            >
              <div className="h-24 bg-amber-50/60 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="All" className="w-16 h-16 object-contain group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-2.5 flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs font-bold">{t("allEquipment")}</p>
                  <p className="text-[10px] text-stone-400">{t("fullMasterCatalog")}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-300 shrink-0" />
              </div>
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat._id}
                onClick={() => { setSelectedCategory(cat._id); scrollTo("products"); }}
                className={cn(
                  "bg-white rounded-xl border text-left overflow-hidden hover:shadow-md transition-all group",
                  selectedCategory === cat._id ? "border-[var(--brand)] ring-1 ring-[var(--brand)]/30" : "border-stone-200/80"
                )}
              >
                <div className="h-24 bg-stone-100 flex items-center justify-center overflow-hidden">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-xl font-bold text-stone-300">{cat.name.charAt(0)}</span>
                  )}
                </div>
                <div className="p-2.5 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{ln(cat.name, cat.nameAm, cat.nameKo)}</p>
                    <p className="text-[10px] text-stone-400 truncate">{t("itemsCount", { count: cat.itemCount || 0 })}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-300 shrink-0" />
                </div>
              </button>
            ))}
          </div>
          {categories.length > 6 && (
            <div className="flex gap-3 mt-3 overflow-x-auto pb-1 scrollbar-hide">
              {categories.slice(5).map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => { setSelectedCategory(cat._id); scrollTo("products"); }}
                  className={cn(
                    "shrink-0 flex items-center gap-2 bg-white rounded-full border pl-1 pr-3 py-1 hover:shadow transition-all",
                    selectedCategory === cat._id ? "border-[var(--brand)]" : "border-stone-200"
                  )}
                >
                  <span className="h-8 w-8 rounded-full overflow-hidden bg-stone-100 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-stone-400">{cat.name.charAt(0)}</span>
                    )}
                  </span>
                  <span className="text-xs font-semibold max-w-[8rem] truncate">{ln(cat.name, cat.nameAm, cat.nameKo)}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── All Products — title only ── */}
        <section id="products" className="scroll-mt-32">
          <div className="flex items-end justify-between mb-1">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">{selectedCatName}</h2>
            </div>
          </div>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-2 text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              ✕ Clear filter — show all products
            </button>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 mt-3">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                <Search className="h-7 w-7 text-stone-300" />
              </div>
              <p className="font-medium text-stone-700 mb-1">{t("noProducts")}</p>
              <p className="text-sm text-stone-500">{t("tryDifferentSearch")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mt-3">
              {items.map((item) => renderProductCard(item))}
            </div>
          )}
        </section>

        {/* ── 2 promo cards — auto-sliding, one at a time on mobile ── */}
        <section aria-label="Featured collections">
          <div
            ref={promoRef}
            onScroll={handlePromoScroll}
            onTouchStart={() => { promoPaused.current = true; }}
            onTouchEnd={() => { setTimeout(() => { promoPaused.current = false; }, 3000); }}
            onMouseEnter={() => { promoPaused.current = true; }}
            onMouseLeave={() => { promoPaused.current = false; }}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
          >
            {PROMO_CARDS.map((promo) => (
              <article
                key={promo.title}
                data-promo-card
                className="relative snap-start shrink-0 w-full sm:w-[calc(50%-8px)] rounded-2xl overflow-hidden min-h-[210px] sm:min-h-[240px] flex"
              >
                <img src={promo.src} alt={promo.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
                <div className="relative mt-auto p-5 sm:p-6 max-w-[85%]">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-orange-300 uppercase mb-1">{promo.eyebrow}</p>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight">{promo.title}</h3>
                  <p className="text-[12px] text-white/75 leading-relaxed mt-1.5">{promo.desc}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {PROMO_CARDS.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goToPromo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  promoIndex === i ? "w-6 bg-[var(--brand)]" : "w-1.5 bg-stone-300 hover:bg-stone-400"
                )}
              />
            ))}
          </div>
        </section>

        {/* ── 4 mottos — auto-sliding, one at a time on mobile ── */}
        <section aria-label="Our values">
          <div
            ref={mottoRef}
            onScroll={handleMottoScroll}
            onTouchStart={() => { mottoPaused.current = true; }}
            onTouchEnd={() => { setTimeout(() => { mottoPaused.current = false; }, 3000); }}
            onMouseEnter={() => { mottoPaused.current = true; }}
            onMouseLeave={() => { mottoPaused.current = false; }}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide sm:grid sm:grid-cols-4 sm:overflow-visible"
          >
            {MOTTOS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                data-motto-card
                className="snap-start shrink-0 w-full sm:w-auto bg-white rounded-xl border border-stone-200/70 px-4 py-4 flex items-center gap-3"
              >
                <span className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-[var(--brand)]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold tracking-wide leading-tight">{title}</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2 sm:hidden">
            {MOTTOS.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to motto ${i + 1}`}
                onClick={() => goToMotto(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  mottoIndex === i ? "w-6 bg-[var(--brand)]" : "w-1.5 bg-stone-300"
                )}
              />
            ))}
          </div>
          {/* dots also visible on desktop for consistency */}
          <div className="hidden sm:flex items-center justify-center gap-1.5 mt-2">
            {MOTTOS.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to motto ${i + 1}`}
                onClick={() => goToMotto(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  mottoIndex === i ? "w-6 bg-[var(--brand)]" : "w-1.5 bg-stone-300 hover:bg-stone-400"
                )}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer (deep dojo green) ── */}
      <footer className="bg-[#0E2B1E] text-stone-300 mt-6">
        <div className="px-4 sm:px-6 lg:px-6 py-10 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="K-FORCE ETHIOPIA" className="w-9 h-9 rounded-full object-contain bg-white" />
                <span className="font-extrabold text-white tracking-tight text-sm">K-FORCE <span className="text-orange-400">ETHIOPIA</span></span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-orange-300/80 uppercase mb-2">{t("premiumGear")}</p>
              <p className="text-xs text-stone-400 leading-relaxed max-w-xs mb-4">
                {t("premiumGearDesc")}
              </p>
              <p className="text-xs text-stone-400 flex items-center gap-2">📍 {t("addisAbaba")}</p>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">{t("shopFooter")}</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo("products")} className="text-xs text-stone-400 hover:text-white transition-colors">{t("allProducts")}</button></li>
                <li><button onClick={() => scrollTo("categories")} className="text-xs text-stone-400 hover:text-white transition-colors">{t("categories")}</button></li>
                <li><Link href="/shop/orders" className="text-xs text-stone-400 hover:text-white transition-colors">{t("myOrders")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">{t("supportFooter")}</h4>
              <ul className="space-y-2 text-xs text-stone-400">
                <li>Telegram: @{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "K_Force_Ethiopia_store"}</li>
                <li>info@kforceethiopia.com</li>
                <li>{t("addisAbaba")}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">{t("accountFooter")}</h4>
              <ul className="space-y-2">
                {session ? (
                  <>
                    <li><Link href="/profile" className="text-xs text-stone-400 hover:text-white transition-colors">{t("profile")}</Link></li>
                    <li><Link href="/shop/orders" className="text-xs text-stone-400 hover:text-white transition-colors">{t("myOrders")}</Link></li>
                  </>
                ) : (
                  <li><Link href="/sign-in" className="text-xs text-stone-400 hover:text-white transition-colors">{t("signIn")}</Link></li>
                )}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-stone-500">© 2026 {t("allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
