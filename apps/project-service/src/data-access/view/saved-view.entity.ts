import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { SavedViewRepository } from './saved-view.repository';

@Entity({ tableName: 'saved_views', repository: () => SavedViewRepository })
@Index({ properties: ['workspaceId'] })
export class SavedView {
  [EntityRepositoryType]?: SavedViewRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'blocked-3-days', 'all-active-projects', etc.

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'text', default: '' })
  description: string;

  @Property({ type: 'string', default: '📦' })
  icon: string;

  @Property({ type: 'string', default: 'circle-workspace' })
  workspaceId: string;

  @Property({ type: 'string', default: 'issue' })
  type: 'issue' | 'project';

  @Property({ type: 'string', nullable: true })
  teamId?: string;

  @Property({ type: 'string', nullable: true })
  projectId?: string;

  @Property({ type: 'string', default: 'list' })
  layout: 'list' | 'grid' = 'list';

  @Property({ type: 'string', default: 'ln' })
  ownerId: string;

  @Property({ type: 'jsonb', default: '{}' })
  filter: any; // ViewFilter

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<SavedView>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
