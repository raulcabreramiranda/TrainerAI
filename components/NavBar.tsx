"use client";

import Link from "next/link";
import { useTranslations } from "@/components/LanguageProvider";
import { LanguageSelect } from "@/components/LanguageSelect";

export function NavBar() {
  const t = useTranslations();

  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="font-display text-lg text-slate-900">
          {t("appName")}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          <Link className="hover:text-slate-900" href="/dashboard">
            {t("navDashboard")}
          </Link>
          <Link className="hover:text-slate-900" href="/generate-workout">
            {t("navWorkout")}
          </Link>
          <Link className="hover:text-slate-900" href="/generate-diet">
            {t("navDiet")}
          </Link>
          <Link className="hover:text-slate-900" href="/messages">
            {t("navMessages")}
          </Link>
          <Link className="hover:text-slate-900" href="/update-data">
            {t("navUpdateData")}
          </Link>
          <LanguageSelect compact />
        </nav>
      </div>
    </header>
  );
}
