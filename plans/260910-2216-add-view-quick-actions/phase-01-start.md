---
title: "Phase 1: Quick-create actions in both view modals"
status: in-progress
---

# Phase 1: Quick-create actions in both view modals

## Overview

Add two quick-create buttons — "Assigned to me" and "Kanban board" — to the top of both
`AddViewDialog` components. Each button builds a `CreateViewPayload` locally (not derived from
the shared `useFilterStore`/`useDisplaySettingsStore` live state, to avoid leaking into the page's
own filter bar), calls the existing `useCreateView` mutation directly, closes the dialog, and
navigates to the new view — mirroring the tail end of the existing `handleSave`.

## Key Insights (from codebase read)

- `apps/web/components/layout/headers/project/add-view-dialog.tsx` (screenshot modal) and
  `apps/web/components/layout/headers/issues/add-view-dialog.tsx` are near-identical duplicates —
  same imports, same `handleSave` shape. Only differ in the scoping prop
  (`projectId` vs `teamId`), payload field (`projectId` vs `teamId`), dialog title/description
  text, and header text ("New project view" vs "New view").
- `useFilterStore` (`store/filter-store.ts`) is a `nuqs` URL-synced store shared with the whole
  page — writing to it from the modal would change the page's live `?filters=` query param as a
  side effect. Quick-create must NOT call `setFilters`; build the filter array as a local constant
  instead.
- `useDisplaySettingsStore` (`store/display-settings-store.ts`) defaults already use
  `grouping: 'status'`, so board-style views naturally group by status. Still set `grouping:
  'status'` explicitly in the quick-create payload (don't trust the live store, since the user may
  have changed grouping on the page) — that's what makes both quick actions "kanban board" style.
- Current user id for "Assigned to me" comes from `useAuthStore().user.id`
  (`store/auth-store.ts`, `AuthUser.id`). `Member.id` in `services/members.service.ts` is the same
  id space (both are user ids), matching what the `assignee` filter column
  (`components/common/issues/issue-filter-columns.tsx`) expects as a filter value.
- Filter shape: `FilterModel` from `components/data-table-filter/core/types.ts` —
  `{ columnId: string; type: ColumnDataType; operator; values }`. For assignee:
  `{ columnId: 'assignee', type: 'option', operator: 'is', values: [userId] }` (`'is'` confirmed
  as a valid `OptionFilterOperator` in `core/operators.ts`).
- `CreateViewPayload` / `CustomViewFilter` types live in `services/views.service.ts`. `layout:
  'grid'` is what the existing UI labels "Board" (see the Layout selector buttons already in both
  files).
- `useCreateView()` (`hooks/queries/use-views-query.ts`) already shows a success/error toast and
  invalidates the views query list on its own — no extra toast wiring needed in the component.

## Requirements

- Functional:
  - Two buttons/cards near the top of the modal body (below the `DialogHeader`, above "View
    name"): "Assigned to me" and "Kanban board".
  - Clicking either: builds payload → `createViewMutation.mutateAsync(payload)` → on success,
    close dialog, reset `name`/`description` local state, `router.push` to `?view=<id>`.
  - "Assigned to me" payload: `layout: 'grid'`, `filter.grouping: 'status'`, `filter.filters:
    [{ columnId: 'assignee', type: 'option', operator: 'is', values: [user.id] }]`.
  - "Kanban board" payload: `layout: 'grid'`, `filter.grouping: 'status'`, `filter.filters: []`.
  - Both payloads pass through the other display fields (`ordering`, `orderCompletedByRecency`,
    `completedIssues`, `showSubIssues`, `nestedSubIssues`, `showEmptyGroups`,
    `showEmptyColumns`, `displayProperties`) from the live `useDisplaySettingsStore()` hook already
    used by `handleSave` — only `grouping` and `filters` are overridden by the preset.
  - "Assigned to me" button is `disabled` when `useAuthStore().user?.id` is falsy (defensive; this
    modal should never be reachable unauthenticated, but avoid an undefined `values: [undefined]`
    filter if it happens).
  - Both quick-create buttons are `disabled` while `createViewMutation.isPending` (same guard the
    "Save view" submit button already uses).
  - Manual form section (name/icon/layout/include-filters/Save/Cancel) is unchanged — quick
    actions are additive, not a replacement path.
- Non-functional:
  - No new dependency on `useFilterStore.setFilters` or `useDisplaySettingsStore` setters from the
    quick-create path (read-only use of the live display settings hook is fine; the store itself
    must not be mutated by this feature).
  - Extract the shared "create → close → reset → navigate" tail (currently duplicated inline in
    `handleSave`) into one local helper function per file, reused by `handleSave` and the new
    `handleQuickCreate`, so the two entry points don't fork that logic.

## Architecture

Both files get the same shape of change:

```
AddViewDialog
├── existing state (name, description, icon, layout, includeSettings)
├── existing hooks (createViewMutation, filters/displaySettings via useFilterStore/useDisplaySettingsStore, router, pathname)
├── + useAuthStore() → user
├── + async function submitView(payload: CreateViewPayload)   // shared tail: mutateAsync → close → reset → navigate
├── handleSave(e)        → builds payload from form state, calls submitView
├── + handleQuickCreate(preset: 'assigned-to-me' | 'kanban-board')
│     → builds payload from preset (ignores form state), calls submitView
└── render
      ├── DialogHeader (unchanged)
      ├── + Quick actions row (2 buttons) + divider
      └── existing form body (unchanged)
```

Payload construction for `handleQuickCreate` (identical in both files except the scoping field):

```ts
// project/add-view-dialog.tsx uses projectId; issues/add-view-dialog.tsx uses teamId
const isAssignedToMe = preset === 'assigned-to-me';

if (isAssignedToMe && !user?.id) return; // defensive guard, see Requirements

const payload: CreateViewPayload = {
   name: isAssignedToMe ? 'Assigned to me' : 'Kanban Board',
   description: '',
   icon: isAssignedToMe ? '🙋' : '🗂️',
   projectId, // or teamId in the issues variant
   layout: 'grid',
   type: 'issue',
   filter: {
      filters: isAssignedToMe
         ? [{ columnId: 'assignee', type: 'option', operator: 'is', values: [user!.id] }]
         : [],
      grouping: 'status',
      ordering: displaySettings.ordering,
      orderCompletedByRecency: displaySettings.orderCompletedByRecency,
      completedIssues: displaySettings.completedIssues,
      showSubIssues: displaySettings.showSubIssues,
      nestedSubIssues: displaySettings.nestedSubIssues,
      showEmptyGroups: displaySettings.showEmptyGroups,
      showEmptyColumns: displaySettings.showEmptyColumns,
      displayProperties: displaySettings.displayProperties,
   },
};

await submitView(payload);
```

`submitView` is the extracted shared tail:

```ts
const submitView = async (payload: CreateViewPayload) => {
   try {
      const newView = await createViewMutation.mutateAsync(payload);
      onOpenChange(false);
      setName('');
      setDescription('');
      if (newView?.id) {
         router.push(`${pathname}?view=${newView.id}`);
      }
   } catch (err) {
      console.error('Failed to create view:', err);
   }
};
```

`handleSave` becomes:

```ts
const handleSave = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!name.trim()) return;

   const filterPayload = includeSettings ? { filters, grouping: displaySettings.grouping, /* ...unchanged... */ } : {};

   await submitView({
      name: name.trim(),
      description: description.trim(),
      icon,
      projectId, // or teamId
      layout,
      type: 'issue',
      filter: filterPayload,
   });
};
```

Quick-actions UI (identical structure in both files):

```tsx
<div className="px-5 pt-4 space-y-2">
   <div className="grid grid-cols-2 gap-2">
      <button
         type="button"
         onClick={() => handleQuickCreate('assigned-to-me')}
         disabled={!user?.id || createViewMutation.isPending}
         className="flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium border border-border/60 text-muted-foreground hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
         <CircleUserRound className="size-3.5" />
         Assigned to me
      </button>
      <button
         type="button"
         onClick={() => handleQuickCreate('kanban-board')}
         disabled={createViewMutation.isPending}
         className="flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-medium border border-border/60 text-muted-foreground hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
         <LayoutGrid className="size-3.5" />
         Kanban board
      </button>
   </div>
   <div className="relative flex items-center py-1">
      <div className="flex-1 border-t border-border/60" />
      <span className="px-2 text-[10px] uppercase tracking-wide text-muted-foreground">or configure manually</span>
      <div className="flex-1 border-t border-border/60" />
   </div>
</div>
```

Placed between `DialogHeader` and the existing `<div className="p-5 space-y-4">` form body (which
already starts with the "View name" field) — no change to the form body markup itself; just insert
the block above it inside the `<form>`.

## Related Code Files

- Modify: `apps/web/components/layout/headers/project/add-view-dialog.tsx`
- Modify: `apps/web/components/layout/headers/issues/add-view-dialog.tsx`

No new files — both changes are additive edits to existing components. No backend/service changes
(`CreateViewPayload` already supports everything needed).

## Implementation Steps

1. In `project/add-view-dialog.tsx`:
   1. Add `import { useAuthStore } from '@/store/auth-store';` and `import { CircleUserRound } from 'lucide-react';` (add to the existing `lucide-react` import line alongside `LayoutGrid, LayoutList`).
   2. Add `const user = useAuthStore((state) => state.user);` near the other hooks.
   3. Extract `submitView` from the tail of the current `handleSave` (see Architecture above); update `handleSave` to call it.
   4. Add `handleQuickCreate(preset: 'assigned-to-me' | 'kanban-board')` per the Architecture snippet, using `projectId`.
   5. Insert the quick-actions JSX block right after `<DialogHeader>...</DialogHeader>` and before the `<div className="p-5 space-y-4">` form body, inside the same `<form>`.
2. Repeat step 1 verbatim in `issues/add-view-dialog.tsx`, swapping `projectId` → `teamId` in the payload's scoping field (prop itself is already named `teamId` in that file).
3. Manually verify in the browser (dev server) for one project and one team:
   - Open the modal, click "Assigned to me" → view is created named "Assigned to me", Board layout, closes modal, navigates to `?view=<id>`, and the board is grouped by status with only the current user's issues.
   - Repeat, click "Kanban board" → same but no assignee filter, all issues shown grouped by status.
   - Confirm the page's own filter bar / `?filters=` query param is untouched after either quick action (open browser devtools URL bar — no `filters=` param appears/changes from this action).
   - Confirm manual flow (typing a name, picking icon/layout, "Save view") still works unchanged.
4. Run the project's type-check script (see `package.json` — likely `pnpm --filter web type-check` or `tsc --noEmit` in `apps/web`) and fix any type errors.

## Todo

- [x] Extract shared `submitView` helper in `project/add-view-dialog.tsx`, wire `handleSave` to it
- [x] Add `handleQuickCreate` + quick-actions UI in `project/add-view-dialog.tsx`
- [x] Extract shared `submitView` helper in `issues/add-view-dialog.tsx`, wire `handleSave` to it
- [x] Add `handleQuickCreate` + quick-actions UI in `issues/add-view-dialog.tsx`
- [ ] Manual browser verification (both modals, both presets, filter-bar isolation check) —
      **not done**: modal is behind login, backend (auth/project-service) not running in this
      session; user chose to stop at code-review-verified level instead of booting full backend
      stack (see plan.md Decisions). Dev server compiled clean, no console errors on the app shell.
- [x] Type-check passes (`tsc --noEmit`: 0 new errors, 1 pre-existing unrelated error in
      `app/layout.tsx`)

## Success Criteria

- Both modals show "Assigned to me" and "Kanban board" quick-create buttons above the manual form.
- Clicking either creates the view (Board layout, grouped by status, correct filter), closes the
  modal, and navigates to it — verified in-browser for both project and issues contexts.
- Quick-create never mutates `useFilterStore` / the page's `?filters=` URL state.
- Existing manual "Save view" flow is unaffected (regression-free).
- No new type errors.

## Risk Assessment

- **Duplicated logic across 2 files**: pre-existing (both files were already full duplicates
  before this change) — not introduced by this phase, but this phase does duplicate the new logic
  too, matching the existing pattern rather than introducing a shared component the rest of the
  codebase doesn't have. Acceptable given YAGNI/surgical-change constraints; not in scope to
  de-duplicate the two dialogs into one shared component.
- **Stale `user` at click time**: `useAuthStore` is a zustand hook, always reflects current state —
  no staleness risk.
- **Icon choice (🙋 / 🗂️) is a judgment call**, not specified by the user — easy to swap if the
  user wants different emoji; doesn't affect behavior.
