import { Migration } from '@mikro-orm/migrations';

export class Migration20260916080000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'create table "project_teams" ("id" uuid not null, "project_id" varchar(255) not null, "team_id" varchar(255) not null, "created_at" timestamptz not null, constraint "project_teams_pkey" primary key ("id"));',
    );
    this.addSql(
      'create unique index "project_teams_project_id_team_id_unique" on "project_teams" ("project_id", "team_id");',
    );
    this.addSql(
      'create index "project_teams_project_id_index" on "project_teams" ("project_id");',
    );
    this.addSql(
      'create index "project_teams_team_id_index" on "project_teams" ("team_id");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists "project_teams" cascade;');
  }
}
