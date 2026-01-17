"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError) return;
    if (oauthError === "provider_mismatch") {
      setError(t("oauthProviderMismatch"));
      return;
    }
    if (oauthError === "oauth_unconfigured") {
      setError(t("oauthNotConfigured"));
      return;
    }
    if (oauthError === "oauth_email") {
      setError(t("oauthMissingEmail"));
      return;
    }
    setError(t("oauthFailed"));
  }, [searchParams, t]);

  const onChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        setError(apiErrorKey ? t(apiErrorKey) : t("errorSignupFailed"));
        setLoading(false);
        return;
      }

      router.push("/update-data");
    } catch (err) {
      setError(t("errorSignupFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="mb-8 space-y-3 text-center">
            <p className="font-display text-3xl text-slate-900">{t("appName")}</p>
            <p className="mt-2 text-sm text-slate-600">
              {t("signupSubtitle")}
            </p>
            <div className="flex justify-center">
              <LanguageSelect />
            </div>
          </div>
          <Card>
            <form className="space-y-5" onSubmit={onSubmit}>
              <Field label={t("nameLabel")} htmlFor="name">
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.name}
                  onChange={onChange("name")}
                  placeholder={t("namePlaceholder")}
                />
              </Field>
              <Field label={t("emailLabel")} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </Field>
              <Field label={t("passwordLabel")} htmlFor="password" hint={t("passwordHint")}>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                />
              </Field>
              <Field label={t("confirmPasswordLabel")} htmlFor="confirmPassword">
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.confirmPassword}
                  onChange={onChange("confirmPassword")}
                  required
                />
              </Field>
              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("creatingAccount") : t("createAccount")}
              </Button>
            </form>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>{t("orContinueWith")}</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300"
                  href="/api/auth/oauth/google"
                >
                  {t("continueWithGoogle")}
                </Link>
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300"
                  href="/api/auth/oauth/facebook"
                >
                  {t("continueWithFacebook")}
                </Link>
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 hover:border-slate-300"
                  href="/api/auth/oauth/apple"
                >
                  {t("continueWithApple")}
                </Link>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              {t("alreadyHaveAccount")}{" "}
              <Link className="font-semibold text-slate-800" href="/login">
                {t("logIn")}
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
