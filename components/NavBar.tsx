"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/components/LanguageProvider";
import { LanguageSelect } from "@/components/LanguageSelect";

type ProfileResponse = {
  profile?: {
    avatarBase64?: string;
    avatarContentType?: string;
  };
  role?: string | null;
};

export function NavBar() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/me/profile")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as ProfileResponse;
      })
      .then((data) => {
        if (!mounted || !data) return;
        if (data.role === "ROLE_ADMIN") {
          setIsAdmin(true);
        }
        if (data.profile?.avatarBase64 && data.profile.avatarContentType) {
          setAvatarUrl(
            `data:${data.profile.avatarContentType};base64,${data.profile.avatarBase64}`
          );
        }
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="relative z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="font-display text-lg text-slate-900">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-3">
          </div>
        <div className="flex items-center gap-3">
          <Link className="hover:text-slate-900" href="/generate-workout">
            {t("navWorkout")}
          </Link>
          <Link className="hover:text-slate-900" href="/workout-log">
            {t("navWorkoutLog")}
          </Link>
          <Link className="hover:text-slate-900" href="/generate-diet">
            {t("navDiet")}
          </Link>
          <LanguageSelect />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600"
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={t("menuLabel")}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={t("menuLabel")} className="h-full w-full object-cover" />
              ) : (
                <span>MM</span>
              )}
            </button>
            {open ? (
              <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft z-50">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs text-slate-500">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={t("menuLabel")} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">MM</div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t("menuTitle")}</p>
                  </div>
                </div>
                <nav className="py-3 text-sm text-slate-700">
                  <Link className="block rounded-lg px-3 py-2 hover:bg-slate-50" href="/update-data" onClick={() => setOpen(false)}>
                    {t("navUpdateData")}
                  </Link>
                  <Link className="block rounded-lg px-3 py-2 hover:bg-slate-50" href="/dashboard" onClick={() => setOpen(false)}>
                    {t("navDashboard")}
                  </Link>
                  <Link className="block rounded-lg px-3 py-2 hover:bg-slate-50" href="/messages" onClick={() => setOpen(false)}>
                    {t("navMessages")}
                  </Link>
                  <Link
                    className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                    href="/workout-log"
                    onClick={() => setOpen(false)}
                  >
                    {t("navWorkoutLog")}
                  </Link>
                  {isAdmin ? (
                    <Link
                      className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                      href="/ai-models"
                      onClick={() => setOpen(false)}
                    >
                      {t("navAiModels")}
                    </Link>
                  ) : null}
                </nav>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
