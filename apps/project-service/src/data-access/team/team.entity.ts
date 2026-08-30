import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { TeamRepository } from './team.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'teams', repository: () => TeamRepository })
export class Team {
  [EntityRepositoryType]?: TeamRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'CORE', 'DESIGN', 'PERF', etc.

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  icon: string;

  @Property({ type: 'string', default: '#5e6ad2' })
  color: string;

  @Property({ type: 'boolean', default: false })
  joined: boolean;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', nullable: true })
  workspaceId?: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<Team>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
