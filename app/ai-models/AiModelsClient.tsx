"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTranslations } from "@/components/LanguageProvider";
import { getApiErrorKey } from "@/lib/i18n";
import { getErrorMessage } from "@/lib/api/errors";

type AiModel = {
  _id: string;
  name: string;
  type: string;
  enabled: boolean;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export function AiModelsClient() {
  const t = useTranslations();
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("GEMINI");
  const [newEnabled, setNewEnabled] = useState(true);

  const loadModels = async () => {
    const res = await fetch("/api/ai-models");
    const data = await res.json();
    if (!res.ok) {
      const errorMessage = getErrorMessage(data.error);
      const apiErrorKey = getApiErrorKey(errorMessage);
      throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorLoadAiModels"));
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
        const errorMessage = getErrorMessage(data.error);
        const apiErrorKey = getApiErrorKey(errorMessage);
        throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorSaveAiModels"));
      }

      setNewName("");
      setNewType("GEMINI");
      setNewEnabled(true);
      await loadModels();
    } catch (err: any) {
      setError(err.message ?? t("errorSaveAiModels"));
    }
  };

  const onToggle = async (id: string, enabled: boolean) => {
    setSavingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/ai-models/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMessage = getErrorMessage(data.error);
        const apiErrorKey = getApiErrorKey(errorMessage);
        throw new Error(apiErrorKey ? t(apiErrorKey) : errorMessage ?? t("errorSaveAiModels"));
      }

      await loadModels();
    } catch (err: any) {
      setError(err.message ?? t("errorSaveAiModels"));
    } finally {
      setSavingId(null);
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">{t("aiModelNameLabel")}</th>
                    <th className="px-3 py-2">{t("aiModelTypeLabel")}</th>
                    <th className="px-3 py-2">{t("aiModelUsageLabel")}</th>
                    <th className="px-3 py-2">{t("aiModelEnabledLabel")}</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => {
                    const enabled = model.enabled !== false;
                    return (
                      <tr key={model._id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-3 font-semibold text-slate-900">{model.name}</td>
                        <td className="px-3 py-3">{model.type || "GEMINI"}</td>
                        <td className="px-3 py-3">{model.usageCount}</td>
                        <td className="px-3 py-3">
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <span className="sr-only">{t("aiModelEnabledLabel")}</span>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={enabled}
                              onChange={() => onToggle(model._id, !enabled)}
                              disabled={savingId === model._id}
                            />
                            <span className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500 peer-disabled:opacity-60">
                              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                            </span>
                            <span className="font-semibold text-slate-700">
                              {enabled ? t("aiModelEnabledOn") : t("aiModelEnabledOff")}
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
