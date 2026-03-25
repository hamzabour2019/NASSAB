import type { FamilyMember } from "@/types";
import type { Marriage } from "@/types";
import type { ParentChildRelationship } from "@/types";
import type { Edge, Node } from "@xyflow/react";

const X_GAP = 260;
const Y_GAP = 120;

export type TreeGraphInput = {
  members: FamilyMember[];
  parentLinks: ParentChildRelationship[];
  marriages: Marriage[];
};

export function buildFlowGraph(input: TreeGraphInput): { nodes: Node[]; edges: Edge[] } {
  const { members, parentLinks, marriages } = input;

  const childrenByParent = new Map<string, string[]>();
  for (const l of parentLinks) {
    const list = childrenByParent.get(l.parent_member_id) ?? [];
    list.push(l.child_member_id);
    childrenByParent.set(l.parent_member_id, list);
  }

  const hasParent = new Set(parentLinks.map((p) => p.child_member_id));
  const roots = members.filter((m) => !hasParent.has(m.id)).map((m) => m.id);

  const level = new Map<string, number>();
  const q = [...roots.map((id) => ({ id, lv: 0 }))];
  const seen = new Set<string>();
  while (q.length) {
    const { id, lv } = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    level.set(id, Math.max(level.get(id) ?? 0, lv));
    for (const c of childrenByParent.get(id) ?? []) {
      q.push({ id: c, lv: lv + 1 });
    }
  }

  for (const m of members) {
    if (!level.has(m.id)) level.set(m.id, 0);
  }

  const byLevel = new Map<number, string[]>();
  let maxLv = 0;
  for (const m of members) {
    const lv = level.get(m.id) ?? 0;
    maxLv = Math.max(maxLv, lv);
    if (!byLevel.has(lv)) byLevel.set(lv, []);
    byLevel.get(lv)!.push(m.id);
  }

  for (const [, ids] of byLevel) {
    ids.sort((a, b) => a.localeCompare(b));
  }

  const pos = new Map<string, { x: number; y: number }>();
  for (let lv = 0; lv <= maxLv; lv++) {
    const ids = byLevel.get(lv) ?? [];
    const width = (ids.length - 1) * X_GAP;
    ids.forEach((id, i) => {
      pos.set(id, { x: i * X_GAP - width / 2, y: lv * Y_GAP });
    });
  }

  const nodes: Node[] = members.map((m) => {
    const p = pos.get(m.id) ?? { x: 0, y: 0 };
    return {
      id: m.id,
      type: "member",
      position: p,
      data: { member: m },
    };
  });

  const edges: Edge[] = [];
  for (const l of parentLinks) {
    edges.push({
      id: `pc-${l.id}`,
      source: l.parent_member_id,
      target: l.child_member_id,
      type: "smoothstep",
      style: { stroke: "var(--color-muted-foreground)", strokeWidth: 2 },
    });
  }

  for (const mar of marriages) {
    edges.push({
      id: `m-${mar.id}`,
      source: mar.spouse_a_id,
      target: mar.spouse_b_id,
      type: "straight",
      style: {
        stroke: mar.is_current ? "hsl(280 60% 50%)" : "var(--color-muted-foreground)",
        strokeWidth: mar.is_current ? 2 : 1,
        strokeDasharray: mar.is_current ? undefined : "6 4",
      },
    });
  }

  return { nodes, edges };
}
