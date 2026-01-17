import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
    secondary:
      "bg-white text-slate-900 border border-slate-300 hover:border-slate-400 focus-visible:outline-slate-500",
    ghost: "text-slate-600 hover:text-slate-900"
  };

  return (
    <button
      className={[base, variants[variant], className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
