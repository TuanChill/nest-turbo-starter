import { Migration } from '@mikro-orm/migrations';

export class Migration20260915220000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "project_activities" ("id" uuid not null, "project_id" varchar(255) not null, "actor_id" varchar(255) not null, "event" varchar(255) not null, "metadata" jsonb not null default '{}', "created_at" timestamptz not null default now(), constraint "project_activities_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "project_activities_project_id_index" on "project_activities" ("project_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "project_activities_project_id_index";`);
    this.addSql(`drop table if exists "project_activities";`);
  }
}
