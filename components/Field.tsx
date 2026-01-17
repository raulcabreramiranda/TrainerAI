import type { PropsWithChildren } from "react";

type FieldProps = PropsWithChildren & {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
};

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
