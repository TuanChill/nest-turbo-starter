import { Migration } from '@mikro-orm/migrations';

/** Keep the issue subscription creation timestamp database-generated. */
export class Migration20260916140000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'alter table "issue_subscriptions" alter column "created_at" set default now();',
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      'alter table "issue_subscriptions" alter column "created_at" drop default;',
    );
  }
}
