import { Migration } from '@mikro-orm/migrations';

export class Migration20260917110000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table "issues" add column if not exists "estimate" int null;');
    this.addSql(
      'alter table "teams" add column if not exists "estimate_enabled" boolean not null default false;',
    );
    this.addSql(
      'alter table "teams" add column if not exists "estimate_scale" varchar(255) not null default \'fibonacci\';',
    );
    this.addSql(
      'alter table "teams" add column if not exists "estimate_extended" boolean not null default false;',
    );
    this.addSql(
      'alter table "teams" add column if not exists "estimate_zero" boolean not null default false;',
    );
    this.addSql(
      'alter table "teams" add column if not exists "unestimated_as_one" boolean not null default true;',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('alter table "issues" drop column if exists "estimate";');
    this.addSql('alter table "teams" drop column if exists "estimate_enabled";');
    this.addSql('alter table "teams" drop column if exists "estimate_scale";');
    this.addSql('alter table "teams" drop column if exists "estimate_extended";');
    this.addSql('alter table "teams" drop column if exists "estimate_zero";');
    this.addSql('alter table "teams" drop column if exists "unestimated_as_one";');
  }
}
