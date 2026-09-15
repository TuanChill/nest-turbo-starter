import { Migration } from '@mikro-orm/migrations';

export class Migration20260916150000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'create table if not exists "notification_preferences" ("member_id" varchar(255) not null, "desktop" boolean not null default true, "mobile" boolean not null default false, "email" boolean not null default true, "slack" boolean not null default false, "email_format" varchar(255) not null default \'digest\', "categories" jsonb not null default \'{}\', "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "notification_preferences_pkey" primary key ("member_id"));',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists "notification_preferences";');
  }
}
