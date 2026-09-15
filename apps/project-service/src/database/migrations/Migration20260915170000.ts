import { Migration } from '@mikro-orm/migrations';

export class Migration20260915170000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "initiatives" add column "workspace_id" varchar(255) not null default 'circle-workspace', add column "deleted_at" timestamptz null;`,
    );
    this.addSql(`alter table "cycles" add column "deleted_at" timestamptz null;`);
    this.addSql(
      `create index "initiatives_workspace_id_index" on "initiatives" ("workspace_id");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "initiatives_workspace_id_index";`);
    this.addSql(
      `alter table "initiatives" drop column "workspace_id", drop column "deleted_at";`,
    );
    this.addSql(`alter table "cycles" drop column "deleted_at";`);
  }
}
