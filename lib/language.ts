export type AppLanguage = "en" | "es" | "pt-BR";

export const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "es", "pt-BR"];

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (value === "es" || value === "pt-BR") {
    return value;
  }
  return "en";
}

export function languageInstruction(language: AppLanguage) {
  if (language === "es") {
    return "Respond in Spanish.";
  }
  if (language === "pt-BR") {
    return "Respond in Portuguese (Brazil).";
  }
  return "Respond in English.";
}
