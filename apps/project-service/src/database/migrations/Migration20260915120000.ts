import { Migration } from '@mikro-orm/migrations';

export class Migration20260915120000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "labels" add column "scope" varchar(255) not null default 'both';`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "labels" drop column "scope";`);
  }
}
