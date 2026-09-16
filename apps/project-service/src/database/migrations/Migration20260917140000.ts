import { Migration } from '@mikro-orm/migrations';

export class Migration20260917140000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "workspace_invitations" ("id" uuid not null, "workspace_id" varchar(255) not null, "inviter_member_id" varchar(255) not null, "email" varchar(255) not null, "name" varchar(255) not null, "role" varchar(255) not null default 'Member', "team_ids" jsonb not null default '[]', "token_hash" varchar(64) not null, "expires_at" timestamptz not null, "accepted_at" timestamptz null, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("id"));`,
    );
    this.addSql(
      `create index "workspace_invitations_workspace_id_email_index" on "workspace_invitations" ("workspace_id", "email");`,
    );
    this.addSql(
      `create index "workspace_invitations_expires_at_index" on "workspace_invitations" ("expires_at");`,
    );
    this.addSql(
      `alter table "workspace_invitations" add constraint "workspace_invitations_token_hash_unique" unique ("token_hash");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "workspace_invitations" cascade;`);
  }
}
