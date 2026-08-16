ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS is_sos boolean NOT NULL DEFAULT false;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_score integer,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.zone_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  area_name text NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  radius_km double precision NOT NULL DEFAULT 3,
  category text NOT NULL DEFAULT 'any',
  urgency text NOT NULL DEFAULT 'any',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.zone_allocations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zone_allocations TO authenticated;
GRANT ALL ON public.zone_allocations TO service_role;

ALTER TABLE public.zone_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY zones_public_select ON public.zone_allocations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY zones_admin_insert ON public.zone_allocations FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY zones_admin_update ON public.zone_allocations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY zones_admin_delete ON public.zone_allocations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.km_between(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

CREATE OR REPLACE FUNCTION public.prevent_zone_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  clash record;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT z.*, o.org_name INTO clash
  FROM public.zone_allocations z
  JOIN public.organizations o ON o.id = z.org_id
  WHERE z.status = 'active'
    AND z.id IS DISTINCT FROM NEW.id
    AND z.org_id IS DISTINCT FROM NEW.org_id
    AND (z.category = NEW.category OR z.category = 'any' OR NEW.category = 'any')
    AND (z.urgency = NEW.urgency OR z.urgency = 'any' OR NEW.urgency = 'any')
    AND public.km_between(z.center_lat, z.center_lng, NEW.center_lat, NEW.center_lng)
        < (z.radius_km + NEW.radius_km)
  LIMIT 1;

  IF clash IS NOT NULL THEN
    RAISE EXCEPTION 'Area overlaps with % already covering "%" for this category and urgency', clash.org_name, clash.area_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zone_allocations_prevent_overlap ON public.zone_allocations;
CREATE TRIGGER zone_allocations_prevent_overlap
BEFORE INSERT OR UPDATE ON public.zone_allocations
FOR EACH ROW EXECUTE FUNCTION public.prevent_zone_overlap();

REVOKE ALL ON FUNCTION public.km_between(double precision, double precision, double precision, double precision) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_zone_overlap() FROM anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.zone_allocations;