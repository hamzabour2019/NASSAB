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
      <div
        className="relative min-h-dvh overflow-x-hidden font-sans transition-colors duration-500"
        dir="rtl"
      >
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
    return (
      <main className="mx-auto w-full max-w-3xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    );
  }

  return (
    <div
      className="relative flex min-h-dvh w-full max-w-[100vw] flex-col overflow-x-hidden font-sans transition-colors duration-500 lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden"
      dir="rtl"
    >
      {/* خلفية — لا تشغل صفاً بجانب المحتوى */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-blob rounded-full bg-primary-300 opacity-50 mix-blend-multiply filter blur-[100px] dark:bg-primary-900 dark:opacity-20 dark:mix-blend-screen" />
        <div className="animation-delay-2000 absolute top-[20%] right-[-10%] h-[50%] w-[50%] animate-blob rounded-full bg-teal-200 opacity-40 mix-blend-multiply filter blur-[100px] dark:bg-teal-900 dark:opacity-20 dark:mix-blend-screen" />
        <div className="animation-delay-4000 absolute bottom-[-20%] left-[20%] h-[60%] w-[60%] animate-blob rounded-full bg-primary-200 opacity-40 mix-blend-multiply filter blur-[120px] dark:bg-primary-900/40 dark:opacity-20 dark:mix-blend-screen" />
      </div>

      {/* شريط علوي للموبايل + تنبيه (فوق المحتوى وليس بجانبه) */}
      <div className="relative z-40 shrink-0 lg:hidden">
        <header className="sticky top-0 flex h-14 items-center justify-between border-b border-white/40 bg-white/70 px-3 shadow-sm backdrop-blur-md transition-colors duration-500 sm:h-16 sm:px-4 dark:border-slate-700/50 dark:bg-slate-900/75 pt-[env(safe-area-inset-top)]">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-xl bg-white/40 p-2 shadow-sm transition-colors hover:bg-white/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
              aria-label="فتح القائمة"
            >
              <svg className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2.5 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo size="sm" iconClassName="w-4 h-4 shrink-0" />
              <span className="truncate text-lg font-bold">Nassab</span>
            </Link>
          </div>
        </header>
        {supabaseMisconfigured ? (
          <div className="border-b border-primary/40 bg-primary/15 px-3 py-2 text-center text-[11px] font-medium text-primary-foreground sm:text-xs">
            إعدادات Supabase غير مكتملة: أنشئ ملف <code className="rounded bg-background/50 px-1">.env.local</code> مع{" "}
            <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
            <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد تشغيل{" "}
            <code className="rounded bg-background/50 px-1">npm run dev</code>.
          </div>
        ) : null}
      </div>

      {/* سطح المكتب: شريط جانبي + منطقة تمرير؛ الموبايل: المحتوى بعرض كامل والقائمة fixed */}
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        ) : null}
        <AppSidebar sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {supabaseMisconfigured ? (
            <div className="hidden border-b border-primary/40 bg-primary/15 px-4 py-2 text-center text-xs font-medium text-primary-foreground lg:block">
              إعدادات Supabase غير مكتملة: أنشئ ملف <code className="rounded bg-background/50 px-1">.env.local</code> مع{" "}
              <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
              <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد تشغيل{" "}
              <code className="rounded bg-background/50 px-1">npm run dev</code>.
            </div>
          ) : null}
          <main className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

