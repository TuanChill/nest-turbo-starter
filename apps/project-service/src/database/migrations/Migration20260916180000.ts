import { Migration } from '@mikro-orm/migrations';

export class Migration20260916180000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "project_subscriptions" ("id" uuid not null, "project_id" varchar(255) not null, "member_id" varchar(255) not null, "created_at" timestamptz not null default now(), primary key ("id"));`,
    );
    this.addSql(
      `create index "project_subscriptions_member_id_index" on "project_subscriptions" ("member_id");`,
    );
    this.addSql(
      `create index "project_subscriptions_project_id_index" on "project_subscriptions" ("project_id");`,
    );
    this.addSql(
      `alter table "project_subscriptions" add constraint "project_subscriptions_project_id_member_id_unique" unique ("project_id", "member_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "project_subscriptions" cascade;`);
  }
}
