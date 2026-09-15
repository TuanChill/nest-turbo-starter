import { Migration } from '@mikro-orm/migrations';

export class Migration20260916120000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'create table if not exists "cycle_history" ("id" uuid not null, "cycle_id" varchar(255) not null, "recorded_on" date not null, "scope" int not null default 0, "started" int not null default 0, "completed" int not null default 0, "ideal" double precision not null default 0, "created_at" timestamptz not null default now(), constraint "cycle_history_pkey" primary key ("id"));',
    );
    this.addSql(
      'create index if not exists "cycle_history_cycle_id_index" on "cycle_history" ("cycle_id");',
    );
    this.addSql(
      'alter table "cycle_history" add constraint "cycle_history_cycle_id_recorded_on_unique" unique ("cycle_id", "recorded_on");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop table if exists "cycle_history";');
  }
}
