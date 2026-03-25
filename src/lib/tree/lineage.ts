import type { ParentChildRelationship } from "@/types";

export function lineageAncestorIds(
  memberId: string,
  links: ParentChildRelationship[]
): Set<string> {
  const byChild = new Map<string, string[]>();
  for (const l of links) {
    const list = byChild.get(l.child_member_id) ?? [];
    list.push(l.parent_member_id);
    byChild.set(l.child_member_id, list);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const p of byChild.get(id) ?? []) {
      if (!out.has(p)) {
        out.add(p);
        walk(p);
      }
    }
  };
  walk(memberId);
  out.add(memberId);
  return out;
}
