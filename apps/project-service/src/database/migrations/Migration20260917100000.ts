import { Migration } from '@mikro-orm/migrations';

export class Migration20260917100000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "cycle_settings" add column "time_zone" varchar(255) not null default 'UTC';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "cycle_settings" drop column if exists "time_zone";`);
  }
}
