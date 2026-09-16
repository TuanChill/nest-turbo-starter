import { Migration } from '@mikro-orm/migrations';

export class Migration20260917150000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`alter table "labels" add column "archived_at" timestamptz null;`);
    this.addSql(`create index "labels_archived_at_index" on "labels" ("archived_at");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "labels_archived_at_index";`);
    this.addSql(`alter table "labels" drop column if exists "archived_at";`);
  }
}
