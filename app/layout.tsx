import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics } from "@next/third-parties/google";

const displayFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "TrainerAI",
  description: "Safe, beginner-friendly workout and diet plans."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen font-body">
        <div className="min-h-screen">
          <LanguageProvider>{children}</LanguageProvider>
        </div>
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        {gaId && isProd ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
