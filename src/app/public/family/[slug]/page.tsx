import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Globe } from "lucide-react";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicFamilyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_family", { p_slug: slug });

  if (error || !data) notFound();

  const payload = data as {
    family: { name: string; description?: string | null; place_of_origin?: string | null };
    members: Array<{
      id: string;
      full_name: string;
      is_deceased: boolean;
      occupation?: string | null;
      biography?: string | null;
    }>;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-6">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-muted/40 p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Globe className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{payload.family.name}</h1>
        {payload.family.description && (
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{payload.family.description}</p>
        )}
        {payload.family.place_of_origin && (
          <p className="mt-3 text-sm text-muted-foreground">الأصل: {payload.family.place_of_origin}</p>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          عرض عام — قد تكون بعض الحقول مخفية حسب إعدادات الخصوصية للعائلة
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {payload.members.map((m) => (
          <Card
            key={m.id}
            className="border-border/70 bg-card/90 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="border-b border-border/40 py-4">
              <CardTitle className="text-base font-semibold">{m.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4 text-sm text-muted-foreground">
              <span
                className={
                  m.is_deceased
                    ? "inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs"
                    : "inline-block rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary"
                }
              >
                {m.is_deceased ? "متوفى" : "على قيد الحياة"}
              </span>
              {m.occupation && <p>المهنة: {m.occupation}</p>}
              {m.biography && <p className="whitespace-pre-wrap leading-relaxed">{m.biography}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
