import { Migration } from '@mikro-orm/migrations';

/**
 * Preserve Linear's automatic issue subscriptions for issues that predate the
 * persisted subscription feature. Only members visible through the issue's
 * team or workspace are backfilled; explicit future unsubscribes remain
 * represented by the absence of a row after this one-time migration.
 */
export class Migration20260917130000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`
      with candidates as (
        select i.identifier, i.creator_id as member_id
        from "issues" i
        where i.deleted_at is null
        union
        select i.identifier, i.assignee_id as member_id
        from "issues" i
        where i.deleted_at is null and i.assignee_id is not null
        union
        select a.issue_identifier, a.actor_id as member_id
        from "issue_activities" a
        join "issues" i on i.identifier = a.issue_identifier
        where i.deleted_at is null and a.kind = 'comment'
      ), authorized as (
        select distinct c.identifier, c.member_id
        from candidates c
        join "issues" i on i.identifier = c.identifier
        where c.member_id is not null
          and (
            exists (
              select 1
              from "team_members" tm
              where tm.team_id = i.team_id and tm.member_id = c.member_id
            )
            or exists (
              select 1
              from "teams" t
              join "workspace_user_members" wm
                on wm.workspace_id = t.workspace_id
               and wm.member_id = c.member_id
               and wm.deleted_at is null
              where t.id = i.team_id
            )
          )
      )
      insert into "issue_subscriptions" ("id", "issue_identifier", "member_id", "created_at")
      select md5('circle:issue-subscription:' || identifier || ':' || member_id)::uuid,
             identifier,
             member_id,
             now()
      from authorized
      on conflict ("issue_identifier", "member_id") do nothing;
    `);
  }

  override down(): void | Promise<void> {
    this.addSql(`
      with candidates as (
        select i.identifier, i.creator_id as member_id
        from "issues" i
        where i.deleted_at is null
        union
        select i.identifier, i.assignee_id as member_id
        from "issues" i
        where i.deleted_at is null and i.assignee_id is not null
        union
        select a.issue_identifier, a.actor_id as member_id
        from "issue_activities" a
        join "issues" i on i.identifier = a.issue_identifier
        where i.deleted_at is null and a.kind = 'comment'
      )
      delete from "issue_subscriptions" s
      using candidates c
      where s.id = md5('circle:issue-subscription:' || c.identifier || ':' || c.member_id)::uuid;
    `);
  }
}
