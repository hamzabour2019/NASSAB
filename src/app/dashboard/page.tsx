import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Activity, Clock, HeartPulse, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: families } = await supabase
    .from("families")
    .select("id, name")
    .is("deleted_at", null);

  const familyIds = (families ?? []).map((f) => f.id);
  let totalMembers = 0;
  let living = 0;
  let deceased = 0;
  let pendingRequests = 0;

  if (familyIds.length) {
    const { data: members } = await supabase
      .from("family_members")
      .select("is_deceased")
      .in("family_id", familyIds)
      .is("deleted_at", null);
    totalMembers = members?.length ?? 0;
    living = members?.filter((m) => !m.is_deceased).length ?? 0;
    deceased = members?.filter((m) => m.is_deceased).length ?? 0;

    const { count } = await supabase
      .from("edit_requests")
      .select("id", { count: "exact", head: true })
      .in("family_id", familyIds)
      .eq("status", "pending");
    pendingRequests = count ?? 0;
  }

  let auditRows: { id: string; action: string; created_at: string; family_id: string | null }[] = [];
  if (familyIds.length) {
    const { data: recentAudit } = await supabase
      .from("audit_logs")
      .select("id, action, created_at, family_id")
      .in("family_id", familyIds)
      .order("created_at", { ascending: false })
      .limit(8);
    auditRows = recentAudit ?? [];
  }

  const stats = [
    {
      label: "إجمالي الأفراد",
      value: totalMembers,
      icon: Users,
      className: "bg-primary/10 text-primary",
    },
    {
      label: "أحياء",
      value: living,
      icon: HeartPulse,
      className: "bg-primary/10 text-primary",
    },
    {
      label: "متوفون",
      value: deceased,
      icon: Activity,
      className: "bg-primary/10 text-muted-foreground",
    },
    {
      label: "طلبات معلّقة",
      value: pendingRequests,
      icon: Clock,
      className: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        title="لوحة التحكم"
        description="نظرة سريعة على أفراد عائلاتك والطلبات والنشاط الأخير."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl border-border/80 shadow-none">
              <Link href="/families">كل العائلات</Link>
            </Button>
            <Button asChild className="rounded-xl shadow-sm">
              <Link href="/families/new">عائلة جديدة</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
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

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">آخر سجل التدقيق</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {auditRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أحداث بعد. أنشئ عائلة وأضف أفراداً لبدء التتبع.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {auditRows.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-xs text-foreground">{a.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("ar")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
