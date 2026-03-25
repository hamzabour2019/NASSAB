"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidParentChild, type ParentEdge } from "@/lib/relationships/validate";
import { editRequestCreateSchema, editRequestReviewSchema } from "@/lib/validations/request";
import type { EditRequestCreateInput } from "@/lib/validations/request";

export async function submitEditRequest(raw: EditRequestCreateInput) {
  const parsed = editRequestCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const { error } = await supabase.from("edit_requests").insert({
    family_id: parsed.data.family_id,
    requester_id: user.id,
    request_type: parsed.data.request_type,
    payload: parsed.data.payload,
    target_member_id: parsed.data.target_member_id ?? null,
  });

  if (error) return { error: { _server: [error.message] } };

  const { data: owners } = await supabase
    .from("family_memberships")
    .select("user_id")
    .eq("family_id", parsed.data.family_id)
    .in("role", ["owner", "admin"]);

  const { data: fam } = await supabase.from("families").select("owner_id").eq("id", parsed.data.family_id).single();

  const notifyIds = new Set<string>();
  owners?.forEach((o) => notifyIds.add(o.user_id));
  if (fam?.owner_id) notifyIds.add(fam.owner_id);
  notifyIds.delete(user.id);

  for (const uid of notifyIds) {
    await supabase.from("notifications").insert({
      user_id: uid,
      title: "طلب تعديل جديد",
      body: "هناك طلب تعديل بانتظار المراجعة",
      family_id: parsed.data.family_id,
      link_url: `/families/${parsed.data.family_id}/requests`,
    });
  }

  return { ok: true as const };
}

async function loadParentEdges(supabase: Awaited<ReturnType<typeof createClient>>, familyId: string) {
  const { data } = await supabase
    .from("parent_child_relationships")
    .select("parent_member_id, child_member_id")
    .eq("family_id", familyId);
  return (data ?? []) as ParentEdge[];
}

async function applyApprovedRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  familyId: string,
  userId: string,
  row: {
    request_type: string;
    payload: Record<string, unknown>;
    target_member_id: string | null;
  }
) {
  const p = row.payload;

  if (row.request_type === "update_member" && row.target_member_id) {
    const patch: Record<string, unknown> = { updated_by: userId };
    if (typeof p.full_name === "string") patch.full_name = p.full_name;
    if (typeof p.occupation === "string") patch.occupation = p.occupation;
    if (typeof p.biography === "string") patch.biography = p.biography;
    if (typeof p.place_of_birth === "string") patch.place_of_birth = p.place_of_birth;
    const { error } = await supabase
      .from("family_members")
      .update(patch)
      .eq("id", row.target_member_id)
      .eq("family_id", familyId);
    return error?.message;
  }

  if (row.request_type === "add_child") {
    const full_name = p.proposed_name as string;
    if (!full_name) return "اسم الطفل مفقود";
    const father_id = (p.father_id as string) || null;
    const mother_id = (p.mother_id as string) || null;

    const { data: member, error } = await supabase
      .from("family_members")
      .insert({
        family_id: familyId,
        full_name,
        gender: (p.gender as string) || "unspecified",
        is_deceased: false,
        created_by: userId,
      })
      .select()
      .single();
    if (error) return error.message;
    const childId = member.id;
    const edges = await loadParentEdges(supabase, familyId);

    if (father_id) {
      if (!isValidParentChild(father_id, childId, edges)) return "علاقة الأب غير صالحة";
      const { error: e2 } = await supabase.from("parent_child_relationships").insert({
        family_id: familyId,
        child_member_id: childId,
        parent_member_id: father_id,
        parent_role: "father",
        created_by: userId,
      });
      if (e2) return e2.message;
    }
    if (mother_id) {
      const edges2 = await loadParentEdges(supabase, familyId);
      if (!isValidParentChild(mother_id, childId, edges2)) return "علاقة الأم غير صالحة";
      const { error: e2 } = await supabase.from("parent_child_relationships").insert({
        family_id: familyId,
        child_member_id: childId,
        parent_member_id: mother_id,
        parent_role: "mother",
        created_by: userId,
      });
      if (e2) return e2.message;
    }
  }

  return null;
}

export async function reviewEditRequest(input: unknown) {
  const parsed = editRequestReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const { data: req } = await supabase
    .from("edit_requests")
    .select("*")
    .eq("id", parsed.data.request_id)
    .eq("family_id", parsed.data.family_id)
    .single();

  if (!req || req.status !== "pending") {
    return { error: { _server: ["الطلب غير موجود أو تمت معالجته"] } };
  }

  if (parsed.data.approve) {
    const err = await applyApprovedRequest(supabase, parsed.data.family_id, user.id, {
      request_type: req.request_type,
      payload: (req.payload ?? {}) as Record<string, unknown>,
      target_member_id: req.target_member_id,
    });
    if (err) return { error: { _server: [err] } };
  }

  const { error } = await supabase
    .from("edit_requests")
    .update({
      status: parsed.data.approve ? "approved" : "rejected",
      reviewer_id: user.id,
      reviewer_note: parsed.data.note ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.request_id);

  if (error) return { error: { _server: [error.message] } };

  await supabase.from("notifications").insert({
    user_id: req.requester_id,
    title: parsed.data.approve ? "تم قبول طلبك" : "تم رفض طلبك",
    body: parsed.data.note ?? undefined,
    family_id: parsed.data.family_id,
    link_url: `/families/${parsed.data.family_id}/requests`,
  });

  return { ok: true as const };
}
