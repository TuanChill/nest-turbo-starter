import { Migration } from '@mikro-orm/migrations';

export class Migration20260915190000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "saved_views" add column "workspace_id" varchar(255) not null default 'circle-workspace';`,
    );
    this.addSql(
      `create index "saved_views_workspace_id_index" on "saved_views" ("workspace_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "saved_views_workspace_id_index";`);
    this.addSql(`alter table "saved_views" drop column "workspace_id";`);
  }
}
