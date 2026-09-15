import { Migration } from '@mikro-orm/migrations';

export class Migration20260915230000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table "initiatives" add column if not exists "label_ids" jsonb not null default \'[]\';',
    );
    this.addSql(
      'alter table "initiatives" add column if not exists "resources" jsonb not null default \'[]\';',
    );
    this.addSql(
      'create table if not exists "initiative_updates" ("id" varchar(255) not null, "initiative_id" varchar(255) not null, "author_id" varchar(255) not null, "health" varchar(255) not null, "blocks" jsonb not null default \'[]\', "created_at" timestamptz not null default now(), constraint "initiative_updates_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index if not exists "initiative_updates_initiative_id_index" on "initiative_updates" ("initiative_id");',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "initiative_updates";');
    this.addSql('alter table "initiatives" drop column if exists "resources";');
    this.addSql('alter table "initiatives" drop column if exists "label_ids";');
  }
}
