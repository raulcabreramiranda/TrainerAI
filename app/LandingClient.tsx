"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

const locales = ["en", "pt", "es"] as const;
type Locale = (typeof locales)[number];
type Translations = Record<Locale, Record<string, string>>;

type LandingClientProps = {
  translations: Translations;
};

const localeLabels: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES"
};

const getNavigatorLocale = (): Locale => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const raw = (navigator.language || "").toLowerCase();
  if (raw.startsWith("pt-br")) {
    return "pt";
  }
  if (raw.startsWith("pt")) {
    return "pt";
  }
  if (raw.startsWith("es")) {
    return "es";
  }
  return "en";
};

export function LandingClient({ translations }: LandingClientProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    if (isManual) {
      return;
    }
    setLocale(getNavigatorLocale());
  }, [isManual]);

  const copy = useMemo(() => translations[locale], [locale, translations]);

  return (
    <div
      className="font-body text-slate-900"
      style={
        {
          "--accent": "#0f766e",
          "--accent-strong": "#0d9488",
          "--accent-soft": "#ccfbf1",
          "--ink": "#0f172a",
          "--paper": "#ffffff"
        } as CSSProperties
      }
    >
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-24 h-64 w-64 rounded-full bg-[color:var(--accent-soft)] opacity-70 blur-[110px]" />
        <div className="pointer-events-none absolute right-[-12rem] top-[-6rem] h-80 w-80 rounded-full bg-[#fde6d5] opacity-80 blur-[120px]" />
        <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="font-display text-lg tracking-tight text-[color:var(--ink)]"
            >
              {copy.nav_logo}
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
              <Link href="#workouts" className="transition hover:text-slate-900">
                {copy.nav_workout}
              </Link>
              <Link href="#diet" className="transition hover:text-slate-900">
                {copy.nav_diet}
              </Link>
              <Link href="#sessions" className="transition hover:text-slate-900">
                {copy.nav_sessions}
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <div className="flex rounded-full bg-slate-100 p-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                {locales.map((value) => {
                  const isActive = locale === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setIsManual(true);
                        setLocale(value);
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        isActive
                          ? "bg-white text-slate-900 shadow-sm"
                          : "hover:text-slate-900"
                      }`}
                      aria-pressed={isActive}
                    >
                      {localeLabels[value]}
                    </button>
                  );
                })}
              </div>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-900 md:inline-flex"
              >
                {copy.nav_login}
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--accent-strong)] md:inline-flex"
              >
                {copy.nav_signup}
              </Link>
            </div>
          </div>
        </header>

        <section className="relative">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div
              className="fade-up space-y-6"
              style={{ animationDelay: "80ms" }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                SmartFit Planner
              </span>
              <h1 className="font-display text-4xl leading-tight text-[color:var(--ink)] sm:text-5xl lg:text-[3.3rem]">
                {copy.hero_title}
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">
                {copy.hero_subtitle}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[color:var(--accent-strong)]"
                >
                  {copy.hero_cta_primary}
                </Link>
                <Link
                  href="#how"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {copy.hero_cta_secondary}
                </Link>
              </div>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <span className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 shadow-sm">
                  {copy.hero_bullet_1}
                </span>
                <span className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 shadow-sm">
                  {copy.hero_bullet_2}
                </span>
                <span className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 shadow-sm">
                  {copy.hero_bullet_3}
                </span>
              </div>
            </div>
            <div
              className="fade-up relative"
              style={{ animationDelay: "180ms" }}
            >
              <div className="absolute -left-8 top-10 h-24 w-24 rounded-3xl bg-[#ffe8d7] shadow-soft" />
              <div className="absolute -bottom-10 right-6 h-20 w-32 rounded-full bg-[#dbeafe] shadow-soft" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-soft">
                <Image
                  src="/landing/hero.png"
                  alt="SmartFit Planner hero preview"
                  width={1200}
                  height={900}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="how" className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
              {copy.section_how_title}
            </p>
            <h2 className="font-display text-3xl text-slate-900">
              {copy.section_how_title}
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: copy.section_how_step1_title,
                body: copy.section_how_step1_body,
                accent: "bg-emerald-50 text-emerald-700"
              },
              {
                title: copy.section_how_step2_title,
                body: copy.section_how_step2_body,
                accent: "bg-sky-50 text-sky-700"
              },
              {
                title: copy.section_how_step3_title,
                body: copy.section_how_step3_body,
                accent: "bg-amber-50 text-amber-700"
              }
            ].map((step, index) => (
              <div
                key={step.title}
                className="fade-up flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-soft"
                style={{ animationDelay: `${120 + index * 90}ms` }}
              >
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${step.accent}`}
                >
                  {step.title}
                </span>
                <p className="text-sm text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workouts" className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
              {copy.nav_workout}
            </p>
            <h2 className="font-display text-3xl text-slate-900">
              {copy.section_workout_title}
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              {copy.section_workout_body}
            </p>
            <Link
              href="/signup"
              className="inline-flex w-fit items-center rounded-full bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--accent-strong)]"
            >
              {copy.section_workout_cta}
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-soft">
            <Image
              src="/landing/workout.png"
              alt="Workout plan preview"
              width={1100}
              height={850}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section id="diet" className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="relative order-2 overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-soft lg:order-none">
            <Image
              src="/landing/diet.png"
              alt="Diet plan preview"
              width={1100}
              height={850}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="order-1 space-y-5 lg:order-none">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-600">
              {copy.nav_diet}
            </p>
            <h2 className="font-display text-3xl text-slate-900">
              {copy.section_diet_title}
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              {copy.section_diet_body}
            </p>
            <Link
              href="/signup"
              className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              {copy.section_diet_cta}
            </Link>
          </div>
        </div>
      </section>

      <section id="sessions" className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">
              {copy.nav_sessions}
            </p>
            <h2 className="font-display text-3xl text-slate-900">
              {copy.section_session_title}
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              {copy.section_session_body}
            </p>
            <Link
              href="/signup"
              className="inline-flex w-fit items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              {copy.section_session_cta}
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-soft">
            <Image
              src="/landing/session.png"
              alt="Session tracker preview"
              width={1100}
              height={850}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-8 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
              {copy.section_disclaimer_title}
            </p>
            <p className="mt-4 text-sm text-amber-800 sm:text-base">
              {copy.section_disclaimer_body}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white px-8 py-12 shadow-soft">
            <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[color:var(--accent-soft)] blur-3xl" />
            <div className="absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-[#fde6d5] blur-3xl" />
            <div className="relative space-y-4">
              <h2 className="font-display text-3xl text-slate-900">
                {copy.section_final_title}
              </h2>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                {copy.section_final_body}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--accent-strong)]"
                >
                  {copy.section_final_cta_primary}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                >
                  {copy.section_final_cta_secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
