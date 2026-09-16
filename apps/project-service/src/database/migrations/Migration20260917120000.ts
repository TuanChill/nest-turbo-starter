import { Migration } from '@mikro-orm/migrations';

export class Migration20260917120000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "cycle_calendar_subscriptions" ("team_id" varchar(255) not null, "token_hash" varchar(64) not null, "token_ciphertext" text not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "cycle_calendar_subscriptions_pkey" primary key ("team_id"));`,
    );
    this.addSql(
      `create index "cycle_calendar_subscriptions_token_hash_index" on "cycle_calendar_subscriptions" ("token_hash");`,
    );
    this.addSql(
      `alter table "cycle_calendar_subscriptions" add constraint "cycle_calendar_subscriptions_token_hash_unique" unique ("token_hash");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cycle_calendar_subscriptions" cascade;`);
  }
}
