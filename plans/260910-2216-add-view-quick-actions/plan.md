---
title: "add-view-quick-actions"
description: "Quick-create actions (Assigned to me, Kanban board) inside the New view modal"
status: pending
priority: P2
effort: "2-3h"
tags: [frontend, web, views]
created: 2026-09-10
---

# add-view-quick-actions

## Overview

The "New view" modal (project header and issues header — both `add-view-dialog.tsx`) currently
requires manually naming a view, picking an icon, picking List/Board layout, and toggling filters
before it can be saved. Add 2 one-click quick-create actions inside the modal:

- **Assigned to me** — board view, grouped by status, filtered to `assignee = current user`.
- **Kanban board** — board view, grouped by status, no filters.

Clicking either action creates the view immediately (reusing the existing `useCreateView`
mutation), closes the modal, and navigates to the new view — same end-state as filling the form
manually and clicking "Save view", just fewer clicks. The manual form stays untouched below the
quick actions for custom views.

## Decisions (locked via user interview 2026-09-10)

1. **Interaction model:** immediate create + close + navigate (not prefill-then-review).
2. **Scope:** both modals — `apps/web/components/layout/headers/project/add-view-dialog.tsx`
   (projectId-scoped) and `apps/web/components/layout/headers/issues/add-view-dialog.tsx`
   (teamId-scoped). Same UI/logic, mirrored per file's existing scoping field.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Add "Assigned to me" and "Kanban board" quick-create buttons to both view-creation modals | P1 |
| 2 | Quick-create must not mutate the page's live filter/display-settings state (no leaking into `?filters=` URL param) | P1 |
| 3 | Reuse existing `useCreateView` mutation + toast/navigation behavior, no new duplicated create path per file | P2 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Phase 1: Quick-create actions in both view modals](./phase-01-start.md) | In progress |

## Implementation Status (2026-09-10)

Code complete + code-reviewed (0 critical/high/medium findings; 1 low-priority polish applied —
loading-state label on quick-create buttons). Type-check and lint clean on both changed files.
**Not verified**: live click-through in the browser (create view → close modal → navigate → board
shows correct filter). The modal is behind login and this session's backend
(auth-service/project-service) wasn't running; user chose to stop at the code-review-verified
level rather than boot the full backend stack. Logic mirrors the pre-existing, already-working
`handleSave` path closely, which lowers risk, but this is not a substitute for an actual
click-through — do one before/soon after this ships.

## Success Criteria

- [x] In the project view modal, clicking "Assigned to me" creates a Board-layout, status-grouped
      view filtered to the signed-in user, closes the modal, and navigates to it. _(code-reviewed,
      not live-verified — see Implementation Status)_
- [x] In the project view modal, clicking "Kanban board" creates a Board-layout, status-grouped
      view with no filters, closes the modal, and navigates to it. _(code-reviewed, not
      live-verified)_
- [x] Same two actions work identically in the issues view modal, scoped to `teamId` instead of
      `projectId`. _(confirmed byte-for-byte in sync via diff)_
- [x] Quick-create does not write to `useFilterStore`/URL `?filters=` or otherwise change the
      underlying page's active filter bar. _(confirmed by code review — only reads, no setter
      calls)_
- [x] Manual "Save view" flow (name/icon/layout/include-filters) is unchanged. _(confirmed by
      diff — moved verbatim into extracted `submitView`)_
- [x] `tsc --noEmit` (or project's existing type-check script) passes with no new errors.

<!-- slug: add-view-quick-actions -->
