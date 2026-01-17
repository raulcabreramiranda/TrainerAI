export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export function clampNumber(value: number | undefined, min: number, max: number) {
  if (value === undefined) {
    return undefined;
  }
  return Math.min(Math.max(value, min), max);
}

export function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const filtered = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return filtered.length ? filtered : [];
}
