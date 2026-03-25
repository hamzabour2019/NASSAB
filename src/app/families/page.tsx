import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, Globe, Lock, Plus } from "lucide-react";
import Link from "next/link";

export default async function FamiliesPage() {
  const supabase = await createClient();
  const { data: families } = await supabase
    .from("families")
    .select("id, name, description, place_of_origin, visibility")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const list = families ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        title="عائلاتي"
        description="اختر عائلة للانتقال إلى مركزها: الشجرة، الأفراد، الطلبات، والإعدادات."
        actions={
          <Button asChild className="rounded-xl shadow-sm">
            <Link href="/families/new">
              <Plus className="size-4 ms-1" aria-hidden />
              عائلة جديدة
            </Link>
          </Button>
        }
      />

      {list.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20 py-12 text-center shadow-none">
          <CardHeader className="items-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="size-7" strokeWidth={1.5} aria-hidden />
            </div>
            <CardTitle className="text-xl">ابدأ بعائلتك الأولى</CardTitle>
            <CardDescription className="max-w-md text-base">
              أنشئ عائلة، أضف الأفراد والعلاقات، ثم استعرض الشجرة التفاعلية.
            </CardDescription>
          </CardHeader>
          <div className="px-4 pb-8">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/families/new">إنشاء عائلة</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((f) => (
            <Link key={f.id} href={`/families/${f.id}`} className="group block">
              <Card className="h-full border-border/70 bg-card/90 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold transition-colors group-hover:text-primary">
                        {f.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                        {f.description || f.place_of_origin || "لا يوجد وصف بعد."}
                      </CardDescription>
                    </div>
                    <ChevronLeft
                      className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {f.visibility === "public_link" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <Globe className="size-3" aria-hidden />
                        رابط عام
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <Lock className="size-3" aria-hidden />
                        خاصة
                      </span>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
