"use client";

import { MemberNode } from "@/components/tree/member-node";
import { UnionNode } from "@/components/tree/union-node";
import { buildFlowGraph, type TreeGraphInput } from "@/lib/tree/layout";
import { cn } from "@/lib/utils";
import type { FamilyMember } from "@/types";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, ImageIcon, ScanSearch } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const nodeTypes = { member: MemberNode, union: UnionNode };

type Props = {
  graph: TreeGraphInput;
  focusMemberId?: string | null;
  lineageIds?: Set<string>;
  onNodeClick?: (member: FamilyMember) => void;
  className?: string;
};

function TreeCanvas({
  graph,
  focusMemberId,
  lineageIds,
  onNodeClick,
  className,
}: Props) {
  const { fitView, setCenter } = useReactFlow();
  const viewportRef = useRef<HTMLDivElement>(null);

  const decorated = useMemo(() => {
    const { nodes: n, edges: e } = buildFlowGraph(graph);
    const nodes: Node[] = n.map((node) => ({
      ...node,
      zIndex: node.type === "member" ? 2 : node.type === "union" ? 1 : node.zIndex,
      data: {
        ...node.data,
        highlighted: focusMemberId === node.id,
        lineage: lineageIds?.has(node.id),
      },
    }));
    return { nodes, edges: e };
  }, [graph, focusMemberId, lineageIds]);

  const [nodes, setNodes, onNodesChange] = useNodesState(decorated.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(decorated.edges);

  useEffect(() => {
    setNodes(decorated.nodes);
    setEdges(decorated.edges);
  }, [decorated, setNodes, setEdges]);

  useEffect(() => {
    if (!focusMemberId) return;
    const node = decorated.nodes.find((x) => x.id === focusMemberId);
    if (!node) return;
    const x = node.position.x + 75;
    const y = node.position.y + 40;
    setCenter(x, y, { zoom: 1.2, duration: 600 });
  }, [focusMemberId, decorated.nodes, setCenter]);

  const onNodeClickRf = useCallback(
    (_: unknown, node: Node) => {
      const m = (node.data as { member?: FamilyMember }).member;
      if (m) onNodeClick?.(m);
    },
    [onNodeClick]
  );

  const exportPng = useCallback(async () => {
    const el = viewportRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) {
      toast.error("تعذر العثور على مسار التصدير");
      return;
    }
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "nassab-tree.png";
      a.click();
      toast.success("تم تصدير الصورة");
    } catch {
      toast.error("فشل تصدير الصورة");
    }
  }, []);

  const exportPdf = useCallback(async () => {
    const el = viewportRef.current?.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!el) {
      toast.error("تعذر العثور على مسار التصدير");
      return;
    }
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height) * 0.95;
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save("nassab-tree.pdf");
      toast.success("تم تصدير PDF");
    } catch {
      toast.error("فشل تصدير PDF");
    }
  }, []);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "family-tree-flow-root relative h-[min(720px,72vh)] w-full overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card/90 to-muted/30 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.06]",
        className
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickRf}
        fitView
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} />
        <Controls
          showFitView
          className="rtl:[&_button]:rotate-180"
        />
        <MiniMap
          className="rounded-lg border bg-card"
          maskColor="rgb(0 0 0 / 12%)"
        />
      </ReactFlow>
      <div className="absolute end-3 top-3 z-10 flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background/85 p-1.5 shadow-sm backdrop-blur-md">
        <Button type="button" size="sm" variant="secondary" className="rounded-lg shadow-none" onClick={exportPng}>
          <ImageIcon className="size-4 ms-1" />
          PNG
        </Button>
        <Button type="button" size="sm" variant="secondary" className="rounded-lg shadow-none" onClick={exportPdf}>
          <Download className="size-4 ms-1" />
          PDF
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-lg border-border/70"
          onClick={() => fitView({ padding: 0.2 })}
        >
          <ScanSearch className="size-4" />
        </Button>
      </div>
      <div className="pointer-events-none absolute start-3 bottom-3 z-10 flex gap-4 rounded-xl border border-border/60 bg-card/95 px-4 py-2.5 text-xs text-muted-foreground shadow-sm backdrop-blur-md">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary/60" />
          على قيد الحياة
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full border border-dashed border-muted-foreground" />
          متوفى
        </span>
      </div>
    </div>
  );
}

export function FamilyTreeFlow(props: Props) {
  return (
    <ReactFlowProvider>
      <TreeCanvas {...props} />
    </ReactFlowProvider>
  );
}
