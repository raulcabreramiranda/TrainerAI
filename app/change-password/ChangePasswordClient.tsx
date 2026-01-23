"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { Button } from "@/components/Button";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/api/errors";

export function ChangePasswordClient() {
  const t = useTranslations();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (form.newPassword.length < 8) {
      setError(t("errorPasswordMin"));
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getErrorMessage(data.error);
        const apiErrorKey = getApiErrorKey(errorMessage);
        setError(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorChangePassword"));
        setLoading(false);
        return;
      }

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage(t("passwordUpdated"));
    } catch (err) {
      setError(t("errorChangePassword"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form className="space-y-5" onSubmit={onSubmit}>
        <Field label={t("currentPasswordLabel")} htmlFor="currentPassword">
          <input
            id="currentPassword"
            type="password"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.currentPassword}
            onChange={onChange("currentPassword")}
            autoComplete="current-password"
            required
          />
        </Field>
        <Field label={t("newPasswordLabel")} htmlFor="newPassword" hint={t("passwordHint")}>
          <input
            id="newPassword"
            type="password"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            value={form.newPassword}
            onChange={onChange("newPassword")}
            autoComplete="new-password"
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
            autoComplete="new-password"
            required
          />
        </Field>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? t("changingPassword") : t("changePasswordAction")}
          </Button>
          <Link href="/update-data">
            <Button type="button" variant="secondary">
              {t("backToProfile")}
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
