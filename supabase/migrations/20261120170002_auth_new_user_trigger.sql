-- Create a profiles row whenever someone signs up.
--
-- The baseline was dumped with `--schema public`, so it has public.handle_new_user() but not the
-- trigger on auth.users that calls it. Without this, sign-up on a fresh project (e.g. dev) creates
-- an auth user with no profile. Copied from the live project's auth schema on 2026-11-20.
--
-- CREATE OR REPLACE makes this safe on the live project too, where the trigger already exists.

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
