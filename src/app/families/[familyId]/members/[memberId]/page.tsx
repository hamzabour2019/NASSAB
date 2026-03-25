import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberEditRequestForm } from "./request-form";

type Props = { params: Promise<{ familyId: string; memberId: string }> };

export default async function MemberDetailPage({ params }: Props) {
  const { familyId, memberId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: member } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", memberId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (!member) notFound();

  const { data: membership } = await supabase
    .from("family_memberships")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const { data: fam } = await supabase.from("families").select("owner_id").eq("id", familyId).single();

  const canEditDirect =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    fam?.owner_id === user?.id;

  return (
    <div className="space-y-10">
      <PageHeader
        title={member.full_name}
        description="تفاصيل الفرد والطلبات"
        actions={
          <>
            <Button variant="outline" asChild className="rounded-xl border-border/80">
              <Link href={`/families/${familyId}/members`}>القائمة</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl border-border/80">
              <Link href={`/families/${familyId}/tree`}>الشجرة</Link>
            </Button>
          </>
        }
      />

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold">البيانات</CardTitle>
            <span
              className={
                member.is_deceased
                  ? "rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  : "rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary"
              }
            >
              {member.is_deceased ? "متوفى" : "على قيد الحياة"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm leading-relaxed">
          {member.date_of_birth && (
            <p>
              <span className="text-muted-foreground">تاريخ الميلاد: </span>
              {member.date_of_birth}
            </p>
          )}
          {member.occupation && (
            <p>
              <span className="text-muted-foreground">المهنة: </span>
              {member.occupation}
            </p>
          )}
          {member.biography && (
            <div>
              <p className="text-muted-foreground">نبذة</p>
              <p className="mt-1 whitespace-pre-wrap">{member.biography}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {!canEditDirect && user && (
        <MemberEditRequestForm familyId={familyId} memberId={memberId} />
      )}

      {canEditDirect && (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          كمالك أو مسؤول يمكنك تعديل البيانات مباشرة من لوحة Supabase أو عبر توسيع التطبيق لنماذج التحرير
          المباشر.
        </p>
      )}
    </div>
  );
}
