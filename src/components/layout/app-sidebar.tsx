"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MemberSearch } from "@/components/families/member-search";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/layout/logo";

import type { FamilyMember } from "@/types";
import type { Database } from "@/types";

type MembershipRole = Database["public"]["Enums"]["membership_role"];

type SidebarFamily = {
  id: string;
  name: string;
  role: MembershipRole;
};

export function AppSidebar({
  sidebarOpen,
  onCloseSidebar,
}: {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const activeFamilyId = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "families" && parts[1]) return parts[1];
    return null;
  }, [pathname]);

  const { data: families = [] } = useQuery({
    queryKey: ["sidebar-families", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SidebarFamily[]> => {
      const supabase = createClient();

      const { data: memberships, error: membershipsError } = await supabase
        .from("family_memberships")
        .select("family_id, role")
        .eq("user_id", user!.id);

      if (membershipsError) throw membershipsError;

      const familyIds = (memberships ?? []).map((m) => m.family_id);
      if (!familyIds.length) return [];

      const { data: famRows, error: familiesError } = await supabase
        .from("families")
        .select("id, name")
        .in("id", familyIds)
        .is("deleted_at", null);

      if (familiesError) throw familiesError;

      const roleByFamilyId = new Map<string, MembershipRole>(
        (memberships ?? []).map((m) => [m.family_id, m.role])
      );

      return (famRows ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        role: roleByFamilyId.get(f.id) ?? "member",
      }));
    },
  });

  const activeFamily = useMemo(() => {
    if (!activeFamilyId) return null;
    return families.find((f) => f.id === activeFamilyId) ?? null;
  }, [activeFamilyId, families]);

  const { hasOwnerFamily, hasAdminFamily, hasMemberFamily } = useMemo(() => {
    const hasOwnerFamily = families.some((f) => f.role === "owner");
    const hasAdminFamily = families.some((f) => f.role === "admin");
    const hasMemberFamily = families.some((f) => f.role === "member");
    return { hasOwnerFamily, hasAdminFamily, hasMemberFamily };
  }, [families]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Avoid showing sidebar "actions" before auth finishes.
  const canRender = !loading && user;

  return (
    <aside
      className={`
        fixed top-0 right-0 z-50 h-full w-[min(280px,100vw)] max-w-[280px]
        glass border-l border-white/50 dark:border-slate-700/50 flex flex-col shadow-2xl shadow-primary-900/5 dark:shadow-black/50
        transform transition-transform duration-400 cubic-bezier(0.4, 0, 0.2, 1)
        lg:relative lg:translate-x-0 lg:shadow-none lg:bg-transparent lg:border-none lg:backdrop-blur-none lg:w-[280px] lg:max-w-none
        pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
        ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      dir="rtl"
    >
      <div className="flex flex-col h-full lg:p-4" dir="rtl">
        {/* Header inside sidebar */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:px-4 lg:py-6 glass-panel lg:glass-panel lg:mb-4 lg:flex-row lg:gap-3">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-3 group"
            onClick={() => onCloseSidebar()}
          >
            <Logo size="sm" iconClassName="w-4 h-4" />
            <span className="text-2xl font-black tracking-tight hidden sm:block">Nassab</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onCloseSidebar}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors lg:hidden shadow-sm"
              aria-label="إغلاق القائمة"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 lg:glass-panel lg:p-4 custom-scrollbar space-y-8 pb-8">
          {/* Main navigation */}
          <section className="space-y-2 mt-4">
            {canRender && activeFamily ? (
              <Link
                href={`/families/${activeFamily.id}/tree`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                  isActive(`/families/${activeFamily.id}/tree`)
                    ? "text-primary-700 dark:text-primary-400 bg-white/80 dark:bg-slate-800/80 shadow-md shadow-primary-500/10 dark:shadow-none border border-white dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-sm border border-transparent hover:border-white/50 dark:hover:border-slate-700/50"
                }`}
                onClick={onCloseSidebar}
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>شجرة عائلتي</span>
                {isActive(`/families/${activeFamily.id}/tree`) && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full" />
                )}
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                  isActive("/dashboard")
                    ? "text-primary-700 dark:text-primary-400 bg-white/80 dark:bg-slate-800/80 shadow-md shadow-primary-500/10 dark:shadow-none border border-white dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-sm border border-transparent hover:border-white/50 dark:hover:border-slate-700/50"
                }`}
                onClick={onCloseSidebar}
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span>لوحة التحكم</span>
                {isActive("/dashboard") && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full" />
                )}
              </Link>
            )}
          </section>

          {/* Families */}
          <section>
            <h3 className="px-4 mb-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              إدارة العائلات
            </h3>

            {canRender && !(hasOwnerFamily || hasAdminFamily) && (
              <Link
                href="/families/new"
                className="flex items-center gap-3 mx-3 mb-3 px-4 py-3 rounded-2xl text-sm font-bold bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-400 transition-all duration-300"
                onClick={onCloseSidebar}
              >
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span>إنشاء عائلة جديدة</span>
              </Link>
            )}

            {families.length > 0 ? (
              <ul className="space-y-1 mt-2">
                {families.map((family) => {
                  const treeHref = `/families/${family.id}/tree`;
                  const isFamilyActive = isActive(treeHref);
                  return (
                    <li key={family.id} className="space-y-1">
                      <Link
                        href={treeHref}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden ${
                          isFamilyActive
                            ? "text-primary-700 dark:text-primary-400 bg-white/80 dark:bg-slate-800/80 shadow-md shadow-primary-500/10 dark:shadow-none border border-white dark:border-slate-700"
                            : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400 hover:shadow-sm border border-transparent hover:border-white/50 dark:hover:border-slate-700/50"
                        }`}
                        onClick={onCloseSidebar}
                      >
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <span className="flex-1 truncate">{family.name}</span>
                        {family.role === "owner" && (
                          <span className="shrink-0 flex h-2.5 w-2.5 relative" title="صاحب العائلة">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                          </span>
                        )}
                        {family.role === "admin" && (
                          <span className="shrink-0 flex h-2.5 w-2.5 relative" title="مدير">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                          </span>
                        )}
                        {isFamilyActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full" />
                        )}
                      </Link>

                      {(family.role === "owner" || family.role === "admin") && (
                        <Link
                          href={`/families/${family.id}`}
                          className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                          onClick={onCloseSidebar}
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <span>إحصائيات والسجل الطبي</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mx-2 p-4 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/20 flex items-center justify-center">
                <p className="text-xs font-bold text-primary dark:text-primary-foreground">لا تنتمي لأي عائلة حالياً</p>
              </div>
            )}
          </section>

          {/* Quick actions (member search inside active family) */}
          {canRender && activeFamily ? (
            <section className="px-1">
              <h3 className="px-3 mb-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                بحث سريع
              </h3>
              <MemberSearch
                familyId={activeFamily.id}
                onSelect={(m: FamilyMember) => {
                  onCloseSidebar();
                  router.push(`/families/${activeFamily.id}/members/${m.id}`);
                }}
              />
            </section>
          ) : null}

          {/* Edit Requests (link to requests page for active family) */}
          {canRender && activeFamily && hasMemberFamily ? (
            <section>
              <h3 className="px-4 mb-3 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                المراجعات
              </h3>
              <Link
                href={`/families/${activeFamily.id}/requests`}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                onClick={onCloseSidebar}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>طلبات التعديل</span>
              </Link>
            </section>
          ) : null}
        </nav>

        {/* Footer actions */}
        {canRender ? (
          <div className="mt-auto p-4 lg:glass-panel lg:mt-4 lg:mx-4">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary dark:text-primary-foreground mb-3 px-2 text-center" title="بياناتك محمية">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v2h4z"
                />
              </svg>
              تنويه: كل شيء آمن ومحمي وخاص
            </p>

            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
            >
              <LogOut className="size-4 opacity-70" aria-hidden />
              تسجيل الخروج
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

