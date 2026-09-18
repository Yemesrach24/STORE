"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function SignInPage() {
  const { status } = useSession();
  const { t } = useLanguage();
  const signedIn = status === "authenticated";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="TKD Store" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">TKD Store</h1>
          <p className="text-gray-500 text-sm mt-1">
            {signedIn ? t("alreadySignedIn") : t("signInTitle")}
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {signedIn ? (
            <div className="space-y-4">
              <GoogleSignInButton callbackUrl="/shop" label={t("switchAccount")} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">{t("or")}</span>
                </div>
              </div>
              <Link href="/shop">
                <button className="w-full h-10 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:bg-[var(--brand-dark)] transition-colors">
                  {t("goToShop")}
                </button>
              </Link>
            </div>
          ) : (
            <GoogleSignInButton label={t("continueWithGoogle")} />
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">{t("termsNotice")}</p>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link href="/shop">{t("backToShop")}</Link>
        </p>
      </div>
    </div>
  );
}
