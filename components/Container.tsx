import type { PropsWithChildren } from "react";

export function Container({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      {children}
    </div>
  );
}
