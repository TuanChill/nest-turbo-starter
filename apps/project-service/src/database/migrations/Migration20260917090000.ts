import { Migration } from '@mikro-orm/migrations';

export class Migration20260917090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "labels" add column "team_id" varchar(255) null;`);
    this.addSql(
      `create index "labels_workspace_id_team_id_index" on "labels" ("workspace_id", "team_id");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "labels_workspace_id_team_id_index";`);
    this.addSql(`alter table "labels" drop column if exists "team_id";`);
  }
}
