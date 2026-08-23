CREATE OR REPLACE FUNCTION public.is_responder(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.volunteers WHERE id = _user_id)
    OR EXISTS (SELECT 1 FROM public.organizations WHERE id = _user_id AND approval_status = 'approved')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_responder(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_responder(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS assignments_public_select ON public.assignments;
DROP POLICY IF EXISTS assignments_auth_write ON public.assignments;
DROP POLICY IF EXISTS assignments_auth_update ON public.assignments;

REVOKE ALL ON public.assignments FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

CREATE POLICY assignments_select_involved ON public.assignments
FOR SELECT TO authenticated
USING (responder_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY assignments_insert_responders ON public.assignments
FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR public.is_responder(auth.uid()));

CREATE POLICY assignments_update_involved ON public.assignments
FOR UPDATE TO authenticated
USING (responder_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_responder(auth.uid()))
WITH CHECK (responder_id = auth.uid() OR public.is_admin(auth.uid()) OR public.is_responder(auth.uid()));