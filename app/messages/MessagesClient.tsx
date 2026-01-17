"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";

type Message = {
  _id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
};

type Plan = {
  _id: string;
  title?: string;
};

export function MessagesClient() {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [filter, setFilter] = useState("all");

  const loadMessages = async (planId?: string) => {
    const query = planId ? `?planId=${planId}&limit=50` : "?limit=50";
    const res = await fetch(`/api/messages${query}`);
    const data = await res.json();
    if (!res.ok) {
      const apiErrorKey = getApiErrorKey(data.error);
      throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorLoadMessages"));
    }
    setMessages(data.messages || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const planRes = await fetch("/api/plans/active");
        const planData = await planRes.json();
        if (planRes.ok) {
          setActivePlan(planData.plan ?? null);
        }
        await loadMessages();
      } catch (err: any) {
        setError(err.message ?? t("errorLoadMessages"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const planId = filter === "active" ? activePlan?._id : undefined;
    loadMessages(planId).catch((err) => setError(err.message ?? t("errorLoadMessages")));
  }, [filter]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input.trim(),
          planId: filter === "active" ? activePlan?._id : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorSendMessage"));
      }

      setMessages((prev) => [...prev, ...(data.messages || [])]);
      setInput("");
    } catch (err: any) {
      setError(err.message ?? t("errorSendMessage"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loadingMessages")}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("chatHistoryTitle")}</p>
            <p className="text-xs text-slate-500">{t("chatHistorySubtitle")}</p>
          </div>
          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">{t("filterAll")}</option>
            <option value="active" disabled={!activePlan}>
              {t("filterActivePlan")}
            </option>
          </select>
        </div>
        {error ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noMessagesYet")}</p>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.role === "assistant"
                    ? "bg-slate-900 text-white"
                    : message.role === "system"
                    ? "bg-slate-100 text-slate-500"
                    : "bg-white text-slate-800 border border-slate-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.createdAt ? (
                  <p className="mt-2 text-[11px] opacity-70">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="text-sm font-semibold text-slate-800" htmlFor="message">
            {t("askQuestion")}
          </label>
          <textarea
            id="message"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={4}
            placeholder={t("messagePlaceholder")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <p className="text-xs text-slate-500">{t("safetyText")}</p>
          <Button type="submit" disabled={sending}>
            {sending ? t("sending") : t("send")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
