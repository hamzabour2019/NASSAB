"use client";

import { cn } from "@/lib/utils";
import type { FamilyMember } from "@/types";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type MemberNodeData = {
  member: FamilyMember;
  highlighted?: boolean;
  lineage?: boolean;
};

export function MemberNode({ data, selected }: NodeProps) {
  const d = data as MemberNodeData;
  const m = d.member;

  return (
    <div
      className={cn(
        "relative z-10 rounded-2xl border-2 bg-card px-3.5 py-2.5 text-center shadow-md transition-all duration-200 min-w-[158px] max-w-[210px]",
        m.is_deceased
          ? "border-dashed border-muted-foreground/45 bg-muted/35 opacity-[0.92]"
          : "border-primary/35 bg-card ring-1 ring-primary/10",
        d.highlighted && "z-10 scale-[1.02] border-primary shadow-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        d.lineage && !d.highlighted && "border-primary/50 ring-1 ring-primary/30",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <Handle type="target" position={Position.Top} className="!size-2.5 !border-2 !border-background !bg-primary" />
      <p className="text-sm font-semibold leading-snug text-card-foreground">{m.full_name}</p>
      <p
        className={cn(
          "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
          m.is_deceased
            ? "bg-muted text-muted-foreground"
            : "bg-primary/12 text-primary"
        )}
      >
        {m.is_deceased ? "متوفى" : "على قيد الحياة"}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!size-2.5 !border-2 !border-background !bg-primary"
      />
    </div>
  );
}
