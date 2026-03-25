"use client";

import { MemberSearch } from "@/components/families/member-search";
import { FamilyTreeFlow } from "@/components/tree/family-tree-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { lineageAncestorIds } from "@/lib/tree/lineage";
import type { FamilyMember, GenderType, Marriage, ParentChildRelationship } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

function genderLabelAr(g: GenderType) {
  const m: Record<GenderType, string> = {
    male: "ذكر",
    female: "أنثى",
    other: "آخر",
    unspecified: "غير محدد",
  };
  return m[g] ?? g;
}

function formatArDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return value;
  }
}

function formatArDateTime(value: string | null | undefined) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="text-foreground text-sm leading-relaxed break-words">{value}</dd>
    </div>
  );
}

export function TreeView({ familyId }: { familyId: string }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FamilyMember | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tree", familyId],
    queryFn: async () => {
      const supabase = createClient();
      const [mem, pc, mar] = await Promise.all([
        supabase.from("family_members").select("*").eq("family_id", familyId).is("deleted_at", null),
        supabase.from("parent_child_relationships").select("*").eq("family_id", familyId),
        supabase.from("marriages").select("*").eq("family_id", familyId),
      ]);
      if (mem.error) throw mem.error;
      if (pc.error) throw pc.error;
      if (mar.error) throw mar.error;
      return {
        members: mem.data as FamilyMember[],
        parentLinks: pc.data as ParentChildRelationship[],
        marriages: mar.data as Marriage[],
      };
    },
  });

  const lineageIds = useMemo(() => {
    if (!focusId || !data?.parentLinks) return undefined;
    return lineageAncestorIds(focusId, data.parentLinks);
  }, [focusId, data?.parentLinks]);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20">
        <div className="size-10 animate-pulse rounded-full bg-primary/20" />
        <p className="text-sm text-muted-foreground">جاري تحميل الشجرة…</p>
      </div>
    );
  }
  if (error || !data?.members.length) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card/60 p-8 text-center shadow-sm">
        <p className="text-destructive">تعذر تحميل البيانات أو لا يوجد أفراد بعد.</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/families/${familyId}/members`}>إضافة أفراد</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/50 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-stretch sm:justify-between">
        <div className="min-w-0 flex-1">
          <MemberSearch
            familyId={familyId}
            onSelect={(m) => {
              setFocusId(m.id);
              setDetail(m);
            }}
          />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:justify-center">
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}`}>العائلة</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl border-border/80">
            <Link href={`/families/${familyId}/members`}>الأفراد</Link>
          </Button>
        </div>
      </div>
      <FamilyTreeFlow
        graph={{
          members: data.members,
          parentLinks: data.parentLinks,
          marriages: data.marriages,
        }}
        focusMemberId={focusId}
        lineageIds={lineageIds}
        onNodeClick={(m) => {
          setFocusId(m.id);
          setDetail(m);
        }}
      />
      <Sheet open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detail && (
            <>
              <SheetHeader className="space-y-4 text-start">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                  <Avatar size="lg" className="size-20 ring-2 ring-border/80">
                    {detail.profile_image_url ? (
                      <AvatarImage src={detail.profile_image_url} alt="" className="object-cover" />
                    ) : null}
                    <AvatarFallback className="text-lg font-semibold">
                      {detail.full_name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-center sm:text-start">
                    <SheetTitle className="text-xl leading-tight">{detail.full_name}</SheetTitle>
                    <SheetDescription className="mt-1">
                      {detail.is_deceased ? "متوفى" : "على قيد الحياة"}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <ScrollArea className="mt-4 h-[calc(100vh-8rem)] pe-3">
                <dl className="space-y-4 text-sm">
                  <DetailField label="الجنس" value={genderLabelAr(detail.gender)} />
                  <DetailField label="تاريخ الميلاد" value={formatArDate(detail.date_of_birth)} />
                  <DetailField
                    label="تاريخ الوفاة"
                    value={detail.is_deceased ? formatArDate(detail.date_of_death) ?? "—" : null}
                  />
                  <DetailField label="مسقط الرأس" value={detail.place_of_birth} />
                  <DetailField label="المهنة" value={detail.occupation} />
                  <DetailField
                    label="نبذة"
                    value={
                      detail.biography ? (
                        <span className="whitespace-pre-wrap">{detail.biography}</span>
                      ) : null
                    }
                  />
                  <Separator className="my-2" />
                  <DetailField
                    label="حساب مستخدم مرتبط"
                    value={detail.linked_user_id ? "نعم" : "لا"}
                  />
                  <Separator className="my-2" />
                  <p className="text-muted-foreground text-xs font-medium">بيانات السجل</p>
                  <DetailField label="تم الإنشاء" value={formatArDateTime(detail.created_at)} />
                  <DetailField label="آخر تحديث" value={formatArDateTime(detail.updated_at)} />
                </dl>
                <Button asChild className="mt-6 w-full">
                  <Link href={`/families/${familyId}/members/${detail.id}`}>فتح صفحة الفرد الكاملة</Link>
                </Button>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
