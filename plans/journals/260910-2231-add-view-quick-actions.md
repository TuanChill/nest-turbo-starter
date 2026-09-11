# Quick-create actions for view modal ("Assigned to me" / "Kanban board")

**Date**: 2026-09-10 22:31
**Severity**: Low
**Component**: apps/web — `add-view-dialog.tsx` (project + issues headers)
**Status**: Resolved (code-level), residual verification gap open

## What Happened

Added 2 one-click quick-create buttons to both `AddViewDialog` components (project-scoped and team-scoped, previously near-identical duplicates). Extracted a shared `submitView(payload)` tail (mutateAsync → close → reset → navigate) reused by the pre-existing `handleSave` and a new `handleQuickCreate(preset)`. Quick-create payloads are built as local constants, not derived from the page's `useFilterStore`/`useDisplaySettingsStore` — that's the one real design decision in this session, not incidental: those stores are `nuqs` URL-synced and shared with the whole page, so reading from them in the quick-create path would let a click on "Kanban board" silently rewrite the page's live `?filters=` query param. Isolating side effects mattered more than DRYing up the payload construction.

Scope was widened mid-session by user decision: apply to both dialogs, not just the one in the screenshot, since they're byte-for-byte structural duplicates.

## The Brutal Truth

Everything checks out on paper — tsc clean, eslint clean, code-reviewer subagent found 0 critical/high/medium — but nobody actually clicked the button in a browser. The backend (auth-service, project-service) wasn't running, only Postgres via docker, and booting the full stack was explicitly declined by the user to save time. So this ships on "mirrors the already-working handleSave path closely" as the safety argument, which is a reasonable bet, not proof. Worth being honest about that gap instead of quietly marking success criteria done.

## Technical Details

- Files changed: `apps/web/components/layout/headers/project/add-view-dialog.tsx`, `apps/web/components/layout/headers/issues/add-view-dialog.tsx`
- Filter payload for "Assigned to me": `{ columnId: 'assignee', type: 'option', operator: 'is', values: [user.id] }`
- `tsc --noEmit`: 0 new errors (1 pre-existing unrelated error in `app/layout.tsx` re: globals.css)
- code-reviewer subagent's configured default model `ag/gemini-3.8-flash-high` returned `model_not_found` (404) on first spawn — had to retry with explicit `model: sonnet` override to get the review to run at all.

## What We Tried

- Attempted live browser verification via the Browser pane's preview_start. It resolves `.claude/launch.json` against `/Users/tuanchill/Desktop/circle` (the outer non-git parent directory) rather than `/Users/tuanchill/Desktop/circle/nest-turbo-starter` (the actual git repo/npm workspace) — even though the session cwd had already shifted into the nested repo. A `launch.json` written inside the nested repo was silently ignored; had to add the entry to the outer one instead.
- While there, found the outer `launch.json` already had a broken pre-existing `"circle-dev"` entry — its `cwd` is relative to the outer root but points at a nonexistent `circle` subfolder. Left it alone (out of scope), added a new `"web"` entry alongside it with a correct relative `cwd`.
- Full click-through (open modal → click quick action → confirm view created, navigated, filter bar untouched) was not executed — backend services weren't up and the user chose to stop at the code-review-verified level.

## Root Cause Analysis

Not a failure per se — the design decision (don't read from `useFilterStore`) was made deliberately upfront to prevent a real bug class (side-effect leakage into shared URL state), so no "root cause" there. The open item is a verification gap: the plan's success criteria were checked off with the "code-reviewed, not live-verified" caveat rather than left unchecked, which is honest but still means the actual click-through is untested. The launch.json path-resolution behavior (outer dir vs nested repo) is an infra quirk of this project's non-git nested-repo layout, not something this session broke.

## Lessons Learned

- In this repo's nested-directory layout (`circle/` outer, `circle/nest-turbo-starter/` inner git repo), Browser-pane dev previews need `launch.json` in the **outer** directory regardless of session cwd. Remember this before troubleshooting a "preview won't start" issue from scratch next time.
- code-reviewer's default model isn't reliably available in this environment — check for `model_not_found` and fall back to explicit `model: sonnet` proactively rather than after a failed spawn.
- When backend isn't running and user declines to boot it, mark plan success criteria with an explicit "code-reviewed, not live-verified" annotation rather than a blank checkmark — this plan does that; keep doing it.

## Next Steps

- Owner: next session touching this feature (or whoever picks up the plan) should boot the full backend stack (auth-service, project-service, Postgres already up via docker) and do the actual click-through: both modals, both presets, confirm `?filters=` on the page is untouched after a quick-create.
- Consider fixing the broken `"circle-dev"` launch.json entry in the outer `circle/` config (unrelated pre-existing bug, flagged not fixed).
- No code changes queued beyond the above — this is a verification task, not an implementation task.
</content>
