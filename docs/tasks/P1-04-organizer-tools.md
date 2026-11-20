# P1-04 Organizer tools and results import

## Requires
P1-02. Can run in parallel with P1-03 (different files).

## Goal
Staff can create and run a competition from the site, and turn the bot runner's `results.csv` into published results in a minute.

## Do
- `/competition/new` and `/competition/[slug]/manage` — staff only (others get 404). Use the existing form components.
  - Edit: slug, kind, status, title/summary/rules in mn/en/ja (tabs per language), cover image (existing Cloudinary upload),
    categories (chips), max team size, the four dates.
  - Entries table: team, members, category, status; actions: disqualify (with note), restore.
  - Results: editable score/tiebreak/note per entry, **and** "Import CSV": paste or upload a file in this exact format:
    ```
    entry_id,category,score,tiebreak_ms,note
    12,bot,18340.5,8123,
    15,bot,18340.5,9050,timeout on seq 4
    ```
    Show a preview with matched teams and errors (unknown id, wrong category, not a number) before saving.
    Also "Export entries CSV" (entry_id, category, team, members, repository_url — the column on `projects` is `repository_url`) so the runner knows which bot is which.
  - Buttons: "Recompute ranks" and "Publish results" (confirm dialog; unpublish allowed).
- Add a "Manage" link on `/competition/[slug]` for staff.

## Done when
- On dev: create a competition, two test entries, import a CSV with a tie on score (tiebreak decides), publish → public page shows the right ranks.
- A non-staff account gets 404 on manage pages and 403 from the API.
- lint + build pass.
