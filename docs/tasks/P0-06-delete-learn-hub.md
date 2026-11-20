# P0-06 Delete the Learn hub

## Goal
The Learn hub is ~3,300 lines of hard-coded content. Delete it; learning content will come from Articles.

## Delete
- `app/learn/` (hub, algorithm, data-structure, programming-lang, resources, [slug])
- `lib/data/courses.ts` (only used by `app/learn/[slug]`)

## Clean up
- Grep for `/learn` links and `lib/data/courses` imports anywhere else (home/feed, sidebar comments, CreateButton, footer) and remove them.
- The sidebar has a commented-out Learn block — delete the comment block.
- Remove locale keys used only by Learn pages (all three locales).
- `/setup` and `/knowledge-tree` are NOT part of this task.

## Done when
- `grep -rn "/learn\|lib/data/courses" app components lib` returns nothing.
- Visiting `/learn` gives the normal 404 page.
- lint + build pass.
