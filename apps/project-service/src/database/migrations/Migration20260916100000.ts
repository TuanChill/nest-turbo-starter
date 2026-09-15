import { Migration } from '@mikro-orm/migrations';

export class Migration20260916100000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'alter table "reviews" add column if not exists "workspace_id" varchar(255) null;',
    );
    this.addSql(
      'create index if not exists "reviews_workspace_id_index" on "reviews" ("workspace_id");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop index if exists "reviews_workspace_id_index";');
    this.addSql('alter table "reviews" drop column if exists "workspace_id";');
  }
}
