import { AppProviders } from "@/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
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
  return (
    <html lang="ar" dir="rtl" className={cairoArabic.variable} suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background text-foreground ${cairoArabic.className}`}
        suppressHydrationWarning
      >
        <div className="page-bg" aria-hidden />
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
