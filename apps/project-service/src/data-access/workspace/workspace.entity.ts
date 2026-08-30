import { EntityRepositoryType } from '@mikro-orm/core';
import {
  Entity,
  Filter,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { WorkspaceRepository } from './workspace.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'workspaces', repository: () => WorkspaceRepository })
export class Workspace {
  [EntityRepositoryType]?: WorkspaceRepository;

  @PrimaryKey({ type: 'string' })
  id: string;

  @Property({ type: 'string' })
  name: string;

  @Unique()
  @Property({ type: 'string' })
  slug: string;

  @Property({ type: 'string', default: 'from-orange-600 to-amber-500' })
  icon: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string' })
  ownerId: string;

  @Unique()
  @Property({ type: 'string' })
  inviteCode: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<Workspace>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
