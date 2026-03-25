"use server";

import { createClient } from "@/lib/supabase/server";
import {
  familyCreateSchema,
  familySettingsSchema,
  type FamilyCreateInput,
  type FamilySettingsInput,
} from "@/lib/validations/family";

export async function createFamily(raw: FamilyCreateInput) {
  const parsed = familyCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const row = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    place_of_origin: parsed.data.place_of_origin ?? null,
    image_url: parsed.data.image_url || null,
    owner_id: user.id,
    created_by: user.id,
  };

  const { data: family, error } = await supabase.from("families").insert(row).select().single();
  if (error) return { error: { _server: [error.message] } };

  await supabase.from("family_memberships").insert({
    family_id: family.id,
    user_id: user.id,
    role: "owner",
  });

  return { data: family };
}

export async function updateFamilySettings(familyId: string, raw: FamilySettingsInput) {
  const parsed = familySettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _auth: ["يجب تسجيل الدخول"] } };

  const { error: e1 } = await supabase
    .from("families")
    .update({
      visibility: parsed.data.visibility,
      hide_living_sensitive: parsed.data.hide_living_sensitive,
    })
    .eq("id", familyId);

  if (e1) return { error: { _server: [e1.message] } };

  if (parsed.data.slug) {
    const { error: e2 } = await supabase.from("public_family_links").upsert(
      {
        family_id: familyId,
        slug: parsed.data.slug,
        is_enabled: parsed.data.public_enabled,
      },
      { onConflict: "family_id" }
    );
    if (e2) return { error: { _server: [e2.message] } };
  } else if (!parsed.data.public_enabled) {
    await supabase.from("public_family_links").update({ is_enabled: false }).eq("family_id", familyId);
  }

  return { ok: true as const };
}

export async function getFamilyById(familyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("families")
    .select("*")
    .eq("id", familyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return { error: error.message };
  return { data };
}
