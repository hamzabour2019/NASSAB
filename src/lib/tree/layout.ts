import type { FamilyMember } from "@/types";
import type { Marriage } from "@/types";
import type { ParentChildRelationship } from "@/types";
import type { Edge, Node } from "@xyflow/react";

/** عرض/ارتفاع تقريبي لبطاقة العضو (لتحويل المركز → زاوية React Flow) */
const NODE_W = 168;
const NODE_H = 92;
/** بعد مركزَي الزوجين عن مركز الزوجية */
const COUPLE_HALF_SPREAD = 108;
/** تباعد عمودي بين صفوف الأجيال */
const VERTICAL = 128;
/** تباعد أفقي بين مجموعات أبناء الإخوة */
const SUBTREE_PAD = 44;
/** ارتفع عقدة الربط بين الأبوين والأبناء */
const UNION_BELOW_PARENT = 62;

export type TreeGraphInput = {
  members: FamilyMember[];
  parentLinks: ParentChildRelationship[];
  marriages: Marriage[];
};

type Unit = { kind: "pair"; a: string; b: string } | { kind: "single"; id: string };

function unitKey(u: Unit): string {
  return u.kind === "single" ? `s:${u.id}` : `p:${[u.a, u.b].sort().join(":")}`;
}

function unitForMember(memberId: string, partnerOf: Map<string, string>, memberIds: Set<string>): Unit {
  const sp = partnerOf.get(memberId);
  if (sp && memberIds.has(sp)) {
    const a = memberId < sp ? memberId : sp;
    const b = memberId < sp ? sp : memberId;
    return { kind: "pair", a, b };
  }
  return { kind: "single", id: memberId };
}

function dedupeUnits(units: Unit[]): Unit[] {
  const seen = new Set<string>();
  const out: Unit[] = [];
  for (const u of units) {
    const k = unitKey(u);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
  }
  return out;
}

function parentMaps(links: ParentChildRelationship[]) {
  const fatherOf = new Map<string, string>();
  const motherOf = new Map<string, string>();
  for (const l of links) {
    if (l.parent_role === "father") fatherOf.set(l.child_member_id, l.parent_member_id);
    else motherOf.set(l.child_member_id, l.parent_member_id);
  }
  return { fatherOf, motherOf };
}

function sharedChildren(a: string, b: string, fatherOf: Map<string, string>, motherOf: Map<string, string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of fatherOf.keys()) {
    if (!motherOf.has(c)) continue;
    const f = fatherOf.get(c);
    const m = motherOf.get(c);
    if ((f === a && m === b) || (f === b && m === a)) {
      if (!seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
  }
  return out;
}

/** طفل مرتبط بولد واحد فقط في البيانات (أب أو أم) */
function singleParentChildren(
  parentId: string,
  fatherOf: Map<string, string>,
  motherOf: Map<string, string>,
  memberIds: Set<string>
): string[] {
  const out: string[] = [];
  for (const id of memberIds) {
    const f = fatherOf.get(id);
    const mo = motherOf.get(id);
    const n = (f ? 1 : 0) + (mo ? 1 : 0);
    if (n !== 1) continue;
    if (f === parentId || mo === parentId) out.push(id);
  }
  return out;
}

function leafWidth(u: Unit): number {
  return u.kind === "pair" ? COUPLE_HALF_SPREAD * 2 + NODE_W : NODE_W;
}

function measureUnit(
  u: Unit,
  fatherOf: Map<string, string>,
  motherOf: Map<string, string>,
  partnerOf: Map<string, string>,
  memberIds: Set<string>
): number {
  const kids =
    u.kind === "pair"
      ? sharedChildren(u.a, u.b, fatherOf, motherOf)
      : singleParentChildren(u.id, fatherOf, motherOf, memberIds);
  if (kids.length === 0) return leafWidth(u);

  const childUnits = dedupeUnits(kids.map((id) => unitForMember(id, partnerOf, memberIds)));
  let total = 0;
  for (let i = 0; i < childUnits.length; i++) {
    total += measureUnit(childUnits[i], fatherOf, motherOf, partnerOf, memberIds);
    if (i < childUnits.length - 1) total += SUBTREE_PAD;
  }
  return Math.max(leafWidth(u), total);
}

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
      const a = mar.spouse_a_id;
      const b = mar.spouse_b_id;
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

type CenterPos = { cx: number; cy: number };

export function buildFlowGraph(input: TreeGraphInput): { nodes: Node[]; edges: Edge[] } {
  const { members, parentLinks, marriages } = input;
  const memberList = members;
  const memberIds = new Set(memberList.map((m) => m.id));

  const { fatherOf, motherOf } = parentMaps(parentLinks);

  const partnerOf = new Map<string, string>();
  for (const mar of marriages) {
    const { spouse_a_id: a, spouse_b_id: b } = mar;
    if (memberIds.has(a) && memberIds.has(b)) {
      partnerOf.set(a, b);
      partnerOf.set(b, a);
    }
  }

  const genLevel = computeGenerations(memberList, parentLinks, marriages);

  const rootIds = memberList.filter((m) => !fatherOf.has(m.id) && !motherOf.has(m.id)).map((m) => m.id);

  const rootUnits: Unit[] = [];
  const seenRoot = new Set<string>();
  for (const id of rootIds) {
    if (seenRoot.has(id)) continue;
    const u = unitForMember(id, partnerOf, memberIds);
    if (u.kind === "pair") {
      seenRoot.add(u.a);
      seenRoot.add(u.b);
    } else {
      seenRoot.add(u.id);
    }
    rootUnits.push(u);
  }

  const centers = new Map<string, CenterPos>();
  const unionNodes: { id: string; cx: number; cy: number }[] = [];
  const treeEdges: Edge[] = [];

  let nextUnion = 0;
  const unionId = () => `__union__${nextUnion++}`;

  function placeUnit(u: Unit, centerX: number, depth: number): void {
    const yRow = depth * VERTICAL;

    if (u.kind === "pair") {
      centers.set(u.a, { cx: centerX - COUPLE_HALF_SPREAD, cy: yRow });
      centers.set(u.b, { cx: centerX + COUPLE_HALF_SPREAD, cy: yRow });
    } else {
      centers.set(u.id, { cx: centerX, cy: yRow });
    }

    const kids =
      u.kind === "pair"
        ? sharedChildren(u.a, u.b, fatherOf, motherOf)
        : singleParentChildren(u.id, fatherOf, motherOf, memberIds);

    if (kids.length === 0) return;

    const childUnits = dedupeUnits(kids.map((id) => unitForMember(id, partnerOf, memberIds)));
    const widths = childUnits.map((cu) => measureUnit(cu, fatherOf, motherOf, partnerOf, memberIds));
    const totalW = widths.reduce((s, w) => s + w, 0) + SUBTREE_PAD * Math.max(0, childUnits.length - 1);
    let cursor = centerX - totalW / 2;

    const childY = (depth + 1) * VERTICAL;

    if (u.kind === "pair") {
      const uid = unionId();
      const ucx = centerX;
      const ucy = yRow + UNION_BELOW_PARENT;
      unionNodes.push({ id: uid, cx: ucx, cy: ucy });

      treeEdges.push({
        id: `e-${u.a}-${uid}`,
        source: u.a,
        target: uid,
        type: "smoothstep",
        style: { stroke: "var(--color-muted-foreground)", strokeWidth: 2 },
      });
      treeEdges.push({
        id: `e-${u.b}-${uid}`,
        source: u.b,
        target: uid,
        type: "smoothstep",
        style: { stroke: "var(--color-muted-foreground)", strokeWidth: 2 },
      });

      for (const cid of kids) {
        treeEdges.push({
          id: `e-${uid}-${cid}`,
          source: uid,
          target: cid,
          type: "smoothstep",
          style: { stroke: "var(--color-muted-foreground)", strokeWidth: 2 },
        });
      }
    } else {
      for (const cid of kids) {
        treeEdges.push({
          id: `e-${u.id}-${cid}`,
          source: u.id,
          target: cid,
          type: "smoothstep",
          style: { stroke: "var(--color-muted-foreground)", strokeWidth: 2 },
        });
      }
    }

    for (let i = 0; i < childUnits.length; i++) {
      const cu = childUnits[i];
      const w = widths[i]!;
      placeUnit(cu, cursor + w / 2, depth + 1);
      cursor += w + SUBTREE_PAD;
    }

    for (const cid of kids) {
      const c = centers.get(cid);
      if (c) c.cy = childY;
    }
  }

  const rw = rootUnits.map((ru) => measureUnit(ru, fatherOf, motherOf, partnerOf, memberIds));
  let rx = 0;
  const ROOT_GAP = 80;
  for (let i = 0; i < rootUnits.length; i++) {
    const ru = rootUnits[i]!;
    const w = rw[i]!;
    placeUnit(ru, rx + w / 2, 0);
    rx += w + ROOT_GAP;
  }

  const allCx = [
    ...memberList.map((m) => centers.get(m.id)?.cx).filter((x): x is number => x !== undefined),
    ...unionNodes.map((u) => u.cx),
  ];
  const avgX = allCx.length ? allCx.reduce((a, b) => a + b, 0) / allCx.length : 0;
  for (const m of memberList) {
    const c = centers.get(m.id);
    if (c) c.cx -= avgX;
  }
  for (const u of unionNodes) {
    u.cx -= avgX;
  }

  const nodes: Node[] = memberList.map((m) => {
    const c = centers.get(m.id) ?? { cx: 0, cy: (genLevel.get(m.id) ?? 0) * VERTICAL };
    return {
      id: m.id,
      type: "member",
      position: { x: c.cx - NODE_W / 2, y: c.cy - NODE_H / 2 },
      data: { member: m },
    };
  });

  for (const u of unionNodes) {
    const sz = 20;
    nodes.push({
      id: u.id,
      type: "union",
      position: { x: u.cx - sz / 2, y: u.cy - sz / 2 },
      data: {},
      draggable: false,
      selectable: false,
    });
  }

  const edges: Edge[] = [...treeEdges];

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
