-- Run once in Supabase → SQL Editor AFTER you have signed in to Prism with Google at least once.
-- Replace the email if you sign in with a different Google account.
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'ringhost@gmail.com');

-- Check: should return one row with is_admin = true
select p.display_name, u.email, p.is_admin
from public.profiles p join auth.users u on u.id = p.id
where p.is_admin;
