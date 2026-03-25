"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { AppSidebar } from "./app-sidebar";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, supabaseMisconfigured } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (loading) {
    return <div className="min-h-screen" />;
  }

  const isLandingPage = pathname === "/";

  // Landing page: show top navbar (instead of right sidebar)
  if (isLandingPage) {
    return (
      <div className="min-h-screen transition-colors duration-500 relative overflow-hidden font-sans" dir="rtl">
        <style>{`body > .page-bg { display: none !important; }`}</style>
        {supabaseMisconfigured ? (
          <div className="border-b border-primary/40 bg-primary/15 px-4 py-2 text-center text-xs font-medium text-primary-foreground">
            إعدادات Supabase غير مكتملة: أنشئ ملف <code className="rounded bg-background/50 px-1">.env.local</code> مع{" "}
            <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
            <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد تشغيل{" "}
            <code className="rounded bg-background/50 px-1">npm run dev</code>.
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  // Login/Register pages (public) + auth-less renders: no sidebar.
  if (!user) {
    return <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>;
  }

  return (
    <div className="min-h-screen transition-colors duration-500 flex relative overflow-hidden font-sans" dir="rtl">
      {/* Premium background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-300 dark:bg-primary-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50 dark:opacity-20 animate-blob pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-teal-200 dark:bg-teal-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 dark:opacity-20 animate-blob animation-delay-2000 pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-primary-200 dark:bg-primary-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-40 dark:opacity-20 animate-blob animation-delay-4000 pointer-events-none z-0" />

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 glass border-b border-white/40 dark:border-slate-700/50 lg:hidden shadow-sm backdrop-blur-md transition-colors duration-500 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors shadow-sm bg-white/40 dark:bg-slate-800/40"
            aria-label="فتح القائمة"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo size="sm" iconClassName="w-4 h-4" />
            <span className="text-lg font-bold">Nassab</span>
          </Link>
        </div>
      </header>

      {/* Supabase misconfigured banner (mobile + desktop) */}
      {supabaseMisconfigured ? (
        <div className="border-b border-primary/40 bg-primary/15 px-4 py-2 text-center text-xs font-medium text-primary-foreground lg:hidden">
          إعدادات Supabase غير مكتملة: أنشئ ملف <code className="rounded bg-background/50 px-1">.env.local</code> مع{" "}
          <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
          <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد تشغيل{" "}
          <code className="rounded bg-background/50 px-1">npm run dev</code>.
        </div>
      ) : null}

      {/* Sidebar */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <AppSidebar sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 animate-fade-in custom-scrollbar overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

