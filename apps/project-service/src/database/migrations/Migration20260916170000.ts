import { Migration } from '@mikro-orm/migrations';

export class Migration20260916170000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "file_attachments" ("id" uuid not null, "workspace_id" varchar(255) not null, "team_id" varchar(255) not null, "issue_identifier" varchar(255) null, "project_id" varchar(255) null, "uploader_id" varchar(255) not null, "file_name" varchar(255) not null, "content_type" varchar(255) not null, "file_size" int not null, "file_key" varchar(255) not null, "file_url" text not null, "status" varchar(255) not null default 'pending', "created_at" timestamptz not null, "completed_at" timestamptz null, primary key ("id"));`,
    );
    this.addSql(
      `create index "file_attachments_workspace_id_project_id_index" on "file_attachments" ("workspace_id", "project_id");`,
    );
    this.addSql(
      `create index "file_attachments_workspace_id_issue_identifier_index" on "file_attachments" ("workspace_id", "issue_identifier");`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "file_attachments" cascade;`);
  }
}
