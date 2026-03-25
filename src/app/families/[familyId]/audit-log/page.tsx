import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ familyId: string }> };

export default async function AuditLogPage({ params }: Props) {
  const { familyId } = await params;
  const supabase = await createClient();
  const { data: family } = await supabase.from("families").select("id, name").eq("id", familyId).maybeSingle();
  if (!family) notFound();

  const { data: rows } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })
    .range(0, 99);

  return (
    <div className="space-y-10">
      <PageHeader
        title="سجل التدقيق"
        description={`${family.name} — آخر 100 حدث مسجّل`}
        actions={
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}`}>رجوع</Link>
          </Button>
        }
      />
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">الأحداث</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-semibold">الإجراء</TableHead>
                  <TableHead className="font-semibold">النوع</TableHead>
                  <TableHead className="font-semibold">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows ?? []).map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell className="font-mono text-xs">{r.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.entity_type ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("ar")}
                    </TableCell>
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
