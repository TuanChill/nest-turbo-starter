import { EntityRepositoryType } from '@mikro-orm/core';
import {
  Entity,
  Filter,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { WorkspaceMemberRepository } from './workspace-member.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({
  tableName: 'workspace_user_members',
  repository: () => WorkspaceMemberRepository,
})
@Unique({ properties: ['workspaceId', 'memberId'] })
export class WorkspaceMember {
  [EntityRepositoryType]?: WorkspaceMemberRepository;

  @PrimaryKey({ type: 'string' })
  id: string;

  @Index()
  @Property({ type: 'string' })
  workspaceId: string;

  @Index()
  @Property({ type: 'string' })
  memberId: string;

  @Property({ type: 'string', default: 'Member' })
  role: 'Owner' | 'Admin' | 'Member' | 'Guest';

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  joinedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<WorkspaceMember>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
