ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS photo_url text;

CREATE POLICY "Anyone can upload a request photo"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'request-photos');

CREATE POLICY "Signed-in responders can view request photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'request-photos');