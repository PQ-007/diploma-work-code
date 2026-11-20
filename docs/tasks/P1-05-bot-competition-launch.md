# P1-05 Bot competition launch on live

## Requires
P1-03 and P1-04 merged and tested on dev. **Deadline: Dec 23** (aim for Dec 20).

## You do
1. Follow `docs/DEPLOY.md`: deploy, then `npx supabase db push --remote` (CLI v3 targets a local database without `--remote`) the competitions migration to live, relink to dev.
2. Make sure your account (and any co-organizer) has `profiles.role = 'teacher'` or `admin` on live (SQL editor; the role column is protected from the API).
3. On live, `/competition/new`:
   - kind Bot, categories `bot` and `human_vs_bot`, max team size 3
   - sign-up opens now, closes **Jan 4, 23:59**; competition **Jan 6**
   - rules in mn/en/ja: one function, per-move time limit, same secret sequences for everyone, runs on the organizer's computer,
     score = average over N secret sequences, tie → lower total thinking time; starter bot link (from the runner repo)
4. Set status `open`, share the link with the club.

## Claude Code can help with
- Drafting the rules text in three languages from the club plan (you review it).
- A checklist page in `docs/launch/bot-competition.md` for the day itself: export entries CSV → run → import results → publish.

## Done when
- A real club member signs up a team on futurehub.works.
