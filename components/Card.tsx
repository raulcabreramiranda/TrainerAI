import type { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur fade-up">
      {children}
    </div>
  );
}
