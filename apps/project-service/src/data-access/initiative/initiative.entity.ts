import { EntityRepositoryType } from '@mikro-orm/core';
import {
  Entity,
  Filter,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { InitiativeRepository } from './initiative.repository';

@Filter({ name: 'softDelete', cond: () => ({ deletedAt: null }), default: true })
@Entity({ tableName: 'initiatives', repository: () => InitiativeRepository })
@Index({ properties: ['workspaceId'] })
export class Initiative {
  [EntityRepositoryType]?: InitiativeRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'component-platform', etc.

  @Property({ type: 'string', default: 'circle-workspace' })
  workspaceId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', default: '🎯' })
  icon: string;

  @Property({ type: 'string', default: 'active' })
  status: 'active' | 'planned' | 'completed';

  @Property({ type: 'string', default: 'no-priority' })
  priorityId: string;

  @Property({ type: 'string', nullable: true })
  ownerId?: string;

  @Property({ type: 'string', nullable: true })
  target?: string;

  @Property({ type: 'string', default: 'on-track' })
  healthId: string;

  @Property({ type: 'jsonb', default: '[]' })
  projectIds: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  labelIds: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  resources: any[] = [];

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<Initiative>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
