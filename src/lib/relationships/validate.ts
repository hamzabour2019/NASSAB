export type ParentEdge = { parent_member_id: string; child_member_id: string };

function childrenByParent(edges: ParentEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) {
    const list = m.get(e.parent_member_id) ?? [];
    list.push(e.child_member_id);
    m.set(e.parent_member_id, list);
  }
  return m;
}

/** True if `start` can reach `target` following parent→child links. */
export function canReachDescendant(
  start: string,
  target: string,
  edges: ParentEdge[]
): boolean {
  const graph = childrenByParent(edges);
  const q = [start];
  const seen = new Set<string>();
  while (q.length) {
    const n = q.shift()!;
    if (n === target) return true;
    if (seen.has(n)) continue;
    seen.add(n);
    for (const c of graph.get(n) ?? []) q.push(c);
  }
  return false;
}

/**
 * Adding parent→child is valid if not self-link and child is not already an ancestor of parent
 * (which would create a directed cycle).
 */
export function isValidParentChild(
  parentId: string,
  childId: string,
  existing: ParentEdge[]
): boolean {
  if (parentId === childId) return false;
  return !canReachDescendant(childId, parentId, existing);
}
