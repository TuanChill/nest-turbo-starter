import { Migration } from '@mikro-orm/migrations';

export class Migration20260903081252 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "workspaces" ("id" varchar(255) not null, "name" varchar(255) not null, "slug" varchar(255) not null, "icon" varchar(255) not null default 'from-orange-600 to-amber-500', "description" text null, "owner_id" varchar(255) not null, "invite_code" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `alter table "workspaces" add constraint "workspaces_slug_unique" unique ("slug");`,
    );
    this.addSql(
      `alter table "workspaces" add constraint "workspaces_invite_code_unique" unique ("invite_code");`,
    );

    this.addSql(
      `create table "workspace_user_members" ("id" varchar(255) not null, "workspace_id" varchar(255) not null, "member_id" varchar(255) not null, "role" varchar(255) not null default 'Member', "joined_at" timestamptz not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "workspace_user_members_workspace_id_index" on "workspace_user_members" ("workspace_id");`,
    );
    this.addSql(
      `create index "workspace_user_members_member_id_index" on "workspace_user_members" ("member_id");`,
    );
    this.addSql(
      `alter table "workspace_user_members" add constraint "workspace_user_members_workspace_id_member_id_unique" unique ("workspace_id", "member_id");`,
    );

    this.addSql(
      `alter table "cycles" alter column "scope_delta" type double precision using ("scope_delta"::double precision);`,
    );
    this.addSql(
      `alter table "cycles" alter column "success_rate" type double precision using ("success_rate"::double precision);`,
    );

    this.addSql(
      `alter table "saved_views" add "project_id" varchar(255) null, add "layout" varchar(255) not null default 'list';`,
    );

    this.addSql(`alter table "teams" add "workspace_id" varchar(255) null;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "workspaces" cascade;`);
    this.addSql(`drop table if exists "workspace_user_members" cascade;`);

    this.addSql(
      `alter table "cycles" alter column "scope_delta" type float8 using ("scope_delta"::float8);`,
    );
    this.addSql(
      `alter table "cycles" alter column "success_rate" type float8 using ("success_rate"::float8);`,
    );

    this.addSql(
      `alter table "saved_views" drop column "project_id", drop column "layout";`,
    );

    this.addSql(`alter table "teams" drop column "workspace_id";`);
  }
}
