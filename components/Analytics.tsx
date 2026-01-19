"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString();

  useEffect(() => {
    if (!pathname) return;
    const url = search ? `${pathname}?${search}` : pathname;
    trackPageView(url);
  }, [pathname, search]);

  return null;
}
