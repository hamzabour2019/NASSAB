"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

/** عقدة صغيرة تربط الأب والأم معاً بالأبناء (بدون خطوط بين الأبناء أنفسهم) */
export function UnionNode({}: NodeProps) {
  return (
    <div className="flex size-5 items-center justify-center">
      <Handle type="target" position={Position.Top} className="!size-2 !border !border-background !bg-muted-foreground/80" />
      <div className="size-2 rounded-full bg-muted-foreground/50 ring-1 ring-border" />
      <Handle type="source" position={Position.Bottom} className="!size-2 !border !border-background !bg-muted-foreground/80" />
    </div>
  );
}
