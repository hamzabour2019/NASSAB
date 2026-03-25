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

/** BFS from parentless nodes, then settle married couples on the same row and push children below parents. */
function computeGenerations(
  members: FamilyMember[],
  parentLinks: ParentChildRelationship[],
  marriages: Marriage[]
): Map<string, number> {
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

  const memberIds = new Set(members.map((m) => m.id));

  for (let i = 0; i < 32; i++) {
    let changed = false;

    for (const mar of marriages) {
      const { spouse_a_id: a, spouse_b_id: b } = mar;
      if (!memberIds.has(a) || !memberIds.has(b)) continue;
      const la = level.get(a) ?? 0;
      const lb = level.get(b) ?? 0;
      const L = Math.max(la, lb);
      if (la !== L) {
        level.set(a, L);
        changed = true;
      }
      if (lb !== L) {
        level.set(b, L);
        changed = true;
      }
    }

    for (const l of parentLinks) {
      const pl = level.get(l.parent_member_id) ?? 0;
      const need = pl + 1;
      const cl = level.get(l.child_member_id) ?? 0;
      if (cl < need) {
        level.set(l.child_member_id, need);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return level;
}

export function buildFlowGraph(input: TreeGraphInput): { nodes: Node[]; edges: Edge[] } {
  const { members, parentLinks, marriages } = input;

  const level = computeGenerations(members, parentLinks, marriages);

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
