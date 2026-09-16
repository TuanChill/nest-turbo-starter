import { Migration } from '@mikro-orm/migrations';

export class Migration20260917170000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'alter table "notifications" add column if not exists "snoozed_until" timestamptz null;',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('alter table "notifications" drop column if exists "snoozed_until";');
  }
}
