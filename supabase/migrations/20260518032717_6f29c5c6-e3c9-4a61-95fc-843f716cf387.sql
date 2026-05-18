
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_main boolean NOT NULL DEFAULT false;

-- Promote any pre-existing admin to main admin so the system has at least one
UPDATE public.user_roles SET is_main = true WHERE role = 'admin' AND is_main = false;

-- Storage bucket for plan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-images', 'plan-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
DROP POLICY IF EXISTS "Plan images are publicly readable" ON storage.objects;
CREATE POLICY "Plan images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'plan-images');

-- Admin write
DROP POLICY IF EXISTS "Admins can upload plan images" ON storage.objects;
CREATE POLICY "Admins can upload plan images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'plan-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update plan images" ON storage.objects;
CREATE POLICY "Admins can update plan images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'plan-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete plan images" ON storage.objects;
CREATE POLICY "Admins can delete plan images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'plan-images' AND public.has_role(auth.uid(), 'admin'));
