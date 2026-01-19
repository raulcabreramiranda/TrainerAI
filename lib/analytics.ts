"use client";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const IS_PROD = process.env.NODE_ENV === "production";
const CAN_TRACK = Boolean(GA_ID && IS_PROD);

const pushGtag = (...args: any[]) => {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
};

export const trackPageView = (url: string) => {
  if (!CAN_TRACK || !GA_ID) return;
  pushGtag("config", GA_ID, { page_path: url });
};

export const sendGAEvent = (action: string, params?: Record<string, unknown>) => {
  if (!CAN_TRACK) return;
  pushGtag("event", action, params ?? {});
};
