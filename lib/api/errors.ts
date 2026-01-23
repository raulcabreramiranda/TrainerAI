export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(code: string, message: string, status = 400, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export const getErrorMessage = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return null;
};

export const getErrorFields = (value: unknown): Record<string, string> | null => {
  if (!value || typeof value !== "object") return null;
  const fields = (value as { fields?: unknown }).fields;
  if (!fields || typeof fields !== "object") return null;
  const entries = Object.entries(fields as Record<string, unknown>).filter(
    ([, fieldValue]) => typeof fieldValue === "string"
  );
  if (!entries.length) return null;
  return Object.fromEntries(entries) as Record<string, string>;
};
