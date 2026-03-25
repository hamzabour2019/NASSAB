"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Search,
  Shield,
  TreePine,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";

type FamilyResult = {
  id: string;
  family_name: string;
  origin_city?: string | null;
  slug: string;
};

type SearchResults = {
  persons: unknown[];
  families: FamilyResult[];
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");

  const features = useMemo(
    () => [
      { icon: TreePine, title: "شجرة تفاعلية", desc: "بناء ومشاهدة شجرة العائلة بشكل تفاعلي" },
      { icon: Shield, title: "بيانات آمنة", desc: "جميع بياناتك محفوظة ومحمية بشكل كامل" },
      { icon: Globe, title: "بحث شامل", desc: "ابحث عن اي شخص أو عائلة بسهولة" },
    ],
    []
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoadingSearch(true);
    setSearchError("");
    setResults(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_public_family", { p_slug: q });
      if (error) throw error;
      if (!data) {
        setSearchError("لا توجد عائلة عامة بهذا الـ slug أو أنها غير مفعّلة.");
        setResults({ persons: [], families: [] });
        return;
      }

      const payload = data as {
        family: { id: string; name: string; place_of_origin?: string | null };
        members: Array<{ id: string }>;
      };

      setResults({
        persons: [],
        families: [
          {
            id: payload.family.id,
            family_name: payload.family.name,
            origin_city: payload.family.place_of_origin ?? null,
            slug: q,
          },
        ],
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : undefined;
      setSearchError(message ?? "يوجد خطأ. يرجى المحاولة لاحقاً.");
      setResults({ persons: [], families: [] });
    } finally {
      setLoadingSearch(false);
    }
  }

  // إذا المستخدم مسجل دخول وفتح landing ('/') بالرجوع/الرابط:
  // حوّله مباشرة للداش بورد.
  useEffect(() => {
    if (loading) return;
    if (user && pathname === "/") {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-500 bg-background text-foreground"
      dir="rtl"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-primary-500/30 dark:bg-primary-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-40 dark:opacity-20 animate-blob" />
        <div
          className="absolute top-[30%] right-[-15%] w-[600px] h-[600px] bg-primary-300/35 dark:bg-primary-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-15 animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-primary-200/35 dark:bg-primary-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[140px] opacity-30 dark:opacity-15 animate-blob"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute top-[60%] left-[60%] w-[300px] h-[300px] bg-primary-500/10 dark:bg-primary-600/10 rounded-full blur-[100px] animate-blob"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 sm:py-4 gap-2 backdrop-blur-xl bg-white/60 dark:bg-black/70 border-b border-white/30 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Logo size="sm" iconClassName="w-4 h-4" className="shrink-0" />
          <span className="text-lg sm:text-2xl font-black text-primary tracking-tight truncate">
            Nassab
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          {loading ? null : user ? (
            <Link
              href="/dashboard"
              className="inline-flex py-2 px-3 sm:py-2.5 sm:px-6 text-xs sm:text-sm shadow-md min-h-[44px] items-center gap-1.5 rounded-2xl bg-primary text-primary-foreground font-semibold transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex py-2 px-3 sm:py-2.5 sm:px-6 text-xs sm:text-sm shadow-md min-h-[44px] items-center rounded-2xl bg-primary text-primary-foreground font-semibold transition-all duration-300"
            >
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 sm:px-6 md:px-10 py-10 sm:py-16">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-3 mb-6 sm:mb-8 px-5 py-2.5 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/15 shadow-lg animate-fade-in">
            <Logo size="sm" iconClassName="w-4 h-4" />
            <span className="text-sm sm:text-base font-bold text-primary">
              منصة شجرة العائلة
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 sm:mb-6 leading-[1.35] animate-slide-up">
            <span className="block text-foreground">وثّق تاريخ عائلتك</span>
            <span className="block text-primary mt-1 sm:mt-2 pb-3">
              وابنِ شجرتك الآن
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            ابحث عن عائلتك، سجّل دخولك وابدأ ببناء شجرة عائلتك. جميع البيانات محفوظة بأمان.
          </p>

          {/* Search Bar */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن شخص أو عائلة..."
                  className="w-full pr-12 pl-4 py-4 sm:py-5 bg-background/80 backdrop-blur-xl border border-border/80 rounded-2xl text-base md:text-lg font-medium placeholder-muted-foreground/90 text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary shadow-xl shadow-primary/5 transition-all duration-300 min-h-[48px]"
                />
              </div>
              <button
                type="submit"
                disabled={loadingSearch}
                className="shrink-0 flex items-center justify-center gap-2 px-6 py-4 sm:px-8 sm:py-5 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 disabled:opacity-70 min-h-[48px] transform hover:-translate-y-0.5 active:scale-95"
              >
                {loadingSearch ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    بحث
                  </span>
                ) : (
                  <>
                    <Search className="w-5 h-5" strokeWidth={2} />
                    <span>بحث</span>
                  </>
                )}
              </button>
            </form>

            {searchError && (
              <div className="mt-4 max-w-2xl mx-auto rounded-xl bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 p-4 animate-fade-in">
                <p className="text-sm font-bold text-red-800 dark:text-red-200 text-center">{searchError}</p>
              </div>
            )}
          </div>

          {/* CTA for non-logged-in users */}
          {!loading && !user && (
            <div className="mt-6 sm:mt-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <p className="text-sm text-muted-foreground mb-3">أو</p>
              <Link
                href="/login?next=/dashboard"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 sm:py-3.5 sm:px-10 text-base font-bold shadow-xl shadow-primary/20 hover:shadow-primary/35 rounded-2xl min-h-[48px] bg-primary text-primary-foreground transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                ابدأ ببناء شجرتك
              </Link>
            </div>
          )}

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 sm:mt-16 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-5 sm:p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/15 dark:bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results */}
      {results && results.families.length > 0 && (
        <section className="relative z-10 px-4 sm:px-6 md:px-10 pb-8 sm:pb-12 max-w-6xl mx-auto space-y-8 sm:space-y-10 animate-slide-up">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
                <TreePine className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                نتائج العائلات
                <span className="text-sm font-bold text-muted-foreground mr-2 bg-muted px-3 py-1 rounded-full">
                  {results.families.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.families.map((family) => (
                <div
                  key={family.id}
                  className="glass-panel group hover:border-primary-300 dark:hover:border-primary-500/50 transition-all duration-300 p-6 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-900/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <TreePine className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-foreground mb-1">{family.family_name}</h3>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        🌍 الأصل: {family.origin_city || "غير محدد"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/public/family/${family.slug}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-black/50 hover:bg-white/70 dark:hover:bg-white/10 transition-colors duration-200 text-sm font-bold text-foreground"
                        >
                          <Globe className="w-4 h-4" strokeWidth={1.5} />
                          عرض الشجرة العامة
                        </Link>
                        <Link
                          href="/login?next=/dashboard"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm transition-all duration-200"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          ادخل للداشبورد
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
