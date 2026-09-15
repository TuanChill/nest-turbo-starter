import { Migration } from '@mikro-orm/migrations';

export class Migration20260915240000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'create index if not exists "notifications_user_id_read_created_at_index" on "notifications" ("user_id", "read", "created_at");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql('drop index if exists "notifications_user_id_read_created_at_index";');
  }
}
