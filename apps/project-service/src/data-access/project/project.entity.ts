import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ProjectRepository } from './project.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'projects', repository: () => ProjectRepository })
export class Project {
  [EntityRepositoryType]?: ProjectRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // '1', '2', etc.

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  teamId: string;

  @Property({ type: 'string', nullable: true })
  leadId: string;

  @Property({ type: 'string', default: 'in-progress' })
  statusId: string;

  @Property({ type: 'string', default: 'started' })
  statusCategory: string;

  @Property({ type: 'string', default: 'no-priority' })
  priorityId: string;

  @Property({ type: 'string', default: 'no-update' })
  healthId: string;

  @Property({ type: 'integer', default: 0 })
  percentComplete: number;

  @Property({ type: 'string', default: 'Cuboid' })
  icon: string;

  @Property({ type: 'date', nullable: true })
  startDate: Date;

  @Property({ type: 'date', nullable: true })
  targetDate: Date;

  @Property({ type: 'string', nullable: true })
  initiativeId?: string;

  @Property({ type: 'text', nullable: true })
  summary?: string;

  @Property({ type: 'jsonb', default: '[]' })
  description: any[] = []; // ContentBlock[]

  @Property({ type: 'jsonb', default: '[]' })
  resources: any[] = []; // { label: string, url: string }[]

  @Property({ type: 'timestamp with time zone', nullable: true })
  healthUpdatedAt?: Date;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<Project>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
