import { PageHeader } from "@/components/layout/page-header";
import { RequestReviewRow } from "./review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ familyId: string }> };

export default async function RequestsPage({ params }: Props) {
  const { familyId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: family } = await supabase.from("families").select("id, name").eq("id", familyId).maybeSingle();
  if (!family) notFound();

  const { data: membership } = await supabase
    .from("family_memberships")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const { data: fam } = await supabase.from("families").select("owner_id").eq("id", familyId).single();

  const canReview =
    membership?.role === "owner" ||
    membership?.role === "admin" ||
    fam?.owner_id === user?.id;

  const { data: rows } = await supabase
    .from("edit_requests")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <PageHeader
        title="طلبات التعديل"
        description={family.name}
        actions={
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}`}>رجوع</Link>
          </Button>
        }
      />
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">القائمة</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-semibold">النوع</TableHead>
                  <TableHead className="font-semibold">الحالة</TableHead>
                  <TableHead className="font-semibold">التاريخ</TableHead>
                  {canReview && <TableHead className="min-w-[220px] font-semibold">إجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell className="font-mono text-xs">{r.request_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status === "pending" ? "secondary" : "outline"}
                        className="rounded-full font-normal"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("ar")}
                    </TableCell>
                    {canReview && (
                      <TableCell className="align-top">
                        {r.status === "pending" ? (
                          <RequestReviewRow familyId={familyId} requestId={r.id} />
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.reviewer_note ?? "—"}</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
