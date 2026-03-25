import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id, name, visibility, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <PageHeader
        title="إدارة المنصة"
        description="عرض جميع العائلات — متاح لمشرف النظام فقط."
      />
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">العائلات</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="font-semibold">الاسم</TableHead>
                  <TableHead className="font-semibold">الظهور</TableHead>
                  <TableHead className="w-[100px] font-semibold"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(families ?? []).map((f) => (
                  <TableRow key={f.id} className="border-border/50">
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{f.visibility}</TableCell>
                    <TableCell>
                      <Link
                        href={`/families/${f.id}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        فتح
                      </Link>
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
