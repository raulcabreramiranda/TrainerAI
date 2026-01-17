"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { LanguageSelect } from "@/components/LanguageSelect";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        setError(apiErrorKey ? t(apiErrorKey) : t("errorLoginFailed"));
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(t("errorLoginFailed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="mb-8 space-y-3 text-center">
            <p className="font-display text-3xl text-slate-900">{t("appName")}</p>
            <p className="mt-2 text-sm text-slate-600">{t("loginSubtitle")}</p>
            <div className="flex justify-center">
              <LanguageSelect />
            </div>
          </div>
          <Card>
            <form className="space-y-5" onSubmit={onSubmit}>
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
              <Field label={t("passwordLabel")} htmlFor="password">
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                />
              </Field>
              {error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("loggingIn") : t("logIn")}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-500">
              {t("needAccount")}{" "}
              <Link className="font-semibold text-slate-800" href="/signup">
                {t("signUp")}
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
