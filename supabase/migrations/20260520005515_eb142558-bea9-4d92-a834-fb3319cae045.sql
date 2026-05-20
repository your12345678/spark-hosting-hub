DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('123mohit123@gmail.com','lovable@admin.com','admin@gmail.com')
);
DELETE FROM auth.users WHERE email IN ('123mohit123@gmail.com','lovable@admin.com','admin@gmail.com');