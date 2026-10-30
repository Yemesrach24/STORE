"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "./LanguageProvider";
import { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "am", label: "አማርኛ", flag: "🇪🇹" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const current = OPTIONS.find((opt) => opt.value === lang) ?? OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-orange-50 hover:text-[var(--brand)] hover:border-[var(--brand)]/40",
            className
          )}
          aria-label={t("changeLanguage")}
          title={t("changeLanguage")}
        >
          <Languages className="h-3.5 w-3.5" />
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[190px] rounded-xl border-stone-200 p-1.5 shadow-lg"
      >
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setLang(opt.value)}
            className={cn(
              "cursor-pointer gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-orange-50 hover:text-[var(--brand)] focus:bg-orange-50 focus:text-[var(--brand)]",
              lang === opt.value && "bg-orange-50/70 text-[var(--brand)]"
            )}
          >
            <span className="text-base leading-none">{opt.flag}</span>
            <span>{opt.label}</span>
            {lang === opt.value && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
