import { Migration } from '@mikro-orm/migrations';

export class Migration20260915130000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "project_templates" ("id" uuid not null, "workspace_id" varchar(255) not null, "name" varchar(255) not null, "description" text null, "scope" varchar(255) not null default 'workspace', "team_id" varchar(255) null, "created_by" varchar(255) not null, "is_default" boolean not null default false, "config" jsonb not null default '{}', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "project_templates_workspace_id_index" on "project_templates" ("workspace_id");`,
    );
    this.addSql(
      `create index "project_templates_team_id_index" on "project_templates" ("team_id");`,
    );
    this.addSql(
      `create table "project_members" ("id" uuid not null, "project_id" varchar(255) not null, "member_id" varchar(255) not null, "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create unique index "project_members_project_id_member_id_unique" on "project_members" ("project_id", "member_id");`,
    );
    this.addSql(
      `create index "project_members_project_id_index" on "project_members" ("project_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "project_members";`);
    this.addSql(`drop table if exists "project_templates";`);
  }
}
