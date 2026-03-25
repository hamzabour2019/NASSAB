-- Nassab (نسب) — initial schema, RLS, audit triggers, helpers

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.family_visibility AS ENUM ('private', 'public_link');
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'unspecified');
CREATE TYPE public.parent_role AS ENUM ('father', 'mother');
CREATE TYPE public.edit_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.edit_request_type AS ENUM (
  'update_member',
  'add_parent',
  'add_spouse',
  'add_child',
  'correct_relationship',
  'change_image'
);

-- Profiles (1:1 auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  place_of_origin TEXT,
  image_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  visibility public.family_visibility NOT NULL DEFAULT 'private',
  hide_living_sensitive BOOLEAN NOT NULL DEFAULT TRUE,
  public_visible_fields JSONB NOT NULL DEFAULT '["full_name", "is_deceased"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles (id),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.family_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, user_id)
);

CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  gender public.gender_type NOT NULL DEFAULT 'unspecified',
  date_of_birth DATE,
  date_of_death DATE,
  is_deceased BOOLEAN NOT NULL DEFAULT FALSE,
  biography TEXT,
  place_of_birth TEXT,
  occupation TEXT,
  profile_image_url TEXT,
  linked_user_id UUID REFERENCES public.profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles (id),
  updated_by UUID REFERENCES public.profiles (id),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT death_consistency CHECK (
    (NOT is_deceased AND date_of_death IS NULL)
    OR (is_deceased)
  )
);

CREATE INDEX idx_family_members_family ON public.family_members (family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_family_members_name ON public.family_members USING gin (to_tsvector('simple', full_name));

CREATE TABLE public.parent_child_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  child_member_id UUID NOT NULL REFERENCES public.family_members (id) ON DELETE CASCADE,
  parent_member_id UUID NOT NULL REFERENCES public.family_members (id) ON DELETE CASCADE,
  parent_role public.parent_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles (id),
  UNIQUE (child_member_id, parent_role),
  CONSTRAINT parent_not_child CHECK (child_member_id <> parent_member_id)
);

CREATE TABLE public.marriages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  spouse_a_id UUID NOT NULL REFERENCES public.family_members (id) ON DELETE CASCADE,
  spouse_b_id UUID NOT NULL REFERENCES public.family_members (id) ON DELETE CASCADE,
  started_on DATE,
  ended_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles (id),
  CONSTRAINT spouses_distinct CHECK (spouse_a_id <> spouse_b_id),
  CONSTRAINT marriage_spouse_order CHECK (spouse_a_id < spouse_b_id)
);

CREATE INDEX idx_marriages_family ON public.marriages (family_id);

CREATE TABLE public.edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families (id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  request_type public.edit_request_type NOT NULL,
  status public.edit_request_status NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}',
  target_member_id UUID REFERENCES public.family_members (id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES public.profiles (id),
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_edit_requests_family_status ON public.edit_requests (family_id, status);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families (id) ON DELETE SET NULL,
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_family ON public.audit_logs (family_id, created_at DESC);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  link_url TEXT,
  family_id UUID REFERENCES public.families (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.public_family_links (
  family_id UUID PRIMARY KEY REFERENCES public.families (id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_families_updated BEFORE UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_family_members_updated BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit: append-only from triggers / definer functions
CREATE OR REPLACE FUNCTION public.append_audit(
  p_family_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_metadata JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (family_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_family_id, p_actor_id, p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.append_audit(UUID, UUID, TEXT, TEXT, UUID, JSONB) FROM PUBLIC;

REVOKE INSERT ON public.audit_logs FROM authenticated;
REVOKE INSERT ON public.audit_logs FROM anon;

CREATE OR REPLACE FUNCTION public.audit_family_members()
RETURNS TRIGGER AS $$
DECLARE
  fid UUID;
  aid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    fid := OLD.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MEMBER_DELETED', 'family_member', OLD.id,
      jsonb_build_object('before', to_jsonb(OLD)));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    fid := NEW.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MEMBER_UPDATED', 'family_member', NEW.id,
      jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN NEW;
  ELSE
    fid := NEW.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MEMBER_CREATED', 'family_member', NEW.id,
      jsonb_build_object('after', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_audit_family_members
  AFTER INSERT OR UPDATE OR DELETE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_family_members();

CREATE OR REPLACE FUNCTION public.audit_parent_child()
RETURNS TRIGGER AS $$
DECLARE
  fid UUID;
  aid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    fid := OLD.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'RELATIONSHIP_REMOVED', 'parent_child', OLD.id,
      jsonb_build_object('before', to_jsonb(OLD)));
    RETURN OLD;
  ELSE
    fid := NEW.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'RELATIONSHIP_ADDED', 'parent_child', NEW.id,
      jsonb_build_object('after', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_audit_parent_child
  AFTER INSERT OR DELETE ON public.parent_child_relationships
  FOR EACH ROW EXECUTE FUNCTION public.audit_parent_child();

CREATE OR REPLACE FUNCTION public.audit_marriages()
RETURNS TRIGGER AS $$
DECLARE
  fid UUID;
  aid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    fid := OLD.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MARRIAGE_REMOVED', 'marriage', OLD.id,
      jsonb_build_object('before', to_jsonb(OLD)));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    fid := NEW.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MARRIAGE_UPDATED', 'marriage', NEW.id,
      jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN NEW;
  ELSE
    fid := NEW.family_id;
    aid := auth.uid();
    PERFORM public.append_audit(fid, aid, 'MARRIAGE_ADDED', 'marriage', NEW.id,
      jsonb_build_object('after', to_jsonb(NEW)));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_audit_marriages
  AFTER INSERT OR UPDATE OR DELETE ON public.marriages
  FOR EACH ROW EXECUTE FUNCTION public.audit_marriages();

CREATE OR REPLACE FUNCTION public.audit_families_visibility()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.visibility IS DISTINCT FROM NEW.visibility THEN
    PERFORM public.append_audit(NEW.id, auth.uid(), 'FAMILY_VISIBILITY_CHANGED', 'family', NEW.id,
      jsonb_build_object('before', OLD.visibility::text, 'after', NEW.visibility::text));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_audit_families_visibility
  AFTER UPDATE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.audit_families_visibility();

CREATE OR REPLACE FUNCTION public.audit_edit_requests()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.append_audit(NEW.family_id, NEW.requester_id, 'EDIT_REQUEST_CREATED', 'edit_request', NEW.id,
      jsonb_build_object('type', NEW.request_type::text, 'payload', NEW.payload));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.append_audit(NEW.family_id, auth.uid(), 'EDIT_REQUEST_APPROVED', 'edit_request', NEW.id,
        jsonb_build_object('note', NEW.reviewer_note));
    ELSIF NEW.status = 'rejected' THEN
      PERFORM public.append_audit(NEW.family_id, auth.uid(), 'EDIT_REQUEST_REJECTED', 'edit_request', NEW.id,
        jsonb_build_object('note', NEW.reviewer_note));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER tr_audit_edit_requests
  AFTER INSERT OR UPDATE ON public.edit_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_edit_requests();

-- New user → profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helpers for RLS
CREATE OR REPLACE FUNCTION public.is_super_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_super_admin FROM public.profiles p WHERE p.id = uid), FALSE);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_family_member(fid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_memberships m
    WHERE m.family_id = fid AND m.user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_family_owner_or_admin(fid UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.family_memberships m
    WHERE m.family_id = fid AND m.user_id = uid AND m.role IN ('owner', 'admin')
  ) OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = fid AND f.owner_id = uid);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_family_links ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_self ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Families
CREATE POLICY families_select_member ON public.families FOR SELECT
  USING (
    deleted_at IS NULL AND (
      public.is_super_admin(auth.uid())
      OR public.is_family_member(id, auth.uid())
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY families_insert_authenticated ON public.families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY families_update_owner ON public.families FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(id, auth.uid())
    OR owner_id = auth.uid()
  );

-- Memberships
CREATE POLICY memberships_select ON public.family_memberships FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR user_id = auth.uid()
    OR public.is_family_member(family_id, auth.uid())
  );

CREATE POLICY memberships_insert_owner ON public.family_memberships FOR INSERT
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

CREATE POLICY memberships_delete_owner ON public.family_memberships FOR DELETE
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

-- Family members
CREATE POLICY fm_select ON public.family_members FOR SELECT
  USING (
    deleted_at IS NULL AND (
      public.is_super_admin(auth.uid())
      OR public.is_family_member(family_id, auth.uid())
      OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
    )
  );

CREATE POLICY fm_mutate_owner ON public.family_members FOR ALL
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

-- Parent/child
CREATE POLICY pc_select ON public.parent_child_relationships FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_member(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  );

CREATE POLICY pc_mutate_owner ON public.parent_child_relationships FOR ALL
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

-- Marriages
CREATE POLICY m_select ON public.marriages FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_member(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  );

CREATE POLICY m_mutate_owner ON public.marriages FOR ALL
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

-- Edit requests
CREATE POLICY er_select ON public.edit_requests FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_member(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  );

CREATE POLICY er_insert_member ON public.edit_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND public.is_family_member(family_id, auth.uid())
  );

CREATE POLICY er_update_owner ON public.edit_requests FOR UPDATE
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
  );

-- Audit logs (read for family participants; inserts only via append_audit)
CREATE POLICY al_select ON public.audit_logs FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR (
      family_id IS NOT NULL AND (
        public.is_family_member(family_id, auth.uid())
        OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
      )
    )
  );

-- Notifications
CREATE POLICY notif_select ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY notif_update ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY notif_insert ON public.notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.family_memberships m1
      WHERE m1.user_id = auth.uid()
        AND m1.role IN ('owner', 'admin')
        AND EXISTS (
          SELECT 1 FROM public.family_memberships m2
          WHERE m2.family_id = m1.family_id AND m2.user_id = notifications.user_id
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = notifications.family_id
        AND f.owner_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.family_memberships m2
          WHERE m2.family_id = f.id AND m2.user_id = notifications.user_id
        )
    )
  );

-- Public links
CREATE POLICY pfl_select ON public.public_family_links FOR SELECT
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  );

CREATE POLICY pfl_mutate ON public.public_family_links FOR ALL
  USING (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_family_owner_or_admin(family_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.families f WHERE f.id = family_id AND f.owner_id = auth.uid())
  );

-- Public read RPC (anon + authenticated)
CREATE OR REPLACE FUNCTION public.get_public_family(p_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  fam public.families%ROWTYPE;
  link public.public_family_links%ROWTYPE;
  result JSONB;
BEGIN
  SELECT * INTO link FROM public.public_family_links WHERE slug = p_slug AND is_enabled = TRUE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO fam FROM public.families WHERE id = link.family_id AND deleted_at IS NULL AND visibility = 'public_link';
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'family', jsonb_build_object(
      'id', fam.id,
      'name', fam.name,
      'description', fam.description,
      'place_of_origin', fam.place_of_origin,
      'image_url', fam.image_url
    ),
    'members', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'full_name', m.full_name,
          'gender', m.gender::text,
          'is_deceased', m.is_deceased,
          'date_of_birth', CASE WHEN m.is_deceased OR NOT fam.hide_living_sensitive THEN m.date_of_birth ELSE NULL END,
          'date_of_death', m.date_of_death,
          'place_of_birth', CASE WHEN m.is_deceased OR NOT fam.hide_living_sensitive THEN m.place_of_birth ELSE NULL END,
          'occupation', CASE WHEN m.is_deceased OR NOT fam.hide_living_sensitive THEN m.occupation ELSE NULL END,
          'biography', CASE WHEN m.is_deceased OR NOT fam.hide_living_sensitive THEN m.biography ELSE NULL END,
          'profile_image_url', m.profile_image_url
        )
      )
      FROM public.family_members m
      WHERE m.family_id = fam.id AND m.deleted_at IS NULL
    ), '[]'::jsonb),
    'parent_child', COALESCE((
      SELECT jsonb_agg(to_jsonb(pc.*))
      FROM public.parent_child_relationships pc
      WHERE pc.family_id = fam.id
    ), '[]'::jsonb),
    'marriages', COALESCE((
      SELECT jsonb_agg(to_jsonb(mr.*))
      FROM public.marriages mr
      WHERE mr.family_id = fam.id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_family(TEXT) TO anon, authenticated;
