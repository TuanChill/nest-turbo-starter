import { Migration } from '@mikro-orm/migrations';

export class Migration20260916190000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `create table "cycle_settings" ("team_id" varchar(255) not null, "enabled" boolean not null default false, "duration_weeks" int not null default 2, "start_day_of_week" int not null default 1, "cooldown_days" int not null default 0, "upcoming_cycle_count" int not null default 3, "auto_add_active_issues" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null, primary key ("team_id"));`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "cycle_settings" cascade;`);
  }
}
