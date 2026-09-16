import { Migration } from '@mikro-orm/migrations';

/** Aligns schema defaults with entity metadata for newly introduced and existing tables. */
export class Migration20260916200000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(`drop index if exists "cycle_settings_enabled_index";`);
    this.addSql(
      `alter table "cycle_settings" alter column "created_at" drop default, alter column "updated_at" drop default;`,
    );
    this.addSql(
      `alter table "initiative_activities" alter column "created_at" set default now();`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "initiative_activities" alter column "created_at" drop default;`,
    );
    this.addSql(
      `alter table "cycle_settings" alter column "created_at" set default now(), alter column "updated_at" set default now();`,
    );
    this.addSql(
      `create index if not exists "cycle_settings_enabled_index" on "cycle_settings" ("enabled");`,
    );
  }
}
