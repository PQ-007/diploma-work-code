# P0-07 Remove project-management tools from projects

## Goal
Projects are a showcase, not a task tracker. Remove Kanban, Gantt, Sections and Milestones.
Keep: overview, files, members, likes, comments, updates (devlog).

## Context
- Components: `app/project/components/KanbanBoard.tsx`, `ProjectGanttChart.tsx`, `SectionEditor.tsx`, `MilestoneTracker.tsx`
- API writes `project_sections` on create: `app/api/projects/route.ts` (~line 293)
- API reads `project_sections` and `project_milestones`: `app/api/projects/[slug]/route.ts` (~lines 78–87)
- Types in `app/project/types.ts`; the placeholder data in `app/project/[slug]/page.tsx` contains kanban tasks

## Do
- Delete the four components and their tabs/sections in `app/project/[slug]/page.tsx` and `app/project/create/page.tsx`.
- Remove the `project_sections` insert on create and the sections/milestones reads in the slug route.
- Remove related types and locale keys (all three locales).
- If `ProjectLogTimeline` or `ProjectUpdatesPanel` depend on milestones, keep them working with updates only and say so.

## Don't
- Don't remove the placeholder-project fallback yet (that is a Phase 1 task) — but do remove kanban/milestone data from it.
- No database changes.

## Done when
- Creating a project works and the project page shows overview, files, members, comments, updates.
- `grep -rn "project_sections\|project_milestones\|Kanban\|Gantt" app lib components` returns nothing.
- lint + build pass.
