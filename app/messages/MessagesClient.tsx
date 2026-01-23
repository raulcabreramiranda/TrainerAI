"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useLanguage, useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/api/errors";

type Message = {
  _id: string;
  planType?: "WorkoutPlan" | "DietPlan" | null;
  systemContent?: string;
  userContent?: string;
  assistantContent?: string;
  rating?: number | null;
  model?: string | null;
  createdAt?: string | null;
};

type Plan = {
  _id: string;
  title?: string;
};

export function MessagesClient() {
  const t = useTranslations();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<Plan | null>(null);
  const [dietPlan, setDietPlan] = useState<Plan | null>(null);
  const [filter, setFilter] = useState<"all" | "workout" | "diet">("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const dateLocale = language === "pt-BR" ? "pt-BR" : language === "es" ? "es-ES" : "en-US";
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  const previewStyle = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden"
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return dateFormatter.format(date);
  };

  const formatPlanType = (value?: Message["planType"]) => {
    if (value === "WorkoutPlan") return t("messagePlanWorkout");
    if (value === "DietPlan") return t("messagePlanDiet");
    return t("messagePlanNone");
  };

  const loadMessages = async (planId?: string, planType?: "workout" | "diet") => {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (planId) {
      params.set("planId", planId);
    }
    if (planType) {
      params.set("planType", planType);
    }
    const res = await fetch(`/api/messages?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) {
      const errorMessage = getErrorMessage(data.error);
      const apiErrorKey = getApiErrorKey(errorMessage);
      throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorLoadMessages"));
    }
    setMessages(data.messages || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const planRes = await fetch("/api/plans/active");
        const planData = await planRes.json();
        if (planRes.ok) {
          setWorkoutPlan(planData.workoutPlan ?? null);
          setDietPlan(planData.dietPlan ?? null);
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
    const planId =
      filter === "workout" ? workoutPlan?._id : filter === "diet" ? dietPlan?._id : undefined;
    const planType = filter === "workout" ? "workout" : filter === "diet" ? "diet" : undefined;
    loadMessages(planId, planType).catch((err) =>
      setError(err.message ?? t("errorLoadMessages"))
    );
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
          planId:
            filter === "workout"
              ? workoutPlan?._id
              : filter === "diet"
              ? dietPlan?._id
              : undefined,
          planType: filter === "workout" ? "workout" : filter === "diet" ? "diet" : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getErrorMessage(data.error);
        const apiErrorKey = getApiErrorKey(errorMessage);
        throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorSendMessage"));
      }

      setMessages((prev) => [...(data.messages || []), ...prev]);
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
            onChange={(event) =>
              setFilter(event.target.value as "all" | "workout" | "diet")
            }
          >
            <option value="all">{t("filterAll")}</option>
            <option value="workout" disabled={!workoutPlan}>
              {t("filterWorkoutPlan")}
            </option>
            <option value="diet" disabled={!dietPlan}>
              {t("filterDietPlan")}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t("messageCreatedLabel")}</th>
                    <th className="px-3 py-2">{t("messagePlanTypeLabel")}</th>
                    <th className="px-3 py-2">{t("messageSystemLabel")}</th>
                    <th className="px-3 py-2">{t("messageUserLabel")}</th>
                    <th className="px-3 py-2">{t("messageAssistantLabel")}</th>
                    <th className="px-3 py-2">{t("messageRatingLabel")}</th>
                    <th className="px-3 py-2 text-right">{t("messageActionsLabel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message._id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {formatDate(message.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {formatPlanType(message.planType)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {message.systemContent ? (
                          <p style={previewStyle}>{message.systemContent}</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {message.userContent ? (
                          <p style={previewStyle}>{message.userContent}</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {message.assistantContent ? (
                          <p style={previewStyle}>{message.assistantContent}</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-600">
                        {typeof message.rating === "number" ? message.rating : "-"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setSelectedMessage(message)}
                        >
                          {t("messageViewDetails")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {selectedMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t("messageDetailsTitle")}
                </p>
                {selectedMessage.createdAt ? (
                  <p className="text-xs text-slate-500">
                    {formatDate(selectedMessage.createdAt)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                onClick={() => setSelectedMessage(null)}
              >
                {t("close")}
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-2 text-sm text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("messageSystemLabel")}
                </p>
                <p className="mt-2 whitespace-pre-wrap">
                  {selectedMessage.systemContent || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("messageUserLabel")}
                </p>
                <p className="mt-2 whitespace-pre-wrap">
                  {selectedMessage.userContent || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("messageAssistantLabel")}
                </p>
                <p className="mt-2 whitespace-pre-wrap">
                  {selectedMessage.assistantContent || "-"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setSelectedMessage(null)}>
                {t("close")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
