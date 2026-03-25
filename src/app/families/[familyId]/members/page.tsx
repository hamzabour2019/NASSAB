import { AddMemberForm } from "@/components/families/add-member-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ familyId: string }> };

export default async function MembersPage({ params }: Props) {
  const { familyId } = await params;
  const supabase = await createClient();
  const { data: family } = await supabase
    .from("families")
    .select("id, name")
    .eq("id", familyId)
    .maybeSingle();
  if (!family) notFound();

  const { data: members } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId)
    .is("deleted_at", null)
    .order("full_name");

  const { data: options } = await supabase
    .from("family_members")
    .select("id, full_name")
    .eq("family_id", familyId)
    .is("deleted_at", null);

  return (
    <div className="space-y-10">
      <PageHeader
        title="أفراد العائلة"
        description={family.name}
        actions={
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}`}>مركز العائلة</Link>
          </Button>
        }
      />

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">إضافة فرد</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <AddMemberForm familyId={familyId} options={options ?? []} />
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">القائمة</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-semibold">الاسم</TableHead>
                  <TableHead className="font-semibold">الحالة</TableHead>
                  <TableHead className="w-[100px] font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(members ?? []).map((m) => (
                  <TableRow key={m.id} className="border-border/50">
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell>
                      <span
                        className={
                          m.is_deceased
                            ? "rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                            : "rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary"
                        }
                      >
                        {m.is_deceased ? "متوفى" : "حي"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" asChild className="h-auto p-0 font-medium text-primary">
                        <Link href={`/families/${familyId}/members/${m.id}`}>تفاصيل</Link>
                      </Button>
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
