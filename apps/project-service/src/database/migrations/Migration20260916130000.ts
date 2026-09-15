import { Migration } from '@mikro-orm/migrations';

export class Migration20260916130000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'create table if not exists "issue_subscriptions" ("id" uuid not null, "issue_identifier" varchar(255) not null, "member_id" varchar(255) not null, "created_at" timestamptz not null default now(), constraint "issue_subscriptions_pkey" primary key ("id"));',
    );
    this.addSql(
      'alter table "issue_subscriptions" add constraint "issue_subscriptions_issue_identifier_member_id_unique" unique ("issue_identifier", "member_id");',
    );
    this.addSql(
      'create index if not exists "issue_subscriptions_member_id_index" on "issue_subscriptions" ("member_id");',
    );
    this.addSql(
      'create index if not exists "issue_subscriptions_issue_identifier_index" on "issue_subscriptions" ("issue_identifier");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists "issue_subscriptions";');
  }
}
