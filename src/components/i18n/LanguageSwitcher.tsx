"use client";

import { useLanguage } from "./LanguageProvider";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className, dark }: { className?: string; dark?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={cn("flex items-center gap-1 rounded-lg border p-0.5", dark ? "border-gray-700" : "border-gray-200", className)}>
      <button
        onClick={() => setLang("en")}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-colors",
          lang === "en"
            ? "bg-[var(--brand)] text-white"
            : dark ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-900"
        )}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => setLang("am")}
        className={cn(
          "px-2 py-1 text-xs font-semibold rounded-md transition-colors",
          lang === "am"
            ? "bg-[var(--brand)] text-white"
            : dark ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-900"
        )}
        aria-label="አማርኛ"
      >
        አማ
      </button>
    </div>
  );
}
