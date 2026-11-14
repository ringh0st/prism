-- Make the owner an admin.
-- Run in Supabase → SQL Editor AFTER schema.sql, and after signing in to Lumipals with Google at least once.
-- Change the email if you sign in with a different Google account.
-- Safe to run more than once. It also creates the profile if you signed in before running schema.sql.

insert into public.profiles (id, display_name, avatar_url, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url',
  true
from auth.users u
where u.email = 'ringhost@gmail.com'
on conflict (id) do update set is_admin = true;

-- Check: should show one row with is_admin = true
select u.email, p.display_name, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'ringhost@gmail.com';
