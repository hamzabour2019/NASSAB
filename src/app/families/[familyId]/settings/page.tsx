import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "./settings-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ familyId: string }> };

export default async function SettingsPage({ params }: Props) {
  const { familyId } = await params;
  const supabase = await createClient();
  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .maybeSingle();
  if (!family) notFound();

  const { data: link } = await supabase
    .from("public_family_links")
    .select("*")
    .eq("family_id", familyId)
    .maybeSingle();

  return (
    <div className="space-y-10">
      <PageHeader
        title="إعدادات العائلة"
        description={family.name}
        actions={
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}`}>رجوع</Link>
          </Button>
        }
      />
      <SettingsForm
        familyId={familyId}
        initial={{
          visibility: family.visibility,
          hide_living_sensitive: family.hide_living_sensitive,
          slug: link?.slug ?? "",
          public_enabled: link?.is_enabled ?? false,
        }}
      />
    </div>
  );
}
