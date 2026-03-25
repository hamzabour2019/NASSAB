-- عائلة البرهاني — للمستخدم hamza@gmail.com
-- Supabase → SQL Editor (تشغيل كمستخدم postgres)
-- يشترط وجود المستخدم مسجّلاً (auth.users + public.profiles)
--
-- هيكل: الجد + سلمى العمري ← 4 أبناء: غياث، بشر، هاني، هانية
--       غياث + رشا ← محمد هشام، حمزة، زينة، يوسق، وفاء
--       بشر + دانيا ← جواد، سلمى، تاليا
--       هاني + رغد ← لارا، كريم
--       هانية ← محمد، سارة، تيم (أمّ فقط)
--
-- إن أضفت عائلة خاطئة سابقاً: احذفها من التطبيق أو نفّذ حذفاً يدوياً قبل إعادة الإدراج.

DO $$
DECLARE
  v_user   uuid;
  v_fam    uuid;

  m_gf      uuid;
  m_gm      uuid;
  m_gayth   uuid;
  m_rasha   uuid;
  m_moh_gy  uuid;
  m_hamza   uuid;
  m_zayna   uuid;
  m_yosq    uuid;
  m_wafa    uuid;
  m_bashar  uuid;
  m_dania   uuid;
  m_jawad   uuid;
  m_salma_b uuid;
  m_talia   uuid;
  m_hani    uuid;
  m_rughd   uuid;
  m_karim   uuid;
  m_lara    uuid;
  m_hania   uuid;
  m_moh_h   uuid;
  m_sara    uuid;
  m_tim     uuid;
BEGIN
  SELECT id INTO v_user
  FROM auth.users
  WHERE lower(email) = lower('hamza@gmail.com')
  LIMIT 1;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'المستخدم غير موجود: أنشئ الحساب hamza@gmail.com أولاً';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user) THEN
    RAISE EXCEPTION 'لا يوجد صف في public.profiles لهذا المستخدم';
  END IF;

  INSERT INTO public.families (name, owner_id, visibility, description, created_by)
  VALUES (
    'البرهاني',
    v_user,
    'private',
    'عائلة البرهاني — استيراد يدوي',
    v_user
  )
  RETURNING id INTO v_fam;

  INSERT INTO public.family_memberships (family_id, user_id, role)
  VALUES (v_fam, v_user, 'owner');

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'محمد هشام البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_gf;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'سلمى العمري', 'female', false, v_user, v_user) RETURNING id INTO m_gm;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'غياث البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_gayth;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'رشا الكركوكلي', 'female', false, v_user, v_user) RETURNING id INTO m_rasha;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'محمد هشام البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_moh_gy;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'حمزة البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_hamza;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'زينة البرهاني', 'female', false, v_user, v_user) RETURNING id INTO m_zayna;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'يوسق البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_yosq;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'وفاء البرهاني', 'female', false, v_user, v_user) RETURNING id INTO m_wafa;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'بشر البرهاني', 'male', false, v_user, v_user) RETURNING id INTO m_bashar;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'دانيا', 'female', false, v_user, v_user) RETURNING id INTO m_dania;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'جواد', 'male', false, v_user, v_user) RETURNING id INTO m_jawad;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'سلمى', 'female', false, v_user, v_user) RETURNING id INTO m_salma_b;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'تاليا', 'female', false, v_user, v_user) RETURNING id INTO m_talia;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'هاني البرهاني', 'male', true, v_user, v_user) RETURNING id INTO m_hani;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'رغد', 'female', false, v_user, v_user) RETURNING id INTO m_rughd;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'كريم', 'male', false, v_user, v_user) RETURNING id INTO m_karim;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'لارا', 'female', false, v_user, v_user) RETURNING id INTO m_lara;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'هانية', 'female', false, v_user, v_user) RETURNING id INTO m_hania;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'محمد', 'male', false, v_user, v_user) RETURNING id INTO m_moh_h;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'سارة', 'female', false, v_user, v_user) RETURNING id INTO m_sara;

  INSERT INTO public.family_members (family_id, full_name, gender, is_deceased, created_by, updated_by)
  VALUES (v_fam, 'تيم', 'male', false, v_user, v_user) RETURNING id INTO m_tim;

  INSERT INTO public.marriages (family_id, spouse_a_id, spouse_b_id, is_current, created_by) VALUES
    (v_fam, LEAST(m_gf, m_gm), GREATEST(m_gf, m_gm), true, v_user),
    (v_fam, LEAST(m_gayth, m_rasha), GREATEST(m_gayth, m_rasha), true, v_user),
    (v_fam, LEAST(m_bashar, m_dania), GREATEST(m_bashar, m_dania), true, v_user),
    (v_fam, LEAST(m_hani, m_rughd), GREATEST(m_hani, m_rughd), true, v_user);

  INSERT INTO public.parent_child_relationships (family_id, child_member_id, parent_member_id, parent_role, created_by) VALUES
    (v_fam, m_gayth, m_gf, 'father', v_user),
    (v_fam, m_gayth, m_gm, 'mother', v_user),
    (v_fam, m_bashar, m_gf, 'father', v_user),
    (v_fam, m_bashar, m_gm, 'mother', v_user),
    (v_fam, m_hani, m_gf, 'father', v_user),
    (v_fam, m_hani, m_gm, 'mother', v_user),
    (v_fam, m_hania, m_gf, 'father', v_user),
    (v_fam, m_hania, m_gm, 'mother', v_user),
    (v_fam, m_moh_gy, m_gayth, 'father', v_user),
    (v_fam, m_moh_gy, m_rasha, 'mother', v_user),
    (v_fam, m_hamza, m_gayth, 'father', v_user),
    (v_fam, m_hamza, m_rasha, 'mother', v_user),
    (v_fam, m_zayna, m_gayth, 'father', v_user),
    (v_fam, m_zayna, m_rasha, 'mother', v_user),
    (v_fam, m_yosq, m_gayth, 'father', v_user),
    (v_fam, m_yosq, m_rasha, 'mother', v_user),
    (v_fam, m_wafa, m_gayth, 'father', v_user),
    (v_fam, m_wafa, m_rasha, 'mother', v_user),
    (v_fam, m_jawad, m_bashar, 'father', v_user),
    (v_fam, m_jawad, m_dania, 'mother', v_user),
    (v_fam, m_salma_b, m_bashar, 'father', v_user),
    (v_fam, m_salma_b, m_dania, 'mother', v_user),
    (v_fam, m_talia, m_bashar, 'father', v_user),
    (v_fam, m_talia, m_dania, 'mother', v_user),
    (v_fam, m_lara, m_hani, 'father', v_user),
    (v_fam, m_lara, m_rughd, 'mother', v_user),
    (v_fam, m_karim, m_hani, 'father', v_user),
    (v_fam, m_karim, m_rughd, 'mother', v_user),
    (v_fam, m_moh_h, m_hania, 'mother', v_user),
    (v_fam, m_sara, m_hania, 'mother', v_user),
    (v_fam, m_tim, m_hania, 'mother', v_user);

  RAISE NOTICE 'عائلة البرهاني: family_id = %', v_fam;
END $$;
