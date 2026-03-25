import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity, ArrowLeft, FileText, GitBranch, HeartPulse, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ familyId: string }> };

const linkMeta = [
  { href: "tree", t: "شجرة العائلة", d: "عرض تفاعلي مع بحث وتصدير", icon: GitBranch },
  { href: "members", t: "الأفراد", d: "قائمة وإضافة أفراد وعلاقات", icon: Users },
  { href: "requests", t: "طلبات التعديل", d: "مراجعة الموافقة والرفض", icon: Shield },
  { href: "audit-log", t: "سجل التدقيق", d: "من غيّر ماذا ومتى", icon: FileText },
  { href: "settings", t: "الإعدادات", d: "الخصوصية والرابط العام", icon: Settings },
] as const;

export default async function FamilyHubPage({ params }: Props) {
  const { familyId } = await params;
  const supabase = await createClient();
  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!family) notFound();

  const subtitle =
    family.description ?? family.place_of_origin ?? "مركز إدارة هذه العائلة في نسب.";

  // Stats
  const { data: members } = await supabase
    .from("family_members")
    .select("id, is_deceased")
    .eq("family_id", familyId)
    .is("deleted_at", null);

  const living = (members ?? []).filter((m) => !m.is_deceased).length;
  const deceased = (members ?? []).filter((m) => m.is_deceased).length;

  const totalMembers = members?.length ?? 0;

  const { data: relationships } = await supabase
    .from("parent_child_relationships")
    .select("id")
    .eq("family_id", familyId);

  const relationshipsCount = relationships?.length ?? 0;

  const { data: marriages } = await supabase
    .from("marriages")
    .select("id")
    .eq("family_id", familyId);

  const marriagesCount = marriages?.filter(Boolean).length ?? 0;

  const { count: pendingCount } = await supabase
    .from("edit_requests")
    .select("id", { count: "exact" })
    .eq("family_id", familyId)
    .eq("status", "pending");

  const { count: allRequestsCount } = await supabase
    .from("edit_requests")
    .select("id", { count: "exact" })
    .eq("family_id", familyId);

  const pendingRequests = pendingCount ?? 0;
  const allRequests = allRequestsCount ?? 0;

  const { data: recentAudit } = await supabase
    .from("audit_logs")
    .select("id, action, created_at")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "إجمالي الأفراد", value: totalMembers, icon: Users, className: "bg-primary/10 text-primary" },
          { label: "أحياء", value: living, icon: HeartPulse, className: "bg-primary/10 text-primary" },
          { label: "متوفون", value: deceased, icon: Activity, className: "bg-primary/10 text-muted-foreground" },
          {
            label: "طلبات معلّقة",
            value: pendingRequests,
            icon: Shield,
            className: "bg-primary/10 text-primary",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-border/70 bg-card/90 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={`flex size-9 items-center justify-center rounded-xl ${s.className}`}>
                <s.icon className="size-4" strokeWidth={1.75} aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold">مؤشرات العائلة</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground">عدد العلاقات الأبوية</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{relationshipsCount}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground">عدد الزيجات</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{marriagesCount}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground">حجم طلبات التعديل</p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {pendingRequests} معلّقة / {allRequests} إجمالي
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-semibold">آخر سجل التدقيق</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {recentAudit && recentAudit.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {recentAudit.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-mono text-xs text-foreground">{a.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ar")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                لا توجد أحداث بعد. أنشئ أفراداً داخل العائلة لبدء التتبع.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/12 via-card to-accent/20 p-6 shadow-sm sm:p-8 dark:from-primary/10 dark:via-card dark:to-primary/5">
        <PageHeader
          title={family.name}
          description={subtitle}
          className="border-0 pb-0"
          actions={
            <>
              <Button variant="outline" asChild className="rounded-xl border-border/80 bg-background/70">
                <Link href="/families">العائلات</Link>
              </Button>
              <Button asChild className="rounded-xl shadow-sm">
                <Link href={`/families/${familyId}/tree`} className="gap-2">
                  فتح الشجرة
                  <ArrowLeft className="size-4 opacity-80" aria-hidden />
                </Link>
              </Button>
            </>
          }
        />
      </section>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">الأقسام</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {linkMeta.map((l) => (
            <Link key={l.href} href={`/families/${familyId}/${l.href}`} className="group block">
              <Card className="h-full border-border/70 bg-card/90 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                <CardHeader className="gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <l.icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold transition-colors group-hover:text-primary">
                      {l.t}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{l.d}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
