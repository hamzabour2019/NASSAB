-- Nassab seed data
-- Run after migrations. Sign up as demo@nassab.app first, then: supabase db reset (includes seed) or run this in SQL editor.

DO $$
DECLARE
  demo_uid UUID;
  fam_id UUID;
  gp_m UUID;
  gp_f UUID;
  p1 UUID;
  p2 UUID;
  ex UUID;
  c1 UUID;
  c2 UUID;
  c3 UUID;
BEGIN
  SELECT id INTO demo_uid FROM auth.users WHERE email = 'demo@nassab.app' LIMIT 1;
  IF demo_uid IS NULL THEN
    RAISE NOTICE 'Skip seed: create auth user demo@nassab.app first, then re-run seed.';
    RETURN;
  END IF;

  UPDATE public.profiles SET is_super_admin = TRUE WHERE id = demo_uid;

  INSERT INTO public.families (name, description, place_of_origin, owner_id, visibility, hide_living_sensitive, created_by)
  VALUES (
    'عائلة الشامي',
    'عائلة نموذجية لاختبار شجرة النسب — أجداد، آباء، أبناء، وزيجات سابقة.',
    'دمشق، سوريا',
    demo_uid,
    'public_link',
    TRUE,
    demo_uid
  )
  RETURNING id INTO fam_id;

  INSERT INTO public.family_memberships (family_id, user_id, role)
  VALUES (fam_id, demo_uid, 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, date_of_death, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'محمود الشامي', 'male', '1940-03-01', TRUE, '2018-11-20', 'جد العائلة، تاجر.', 'دمشق', 'تاجر', demo_uid)
  RETURNING id INTO gp_m;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, date_of_death, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'فاطمة الحمصي', 'female', '1945-07-12', TRUE, '2020-05-10', 'زوجة محمود.', 'حمص', 'ربة منزل', demo_uid)
  RETURNING id INTO gp_f;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'خالد الشامي', 'male', '1970-01-15', FALSE, 'الابن الأكبر، مهندس.', 'دمشق', 'مهندس مدني', demo_uid)
  RETURNING id INTO p1;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'ليلى الكردي', 'female', '1972-09-22', FALSE, 'زوجة خالد الحالية.', 'حلب', 'طبيبة', demo_uid)
  RETURNING id INTO p2;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'سارة العلي', 'female', '1968-04-30', FALSE, 'زوجة سابقة لخالد.', 'بيروت', 'مصممة', demo_uid)
  RETURNING id INTO ex;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'يوسف الشامي', 'male', '2000-12-05', FALSE, 'ابن خالد وليلى.', 'الرياض', 'طالب', demo_uid)
  RETURNING id INTO c1;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'نورا الشامي', 'female', '2003-06-18', FALSE, 'ابنة خالد وليلى.', 'الرياض', 'طالبة', demo_uid)
  RETURNING id INTO c2;

  INSERT INTO public.family_members (family_id, full_name, gender, date_of_birth, is_deceased, biography, place_of_birth, occupation, created_by)
  VALUES (fam_id, 'عمر الشامي', 'male', '1995-02-28', FALSE, 'ابن خالد من زواج سابق.', 'الدوحة', 'محاسب', demo_uid)
  RETURNING id INTO c3;

  INSERT INTO public.parent_child_relationships (family_id, child_member_id, parent_member_id, parent_role, created_by)
  VALUES
    (fam_id, p1, gp_m, 'father', demo_uid),
    (fam_id, p1, gp_f, 'mother', demo_uid),
    (fam_id, c1, p1, 'father', demo_uid),
    (fam_id, c1, p2, 'mother', demo_uid),
    (fam_id, c2, p1, 'father', demo_uid),
    (fam_id, c2, p2, 'mother', demo_uid),
    (fam_id, c3, p1, 'father', demo_uid),
    (fam_id, c3, ex, 'mother', demo_uid);

  INSERT INTO public.marriages (family_id, spouse_a_id, spouse_b_id, started_on, ended_on, is_current, created_by)
  VALUES
    (fam_id, LEAST(p1, p2), GREATEST(p1, p2), '1999-06-01', NULL, TRUE, demo_uid),
    (fam_id, LEAST(p1, ex), GREATEST(p1, ex), '1993-01-01', '1998-12-01', FALSE, demo_uid);

  INSERT INTO public.public_family_links (family_id, slug, is_enabled)
  VALUES (fam_id, 'al-shami-demo', TRUE);

  INSERT INTO public.edit_requests (family_id, requester_id, request_type, status, payload, target_member_id)
  VALUES (
    fam_id,
    demo_uid,
    'update_member',
    'pending',
    jsonb_build_object('full_name', 'خالد محمود الشامي', 'occupation', 'مهندس استشاري'),
    p1
  );

  INSERT INTO public.edit_requests (family_id, requester_id, request_type, status, payload, reviewer_note, reviewed_at, reviewer_id)
  VALUES (
    fam_id,
    demo_uid,
    'add_child',
    'rejected',
    jsonb_build_object('proposed_name', 'طفل تجريبي'),
    'لا توجد وثائق داعمة',
    NOW(),
    demo_uid
  );

  PERFORM public.append_audit(fam_id, demo_uid, 'SEED_LOADED', 'family', fam_id, '{"note": "بيانات أولية"}'::jsonb);
END $$;
