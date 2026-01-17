"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { normalizeLanguage, type AppLanguage } from "@/lib/language";
import { translate, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {}
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  const setLanguage = (next: AppLanguage) => {
    setLanguageState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("mm_language", next);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem("mm_language");
    if (stored) {
      setLanguageState(normalizeLanguage(stored));
    }

    fetch("/api/me/settings")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return data?.settings?.language as string | undefined;
      })
      .then((saved) => {
        if (saved) {
          const normalized = normalizeLanguage(saved);
          setLanguage(normalized);
        }
      })
      .catch(() => null);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslations() {
  const { language } = useLanguage();
  return useMemo(() => {
    return (key: TranslationKey) => translate(language, key);
  }, [language]);
}
