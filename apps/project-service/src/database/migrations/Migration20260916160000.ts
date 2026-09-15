import { Migration } from '@mikro-orm/migrations';

export class Migration20260916160000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      'alter table "notification_preferences" add constraint "notification_preferences_member_id_unique" unique ("member_id");',
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      'alter table "notification_preferences" drop constraint if exists "notification_preferences_member_id_unique";',
    );
  }
}
