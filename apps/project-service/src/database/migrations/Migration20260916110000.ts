import { Migration } from '@mikro-orm/migrations';

/** Remove legacy foreign-identity defaults that could create cross-tenant data. */
export class Migration20260916110000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql('alter table "document_folders" alter column "team_id" drop default;');
    this.addSql('alter table "issues" alter column "creator_id" drop default;');
    this.addSql('alter table "issues" alter column "team_id" drop default;');
    this.addSql('alter table "notifications" alter column "user_id" drop default;');
    this.addSql('alter table "reviews" alter column "author_id" drop default;');
    this.addSql('alter table "saved_views" alter column "owner_id" drop default;');
    this.addSql('alter table "team_documents" alter column "creator_id" drop default;');
    this.addSql('alter table "initiatives" alter column "workspace_id" drop default;');
    this.addSql('alter table "labels" alter column "workspace_id" drop default;');
    this.addSql('alter table "saved_views" alter column "workspace_id" drop default;');
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "document_folders" alter column "team_id" set default 'CORE';`,
    );
    this.addSql(`alter table "issues" alter column "creator_id" set default 'ln';`);
    this.addSql(`alter table "issues" alter column "team_id" set default 'CORE';`);
    this.addSql(`alter table "notifications" alter column "user_id" set default 'ln';`);
    this.addSql(`alter table "reviews" alter column "author_id" set default 'ln';`);
    this.addSql(`alter table "saved_views" alter column "owner_id" set default 'ln';`);
    this.addSql(
      `alter table "team_documents" alter column "creator_id" set default 'ln';`,
    );
    this.addSql(
      `alter table "initiatives" alter column "workspace_id" set default 'circle-workspace';`,
    );
    this.addSql(
      `alter table "labels" alter column "workspace_id" set default 'circle-workspace';`,
    );
    this.addSql(
      `alter table "saved_views" alter column "workspace_id" set default 'circle-workspace';`,
    );
  }
}
