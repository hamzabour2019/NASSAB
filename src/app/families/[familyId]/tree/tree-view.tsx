"use client";

import { MemberSearch } from "@/components/families/member-search";
import { FamilyTreeFlow } from "@/components/tree/family-tree-flow";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { lineageAncestorIds } from "@/lib/tree/lineage";
import type { FamilyMember, Marriage, ParentChildRelationship } from "@/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

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
              <SheetHeader>
                <SheetTitle>{detail.full_name}</SheetTitle>
                <SheetDescription>
                  {detail.is_deceased ? "متوفى" : "على قيد الحياة"}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">الجنس</dt>
                    <dd>{detail.gender}</dd>
                  </div>
                  {detail.date_of_birth && (
                    <div>
                      <dt className="text-muted-foreground">تاريخ الميلاد</dt>
                      <dd>{detail.date_of_birth}</dd>
                    </div>
                  )}
                  {detail.occupation && (
                    <div>
                      <dt className="text-muted-foreground">المهنة</dt>
                      <dd>{detail.occupation}</dd>
                    </div>
                  )}
                  {detail.biography && (
                    <div>
                      <dt className="text-muted-foreground">نبذة</dt>
                      <dd className="whitespace-pre-wrap">{detail.biography}</dd>
                    </div>
                  )}
                </dl>
                <Button asChild className="mt-6 w-full">
                  <Link href={`/families/${familyId}/members/${detail.id}`}>صفحة الفرد</Link>
                </Button>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
