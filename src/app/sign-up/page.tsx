"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function SignUpPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("joinUs")}</h1>
          <p className="text-gray-600">{t("createAccountSubtitle")}</p>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">{t("createAccount")}</CardTitle>
            <CardDescription className="text-center">{t("googleAccountOnly")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton label={t("signUpWithGoogle")} />
            <Separator />
            <p className="text-sm text-muted-foreground text-center">
              {t("alreadyHaveAccount")}{" "}
              <a href="/sign-in" className="text-blue-600 hover:text-blue-500 hover:underline">
                {t("signIn")}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
