# P1-07 Email delivery (password reset, sign-up confirmation)

## Why
Found 2026-11-21: no email reaches students. `RESEND_API_KEY` is rejected by Resend ("API key is invalid"),
`RESEND_FROM_EMAIL` is empty (so `app/api/auth/recover/route.ts` skips its Resend fallback), and Supabase's built-in
mailer only delivers to members of the Supabase team — not to `@nmct.edu.mn`. Result: "Forgot password" and any
confirmation email silently go nowhere. Needed before the bot competition invites students to sign up.

## You do (accounts, DNS, dashboards — not code)
1. **Resend** (resend.com): sign in (or create the account) → **Domains → Add domain** → `futurehub.works`.
   Add the DNS records Resend shows (SPF/DKIM TXT, MX for the bounce subdomain) at the domain's DNS provider,
   wait for **Verified**.
2. Resend → **API Keys → Create** (permission: Sending access, domain `futurehub.works`). Copy it once.
3. **Vercel** → project → Settings → Environment Variables (Production):
   - `RESEND_API_KEY` = the new key
   - `RESEND_FROM_EMAIL` = `FutureHub <noreply@futurehub.works>`
   Then **Redeploy** the latest production deployment (env changes only apply to new deploys).
4. **Supabase** → Diploma work → Authentication → **SMTP Settings** → Enable custom SMTP:
   host `smtp.resend.com`, port `465`, username `resend`, password = the API key,
   sender email `noreply@futurehub.works`, sender name `FutureHub`. Save.
   (This makes Supabase's own emails — confirmations, magic links, its reset mail — go through Resend too.)
5. Update `.env.live.local` locally with the same two values, so local tests against live behave like production.

## Claude Code can help with
- Checking the result: Resend `GET /domains` shows `verified`; a reset request to a test account arrives; Resend's
  email log shows `delivered`.
- Translating/branding the reset email text in `app/api/auth/recover/route.ts` (mn/en/ja) if you want.

## Done when
- On futurehub.works, **Forgot password** with a student code delivers an email to that `@nmct.edu.mn` inbox, and the
  link lets you set a new password.
- Resend shows the email as delivered (not bounced).
- Optional: with "Confirm email" turned on, a new sign-up receives its confirmation email.
