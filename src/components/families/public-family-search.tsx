"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Search } from "lucide-react";

type PublicFamilyPayload = {
  family: {
    id: string;
    name: string;
    description?: string | null;
    place_of_origin?: string | null;
    image_url?: string | null;
  };
  members: Array<{
    id: string;
    full_name: string;
    is_deceased: boolean;
  }>;
};

export function PublicFamilySearch() {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicFamilyPayload | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loginHref = useMemo(() => "/login?next=/dashboard", []);
  const publicBaseHref = useMemo(() => (slug.trim() ? `/public/family/${slug.trim()}` : null), [slug]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    const s = slug.trim();
    if (!s) {
      toast.error("اكتب رابط العائلة (slug) أولاً.");
      return;
    }

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_public_family", { p_slug: s });

      if (error) throw error;
      if (!data) {
        setNotFound(true);
        return;
      }

      setResult(data as PublicFamilyPayload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : undefined;
      toast.error(message ?? "تعذر البحث. تأكد من إعداد Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4 text-primary" aria-hidden />
          بحث عن عائلة (Public)
        </CardTitle>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs">
            اكتب `slug` الخاص بالرابط العام
          </Badge>
          <span className="text-xs text-muted-foreground">مثال: <span className="font-mono">al-shami-demo</span></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="public-slug">slug</Label>
            <Input
              id="public-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="مثال: al-shami-demo"
              className="h-11 rounded-xl border-border/80 bg-background/60"
              dir="ltr"
            />
          </div>
          <Button
            type="submit"
            className="h-11 rounded-xl sm:min-w-[140px]"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جاري البحث…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Search className="size-4" aria-hidden />
                بحث
              </span>
            )}
          </Button>
        </form>

        {notFound && (
          <p className="text-sm text-destructive">
            لا توجد عائلة عامة بهذا الـ slug أو أنها غير مفعّلة.
          </p>
        )}

        {result && (
          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{result.family.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.members.length} عضو في العرض العام
                </p>
              </div>
              <Badge variant="outline" className="rounded-full text-xs">
                Public
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {publicBaseHref && (
                <Button asChild variant="outline" className="rounded-xl border-border/80">
                  <Link href={publicBaseHref}>عرض الشجرة العامة</Link>
                </Button>
              )}
              <Button asChild className="rounded-xl shadow-sm">
                <Link href={loginHref}>تسجيل الدخول للداشبورد</Link>
              </Button>
            </div>

            {result.family.place_of_origin && (
              <p className="text-xs text-muted-foreground">
                الأصل: {result.family.place_of_origin}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

