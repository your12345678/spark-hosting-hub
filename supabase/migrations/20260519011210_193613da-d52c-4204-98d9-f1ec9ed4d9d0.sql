
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- Promote lovable@admin.com to owner (and main)
UPDATE public.user_roles
SET is_owner = true, is_main = true
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) = 'lovable@admin.com'
) AND role = 'admin';

-- Ensure at most one owner via partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_single_owner_idx
ON public.user_roles ((true)) WHERE is_owner = true;
