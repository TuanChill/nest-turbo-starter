import { Migration } from '@mikro-orm/migrations';

export class Migration20260830120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "workspace_members" add column "password_hash" varchar(255) null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "workspace_members" drop column "password_hash";`);
  }
}
