# Linear parity audit

Baseline: 2026-09-15. Linear behavior is compared against the official documentation listed in the task. A feature is not marked as passing when its screen is backed by mock data or a placeholder.

| Linear feature | Linear behavior | Circle current state | Missing/incorrect | Planned fix | Test evidence |
|---|---|---|---|---|---|
| Workspace and teams | Workspace/team membership scopes configuration and work | Real workspace/team APIs exist | Project currently stores one team and several screens still use mock types | Reuse access checks; add scoped template APIs first | Backend access checks and live workspace flows |
| Issues | CRUD, properties, relations, hierarchy, activity, filters | CRUD and activity APIs exist | Issue templates and some filters/relations still use mock/hardcoded UI | Replace each mock surface with persisted API behavior | Existing CI plus feature-specific tests |
| Projects | Overview, properties, milestones, updates, labels, issues and progress | Core project APIs exist | Project templates are placeholder; project members and multi-team projects are not modeled | Implement templates with snapshot/transaction semantics; document unsupported multi-team mapping | Required template E2E |
| Project templates | Workspace/team templates can configure projects, milestones and issues; templates can be edited, duplicated, deleted and used during creation | Placeholder route only | No entity, migration, API, settings UI or create flow | Implement end-to-end | Required template E2E |
| Project labels | Reusable project labels, filtering/grouping, optional mutually-exclusive groups | Real scoped labels and project filtering | Label groups and upstream issue filtering are missing | Add group model/rules in a follow-up slice | Existing live label smoke test |
| Initiatives | Group projects and show progress | API and screens exist | Some UI still imports mock types and settings is placeholder | Audit and replace mock paths | Initiative CRUD tests |
| Cycles | Team-scoped cycles with dates, issues and progress | API and screens exist | Need broader contract/permission coverage | Add integration tests and remove mock-only paths | Cycle test matrix |
| Views and display options | Persist filters, sorting, grouping and displayed properties | Saved view API exists | View screens still import mock data | Make API response the sole source of truth | View persistence E2E |
| Notifications and activity | Persist actor, target and read state | Partial real activity/notification support | Coverage and focus regression tests are incomplete | Add mutation/error/focus regression tests | Browser focus test |
| Integrations, analytics, administration, importers | Feature-specific workflows documented by Linear | Several screens are placeholders or static data | Not safe to claim parity without product-specific backend contracts | Keep visible limitation and implement incrementally | Per-feature acceptance tests |

## Current implementation rules

- Production responses must never fall back to mock IDs or mock records.
- Template instantiation must be atomic and must remap every cloned issue relationship.
- Unsupported source references must fail before creating records, or the entire transaction must roll back.
- Every feature slice must pass local checks, CI, deployment and post-deploy browser verification.
