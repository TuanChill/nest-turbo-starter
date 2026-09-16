import { Migration } from '@mikro-orm/migrations';

export class Migration20260917160000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "initiative_updates" add column "reactions" jsonb not null default '[]';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "initiative_updates" drop column if exists "reactions";`);
  }
}
