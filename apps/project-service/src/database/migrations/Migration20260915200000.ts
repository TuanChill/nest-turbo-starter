import { Migration } from '@mikro-orm/migrations';

export class Migration20260915200000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "labels" add column "workspace_id" varchar(255) not null default 'circle-workspace', add column "description" text null, add column "created_at" timestamptz not null default now();`,
    );
    this.addSql(`create index "labels_workspace_id_index" on "labels" ("workspace_id");`);
    this.addSql(
      `create table "label_groups" ("id" uuid not null, "workspace_id" varchar(255) not null, "name" varchar(255) not null, "scope" varchar(255) not null default 'issue', "mutually_exclusive" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "label_groups_pkey" primary key ("id"));`,
    );
    this.addSql(
      `create index "label_groups_workspace_id_index" on "label_groups" ("workspace_id");`,
    );
    this.addSql(`alter table "labels" add column "group_id" uuid null;`);
    this.addSql(`create index "labels_group_id_index" on "labels" ("group_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop index if exists "labels_workspace_id_index";`);
    this.addSql(`drop index if exists "labels_group_id_index";`);
    this.addSql(`alter table "labels" drop column "group_id";`);
    this.addSql(`drop index if exists "label_groups_workspace_id_index";`);
    this.addSql(`drop table if exists "label_groups";`);
    this.addSql(
      `alter table "labels" drop column "workspace_id", drop column "description", drop column "created_at";`,
    );
  }
}
