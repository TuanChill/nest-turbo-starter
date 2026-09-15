# Linear parity audit

Baseline: 2026-09-15. Linear behavior is compared against the official documentation listed in the task. A feature is not marked as passing when its screen is backed by mock data or a placeholder.

Reference set: [Linear Docs](https://linear.app/docs), [Projects](https://linear.app/docs/projects), [Project templates](https://linear.app/docs/project-templates), [Labels](https://linear.app/docs/labels), [Teams](https://linear.app/docs/teams), [Issue properties](https://linear.app/docs/issue-properties), [Cycles](https://linear.app/docs/cycles), [Views](https://linear.app/docs/views), [Issue relations](https://linear.app/docs/issue-relations), and [Notifications](https://linear.app/docs/notifications).

| Linear feature | Linear behavior | Circle current state | Missing/incorrect | Planned fix | Test evidence |
|---|---|---|---|---|---|
| Workspace and teams | Workspace/team membership scopes configuration and work | Real workspace/team APIs exist | Some legacy UI imports mock types/constants; multi-workspace settings need broader audit | Replace remaining mock-backed screens and verify workspace isolation | Backend access checks and live workspace flows |
| Issues | CRUD, properties, relations, hierarchy, activity, filters | CRUD/activity APIs plus persisted issue templates | Some list/filter screens still use mock constants; relation/delete/reaction semantics need more integration coverage | Make API response the only record source and add the remaining issue contract tests | Issue-template unit tests; CI + browser smoke |
| Projects | Overview, properties, milestones, updates, labels, issues and progress | Core project APIs and template instantiation exist | Project members and multi-team projects are not modeled; some project detail surfaces still use mock types | Keep unsupported multi-team mapping explicit and replace mock-backed views incrementally | Project-template create/edit/duplicate/live E2E |
| Project templates | Workspace/team templates can configure projects, milestones and issues; templates can be edited, duplicated, deleted and used during creation | Real entity, migration, CRUD/duplicate/delete API, settings UI and create flow | Source-level reference remapping/transaction behavior needs dedicated failure-path integration coverage | Add rollback/remapping integration suite; keep invalid references atomic | CI/deploy plus live production instantiation with overrides |
| Issue templates | Workspace/team defaults can prefill new issue title, description, status, priority, assignee and labels | Real entity, migration, CRUD/duplicate/delete API, settings UI and new-issue selector | Template config does not yet expose every Linear issue field or rich editor controls | Extend config only when backed by API and tests | 2 unit tests; production E2E: create/edit/duplicate + issue ENG-27 |
| Project labels | Reusable project labels, filtering/grouping, optional mutually-exclusive groups | Real global scoped labels and project filtering; label writes now require workspace membership | Label groups, per-workspace ownership and issue filter API parity are missing | Add label-group model/rules and workspace ownership migration | Existing label smoke + access guard code |
| Initiatives | Group projects and show progress | API and screens exist | Some UI still imports mock types and settings is placeholder | Replace mock paths and add initiative CRUD/integration tests | Not yet complete |
| Cycles | Team-scoped cycles with dates, issues and progress | API and screens exist | Need broader contract/permission coverage | Add integration tests and remove mock-only paths | Not yet complete |
| Views and display options | Persist filters, sorting, grouping and displayed properties | Saved view API exists | View screens still import mock data | Make API response the sole source of truth | Not yet complete |
| Notifications and activity | Persist actor, target and read state | Partial real activity/notification support; issue-detail API has explicit error state | Coverage and focus regression tests are incomplete | Add mutation/error/focus regression tests | Not yet complete |
| Integrations, analytics, administration, importers | Feature-specific workflows documented by Linear | Several screens are placeholders or static data | Not safe to claim parity without product-specific backend contracts | Keep visible limitation and implement incrementally | Per-feature acceptance tests |

## Current implementation rules

- Production responses must never fall back to mock IDs or mock records.
- A failed create/detail request must show an error; it must not synthesize a local record.
- Template instantiation must be atomic and must remap every cloned issue relationship.
- Unsupported source references must fail before creating records, or the entire transaction must roll back.
- Every feature slice must pass local checks, CI, deployment and post-deploy browser verification.
