
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_phone text NOT NULL,
  relationship text NOT NULL DEFAULT 'self',
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  landmark text,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  urgency text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  assigned_responder_id uuid,
  assigned_responder_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_public_insert" ON public.requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "requests_public_select" ON public.requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "requests_public_update" ON public.requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_type text NOT NULL DEFAULT 'individual',
  name text NOT NULL,
  contact_phone text NOT NULL,
  member_count integer,
  skills text[] NOT NULL DEFAULT '{}',
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  status text NOT NULL DEFAULT 'available',
  last_active timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.volunteers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteers TO authenticated;
GRANT ALL ON public.volunteers TO service_role;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "volunteers_public_select" ON public.volunteers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "volunteers_own_insert" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "volunteers_own_update" ON public.volunteers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "volunteers_own_delete" ON public.volunteers FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL,
  registration_number text,
  contact_person text NOT NULL,
  contact_phone text NOT NULL,
  email text NOT NULL,
  area_of_operation text,
  resources_available text,
  approval_status text NOT NULL DEFAULT 'pending_approval',
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admins (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT 'Admin'
);
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select_self" ON public.admins FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE id = _user_id);
$$;

CREATE POLICY "orgs_public_select_approved" ON public.organizations FOR SELECT TO anon, authenticated USING (approval_status = 'approved');
CREATE POLICY "orgs_select_own" ON public.organizations FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "orgs_admin_select" ON public.organizations FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "orgs_own_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (auth.uid() = id AND approval_status = 'pending_approval');
CREATE POLICY "orgs_own_update" ON public.organizations FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "orgs_admin_update" ON public.organizations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NOT public.is_admin(auth.uid()) THEN
    NEW.approval_status := OLD.approval_status;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER organizations_prevent_self_approval BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL,
  responder_type text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT ON public.assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments_public_select" ON public.assignments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "assignments_auth_write" ON public.assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "assignments_auth_update" ON public.assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER requests_touch_updated_at BEFORE UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER TABLE public.volunteers REPLICA IDENTITY FULL;
ALTER TABLE public.organizations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
