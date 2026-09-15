import { Migration } from '@mikro-orm/migrations';

export class Migration20260915180000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "initiative_activities" ("id" uuid not null, "initiative_id" varchar(255) not null, "actor_id" varchar(255) not null, "event" varchar(255) not null, "metadata" jsonb not null default '{}', "created_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "initiative_activities_initiative_id_created_at_index" on "initiative_activities" ("initiative_id", "created_at");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "initiative_activities";`);
  }
}
