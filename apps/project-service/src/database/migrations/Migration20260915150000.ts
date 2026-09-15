import { Migration } from '@mikro-orm/migrations';

export class Migration20260915150000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "issue_templates" ("id" uuid not null, "workspace_id" varchar(255) not null, "name" varchar(255) not null, "description" text null, "scope" varchar(255) not null default 'workspace', "team_id" varchar(255) null, "created_by" varchar(255) not null, "is_default" boolean not null default false, "config" jsonb not null default '{}', "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "issue_templates_workspace_id_index" on "issue_templates" ("workspace_id");`,
    );
    this.addSql(
      `create index "issue_templates_team_id_index" on "issue_templates" ("team_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "issue_templates";`);
  }
}
