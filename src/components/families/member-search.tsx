"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "@/types";
import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  familyId: string;
  onSelect: (member: FamilyMember) => void;
};

export function MemberSearch({ familyId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (term: string) => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", familyId)
        .is("deleted_at", null)
        .ilike("full_name", `%${term}%`)
        .limit(20);
      setLoading(false);
      if (!error && data) setHits(data as FamilyMember[]);
    },
    [familyId]
  );

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (q.trim().length >= 1) void search(q.trim());
      else void search("");
    }, 200);
    return () => clearTimeout(t);
  }, [q, open, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 min-h-11 w-full justify-between rounded-xl border-border/80 bg-background/80"
        )}
      >
        بحث عن فرد في الشجرة…
        <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="اكتب جزءاً من الاسم…" value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>
              {loading ? "جاري البحث…" : q.length < 1 ? "ابدأ الكتابة" : "لا نتائج"}
            </CommandEmpty>
            <CommandGroup>
              {hits.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.id}
                  onSelect={() => {
                    onSelect(m);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("ms-auto size-4 opacity-0")} />
                  {m.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
