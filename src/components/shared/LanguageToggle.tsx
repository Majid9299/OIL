"use client";

import { useLanguage } from "./LanguageProvider";

export function LanguageToggle() {
  const { locale, toggleLocale } = useLanguage();

  return (
    <button
      onClick={toggleLocale}
      className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-600 active:scale-95"
    >
      {locale === "ar" ? "EN" : "AR"}
    </button>
  );
}
