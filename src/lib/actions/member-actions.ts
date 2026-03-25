"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidParentChild, type ParentEdge } from "@/lib/relationships/validate";
import { memberCreateSchema, memberUpdateSchema } from "@/lib/validations/member";
import type { MemberCreateInput } from "@/lib/validations/member";

async function loadParentEdges(supabase: Awaited<ReturnType<typeof createClient>>, familyId: string) {
  const { data } = await supabase
    .from("parent_child_relationships")
    .select("parent_member_id, child_member_id")
    .eq("family_id", familyId);
  return (data ?? []) as ParentEdge[];
}

export async function createMember(familyId: string, raw: MemberCreateInput) {
  const parsed = memberCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const { father_id, mother_id, ...rest } = parsed.data;

  const insertRow = {
    family_id: familyId,
    full_name: rest.full_name,
    gender: rest.gender,
    date_of_birth: rest.date_of_birth || null,
    date_of_death: rest.date_of_death || null,
    is_deceased: rest.is_deceased,
    biography: rest.biography ?? null,
    place_of_birth: rest.place_of_birth ?? null,
    occupation: rest.occupation ?? null,
    profile_image_url: rest.profile_image_url || null,
    created_by: user.id,
  };

  const { data: member, error } = await supabase.from("family_members").insert(insertRow).select().single();
  if (error) return { error: { _server: [error.message] } };

  const childId = member.id;
  const freshEdges = await loadParentEdges(supabase, familyId);

  if (father_id) {
    if (!isValidParentChild(father_id, childId, freshEdges)) {
      await supabase.from("family_members").delete().eq("id", childId);
      return { error: { father_id: ["علاقة أبوية غير صالحة أو تُنشئ دورة"] } };
    }
    const { error: pe } = await supabase.from("parent_child_relationships").insert({
      family_id: familyId,
      child_member_id: childId,
      parent_member_id: father_id,
      parent_role: "father",
      created_by: user.id,
    });
    if (pe) {
      await supabase.from("family_members").delete().eq("id", childId);
      return { error: { _server: [pe.message] } };
    }
  }

  if (mother_id) {
    const edges2 = await loadParentEdges(supabase, familyId);
    if (!isValidParentChild(mother_id, childId, edges2)) {
      await supabase.from("parent_child_relationships").delete().eq("child_member_id", childId);
      await supabase.from("family_members").delete().eq("id", childId);
      return { error: { mother_id: ["علاقة أمومية غير صالحة أو تُنشئ دورة"] } };
    }
    const { error: pe } = await supabase.from("parent_child_relationships").insert({
      family_id: familyId,
      child_member_id: childId,
      parent_member_id: mother_id,
      parent_role: "mother",
      created_by: user.id,
    });
    if (pe) {
      await supabase.from("parent_child_relationships").delete().eq("child_member_id", childId);
      await supabase.from("family_members").delete().eq("id", childId);
      return { error: { _server: [pe.message] } };
    }
  }

  return { data: member };
}

export async function updateMember(memberId: string, familyId: string, raw: Partial<MemberCreateInput>) {
  const parsed = memberUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const { error } = await supabase
    .from("family_members")
    .update({
      ...parsed.data,
      profile_image_url: parsed.data.profile_image_url || null,
      updated_by: user.id,
    })
    .eq("id", memberId)
    .eq("family_id", familyId);

  if (error) return { error: { _server: [error.message] } };
  return { ok: true as const };
}

export async function addMarriage(
  familyId: string,
  aId: string,
  bId: string,
  opts?: { started_on?: string | null; ended_on?: string | null; is_current?: boolean }
) {
  if (aId === bId) return { error: { _server: ["نفس الشخص"] } };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const spouse_a_id = aId < bId ? aId : bId;
  const spouse_b_id = aId < bId ? bId : aId;

  const { error } = await supabase.from("marriages").insert({
    family_id: familyId,
    spouse_a_id,
    spouse_b_id,
    started_on: opts?.started_on ?? null,
    ended_on: opts?.ended_on ?? null,
    is_current: opts?.is_current ?? true,
    created_by: user.id,
  });

  if (error) return { error: { _server: [error.message] } };
  return { ok: true as const };
}
