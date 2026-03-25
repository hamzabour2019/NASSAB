import { AppProviders } from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { readSupabasePublicEnv } from "@/lib/supabase/env-public";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const cairoArabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نسب — Nassab",
  description: "منصة عربية لتوثيق وإدارة شجرة العائلة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabasePublic = readSupabasePublicEnv();

  return (
    <html lang="ar" dir="rtl" className={cairoArabic.variable} suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background text-foreground ${cairoArabic.className}`}
        suppressHydrationWarning
      >
        {supabasePublic ? (
          <Script id="nassab-supabase-env" strategy="beforeInteractive">
            {`window.__NASSAB_SUPABASE__=${JSON.stringify({
              url: supabasePublic.url,
              anonKey: supabasePublic.anonKey,
            })};`}
          </Script>
        ) : null}
        <div className="page-bg" aria-hidden />
        <AppProviders supabasePublic={supabasePublic}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
