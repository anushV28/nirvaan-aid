DROP POLICY IF EXISTS "requests_public_update" ON public.requests;

REVOKE UPDATE ON public.requests FROM anon;

CREATE POLICY "requests_responder_update"
ON public.requests
FOR UPDATE
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR public.is_responder(auth.uid())
  OR assigned_responder_id = auth.uid()
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.is_responder(auth.uid())
  OR assigned_responder_id = auth.uid()
);