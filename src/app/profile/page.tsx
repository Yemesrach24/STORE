"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Loader2, ArrowLeft, User, Save, Phone, MapPin, ShoppingBag } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/profile");
    } else if (status === "authenticated") {
      setName(session?.user?.name || "");
      fetchProfile();
    }
  }, [status, session, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        setName(data.name || session?.user?.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    } catch {
      // Use session defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // Ignore error
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{t("myProfile")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/shop">
              <Button variant="outline" size="sm" className="font-medium gap-1.5">
                <ShoppingBag className="h-4 w-4" /> {t("shop")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-4 lg:px-6 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 flex items-center gap-4 border-b border-gray-100">
            {session?.user?.image ? (
              <img src={session.user.image} alt={t("profilePhoto")} className="w-16 h-16 rounded-full" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{name || t("userLabel")}</h2>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("fullName")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 border-gray-200"
                  placeholder={t("yourName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("phoneNumber")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 border-gray-200"
                  placeholder="+251 9XX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{t("address")}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 border-gray-200"
                  placeholder={t("yourAddress")}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] font-medium gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saved ? t("saved") : t("saveChanges")}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/shop/orders">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <ShoppingBag className="h-5 w-5 text-gray-400 mb-2" />
              <p className="font-semibold text-sm text-gray-900">{t("myOrders")}</p>
              <p className="text-xs text-gray-500">{t("viewOrderHistory")}</p>
            </div>
          </Link>
          <Link href="/shop">
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer">
              <ShoppingBag className="h-5 w-5 text-gray-400 mb-2" />
              <p className="font-semibold text-sm text-gray-900">{t("shop")}</p>
              <p className="text-xs text-gray-500">{t("browseEquipment")}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
