import { Migration } from '@mikro-orm/migrations';

export class Migration20260824074759 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "cycles" ("id" varchar(255) not null, "number" int not null, "name" varchar(255) not null, "team_id" varchar(255) not null, "status" varchar(255) not null, "start_date" date not null, "end_date" date not null, "capacity" int not null default 0, "scope" int not null default 0, "scope_delta" double precision not null default 0, "started" int not null default 0, "completed" int not null default 0, "success_rate" double precision null, "burnup" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "document_folders" ("id" varchar(255) not null, "name" varchar(255) not null, "icon" varchar(255) not null default '📁', "team_id" varchar(255) not null default 'CORE', "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "initiatives" ("id" varchar(255) not null, "name" varchar(255) not null, "description" text null, "icon" varchar(255) not null default '🎯', "status" varchar(255) not null default 'active', "priority_id" varchar(255) not null default 'no-priority', "owner_id" varchar(255) null, "target" varchar(255) null, "health_id" varchar(255) not null default 'on-track', "project_ids" jsonb not null default '[]', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "issues" ("id" varchar(255) not null, "identifier" varchar(255) not null, "title" varchar(255) not null, "description" text not null default '', "description_blocks" jsonb not null default '[]', "status_id" varchar(255) not null default 'to-do', "status_category" varchar(255) not null default 'unstarted', "priority_id" varchar(255) not null default 'no-priority', "assignee_id" varchar(255) null, "creator_id" varchar(255) not null default 'ln', "team_id" varchar(255) not null default 'CORE', "project_id" varchar(255) null, "cycle_id" varchar(255) not null default '', "parent_issue_id" varchar(255) null, "rank" varchar(255) not null default '0|hzzzzz:', "due_date" date null, "milestone" varchar(255) null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "issues" add constraint "issues_identifier_unique" unique ("identifier");`,
    );

    this.addSql(
      `create table "issue_activities" ("id" uuid not null, "issue_identifier" varchar(255) not null, "actor_id" varchar(255) not null, "kind" varchar(255) not null, "event" varchar(255) null, "text" text null, "comment_blocks" jsonb null, "reactions" jsonb not null default '[]', "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "issue_labels" ("issue_id" varchar(255) not null, "label_id" varchar(255) not null, primary key ("issue_id", "label_id"));`,
    );

    this.addSql(
      `create table "issue_relations" ("id" uuid not null, "source_identifier" varchar(255) not null, "target_identifier" varchar(255) not null, "relation_type" varchar(255) not null, "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "labels" ("id" varchar(255) not null, "name" varchar(255) not null, "color" varchar(255) not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "workspace_members" ("id" varchar(255) not null, "email" varchar(255) not null, "name" varchar(255) not null, "avatar_url" varchar(255) null, "status" varchar(255) not null default 'offline', "role" varchar(255) not null default 'Member', "timezone" varchar(255) not null default 'UTC', "joined_date" date null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "workspace_members" add constraint "workspace_members_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "notifications" ("id" varchar(255) not null, "issue_identifier" varchar(255) not null, "user_id" varchar(255) not null default 'ln', "actor_id" varchar(255) not null, "type" varchar(255) not null, "content" text not null, "read" boolean not null default false, "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "pr_links" ("id" varchar(255) not null, "issue_identifier" varchar(255) not null, "title" varchar(255) not null, "url" varchar(255) null, "status" varchar(255) not null default 'open', "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "projects" ("id" varchar(255) not null, "name" varchar(255) not null, "team_id" varchar(255) not null, "lead_id" varchar(255) null, "status_id" varchar(255) not null default 'in-progress', "status_category" varchar(255) not null default 'started', "priority_id" varchar(255) not null default 'no-priority', "health_id" varchar(255) not null default 'no-update', "percent_complete" int not null default 0, "icon" varchar(255) not null default 'Cuboid', "start_date" date null, "target_date" date null, "initiative_id" varchar(255) null, "summary" text null, "description" jsonb not null default '[]', "resources" jsonb not null default '[]', "health_updated_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );

    this.addSql(
      `create table "project_labels" ("project_id" varchar(255) not null, "label_id" varchar(255) not null, primary key ("project_id", "label_id"));`,
    );

    this.addSql(
      `create table "project_milestones" ("id" uuid not null, "project_id" varchar(255) not null, "name" varchar(255) not null, "target_date" date null, "completed" boolean not null default false, "order_index" int not null default 0, "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "project_updates" ("id" uuid not null, "project_id" varchar(255) not null, "author_id" varchar(255) not null, "health" varchar(255) not null, "blocks" jsonb not null default '[]', "created_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "reviews" ("id" varchar(255) not null, "title" varchar(255) not null, "author_id" varchar(255) not null default 'ln', "status" varchar(255) not null default 'open', "resolves" varchar(255) null, "branch" varchar(255) null, "file_stats" jsonb not null default '[]', "commits" jsonb not null default '[]', "summary_bullets" jsonb not null default '[]', "verdicts" jsonb not null default '[]', "guide_sections" jsonb not null default '[]', "file_diffs" jsonb not null default '[]', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "saved_views" ("id" varchar(255) not null, "name" varchar(255) not null, "description" text not null default '', "icon" varchar(255) not null default '📦', "type" varchar(255) not null default 'issue', "team_id" varchar(255) null, "owner_id" varchar(255) not null default 'ln', "filter" jsonb not null default '{}', "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "teams" ("id" varchar(255) not null, "name" varchar(255) not null, "icon" varchar(255) not null, "color" varchar(255) not null default '#5e6ad2', "joined" boolean not null default false, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );

    this.addSql(
      `create table "team_documents" ("id" varchar(255) not null, "folder_id" varchar(255) not null, "name" varchar(255) not null, "icon" varchar(255) not null default '📄', "creator_id" varchar(255) not null default 'ln', "pinned" boolean not null default false, "content" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );

    this.addSql(
      `create table "team_members" ("id" uuid not null, "team_id" varchar(255) not null, "member_id" varchar(255) not null, "role" varchar(255) not null default 'member', "joined_at" timestamptz not null, primary key ("id"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cycles" cascade;`);
    this.addSql(`drop table if exists "document_folders" cascade;`);
    this.addSql(`drop table if exists "initiatives" cascade;`);
    this.addSql(`drop table if exists "issues" cascade;`);
    this.addSql(`drop table if exists "issue_activities" cascade;`);
    this.addSql(`drop table if exists "issue_labels" cascade;`);
    this.addSql(`drop table if exists "issue_relations" cascade;`);
    this.addSql(`drop table if exists "labels" cascade;`);
    this.addSql(`drop table if exists "workspace_members" cascade;`);
    this.addSql(`drop table if exists "notifications" cascade;`);
    this.addSql(`drop table if exists "pr_links" cascade;`);
    this.addSql(`drop table if exists "projects" cascade;`);
    this.addSql(`drop table if exists "project_labels" cascade;`);
    this.addSql(`drop table if exists "project_milestones" cascade;`);
    this.addSql(`drop table if exists "project_updates" cascade;`);
    this.addSql(`drop table if exists "reviews" cascade;`);
    this.addSql(`drop table if exists "saved_views" cascade;`);
    this.addSql(`drop table if exists "teams" cascade;`);
    this.addSql(`drop table if exists "team_documents" cascade;`);
    this.addSql(`drop table if exists "team_members" cascade;`);
  }
}
