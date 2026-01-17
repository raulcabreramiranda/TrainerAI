"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
        setError(data.error ?? "Signup failed.");
        setLoading(false);
        return;
      }

      router.push("/update-data");
    } catch (err) {
      setError("Signup failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <p className="font-display text-3xl text-slate-900">Move &amp; Munch</p>
            <p className="mt-2 text-sm text-slate-600">
              Create your account to build safe workout and meal plans.
            </p>
          </div>
          <Card>
            <form className="space-y-5" onSubmit={onSubmit}>
              <Field label="Name" htmlFor="name">
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.name}
                  onChange={onChange("name")}
                  placeholder="Sam"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Field label="Password" htmlFor="password" hint="At least 8 characters.">
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                  value={form.password}
                  onChange={onChange("password")}
                  required
                />
              </Field>
              <Field label="Confirm password" htmlFor="confirmPassword">
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
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link className="font-semibold text-slate-800" href="/login">
                Log in
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
