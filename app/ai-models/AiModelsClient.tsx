"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";

type AiModel = {
  _id: string;
  name: string;
  type: string;
  enabled: boolean;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
};

type EditValues = {
  name: string;
  type: string;
  enabled: boolean;
};

export function AiModelsClient() {
  const t = useTranslations();
  const [models, setModels] = useState<AiModel[]>([]);
  const [editValues, setEditValues] = useState<Record<string, EditValues>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("GEMINI");
  const [newEnabled, setNewEnabled] = useState(true);

  const loadModels = async () => {
    const res = await fetch("/api/ai-models");
    const data = await res.json();
    if (!res.ok) {
      const apiErrorKey = getApiErrorKey(data.error);
      throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorLoadAiModels"));
    }
    setModels(data.models || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadModels();
      } catch (err: any) {
        setError(err.message ?? t("errorLoadAiModels"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const nextValues: Record<string, EditValues> = {};
    models.forEach((model) => {
      nextValues[model._id] = {
        name: model.name,
        type: model.type || "GEMINI",
        enabled: model.enabled !== false
      };
    });
    setEditValues(nextValues);
  }, [models]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = newName.trim();
    if (!trimmed) {
      setError(t("errorModelNameRequired"));
      return;
    }

    try {
      const res = await fetch("/api/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, type: newType, enabled: newEnabled })
      });
      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorSaveAiModels"));
      }

      setNewName("");
      setNewType("GEMINI");
      setNewEnabled(true);
      await loadModels();
    } catch (err: any) {
      setError(err.message ?? t("errorSaveAiModels"));
    }
  };

  const onUpdate = async (id: string) => {
    const values = editValues[id];
    if (!values) return;
    const trimmed = values.name.trim();
    if (!trimmed) {
      setError(t("errorModelNameRequired"));
      return;
    }

    setSavingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/ai-models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          type: values.type,
          enabled: values.enabled
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorSaveAiModels"));
      }

      await loadModels();
    } catch (err: any) {
      setError(err.message ?? t("errorSaveAiModels"));
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ai-models/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const apiErrorKey = getApiErrorKey(data.error);
        throw new Error(apiErrorKey ? t(apiErrorKey) : t("errorDeleteAiModels"));
      }
      await loadModels();
    } catch (err: any) {
      setError(err.message ?? t("errorDeleteAiModels"));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{t("loadingAiModels")}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <form className="space-y-4" onSubmit={onCreate}>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">{t("aiModelNameLabel")}</span>
              <input
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="gemini-1.5-flash"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">{t("aiModelTypeLabel")}</span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={newType}
                onChange={(event) => setNewType(event.target.value)}
              >
                <option value="GEMINI">{t("aiModelTypeGemini")}</option>
                <option value="OPENROUTER">{t("aiModelTypeOpenRouter")}</option>
                <option value="MISTRAL">{t("aiModelTypeMistral")}</option>
                <option value="GROQ">{t("aiModelTypeGroq")}</option>
                <option value="CEREBRAS">{t("aiModelTypeCerebras")}</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">
              <span className="font-semibold text-slate-800">{t("aiModelEnabledLabel")}</span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                value={newEnabled ? "enabled" : "disabled"}
                onChange={(event) => setNewEnabled(event.target.value === "enabled")}
              >
                <option value="enabled">{t("aiModelEnabledOn")}</option>
                <option value="disabled">{t("aiModelEnabledOff")}</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                {t("addAiModel")}
              </Button>
            </div>
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          ) : null}
        </form>
      </Card>

      <Card>
        <div className="space-y-4">
          {models.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noAiModels")}</p>
          ) : (
            models.map((model) => {
              const values = editValues[model._id] ?? {
                name: model.name,
                type: model.type || "GEMINI",
                enabled: model.enabled !== false
              };
              return (
                <div
                  key={model._id}
                  className="grid gap-4 rounded-2xl border border-slate-100 bg-white/70 p-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                >
                  <label className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">{t("aiModelNameLabel")}</span>
                    <input
                      type="text"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                      value={values.name}
                      onChange={(event) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [model._id]: { ...values, name: event.target.value }
                        }))
                      }
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">{t("aiModelTypeLabel")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                      value={values.type}
                      onChange={(event) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [model._id]: { ...values, type: event.target.value }
                        }))
                      }
                    >
                      <option value="GEMINI">{t("aiModelTypeGemini")}</option>
                      <option value="OPENROUTER">{t("aiModelTypeOpenRouter")}</option>
                      <option value="MISTRAL">{t("aiModelTypeMistral")}</option>
                      <option value="GROQ">{t("aiModelTypeGroq")}</option>
                      <option value="CEREBRAS">{t("aiModelTypeCerebras")}</option>
                    </select>
                  </label>
                  <label className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">{t("aiModelEnabledLabel")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                      value={values.enabled ? "enabled" : "disabled"}
                      onChange={(event) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [model._id]: {
                            ...values,
                            enabled: event.target.value === "enabled"
                          }
                        }))
                      }
                    >
                      <option value="enabled">{t("aiModelEnabledOn")}</option>
                      <option value="disabled">{t("aiModelEnabledOff")}</option>
                    </select>
                  </label>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">{t("aiModelUsageLabel")}</span>{" "}
                    {model.usageCount}
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <Button
                      type="button"
                      onClick={() => onUpdate(model._id)}
                      disabled={savingId === model._id}
                    >
                      {savingId === model._id ? t("saving") : t("save")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => onDelete(model._id)}
                      disabled={deletingId === model._id}
                    >
                      {deletingId === model._id ? t("deleting") : t("delete")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
