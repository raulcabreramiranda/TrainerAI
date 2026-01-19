import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DM_Serif_Display, Space_Grotesk } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { Analytics } from "@/components/Analytics";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

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
  title: "TrainerAI – AI powered workouts, meals, and session tracking",
  description:
    "TrainerAI generates safe, beginner-friendly workout plans, simple diet ideas, and an easy session log powered by AI.",
  metadataBase: new URL("https://trainer-ai.com.br"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "TrainerAI – AI powered workouts, meals, and session tracking",
    description:
      "Create personalized workouts, diet suggestions, and track your sessions in one place.",
    url: "https://trainer-ai.com.br/",
    siteName: "TrainerAI",
    type: "website",
    images: [
      {
        url: "/landing/hero.png",
        width: 1200,
        height: 630,
        alt: "TrainerAI – AI workouts, diet, and session tracking"
      }
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
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
        {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      </body>
    </html>
  );
}
