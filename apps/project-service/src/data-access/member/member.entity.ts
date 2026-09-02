import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MemberRepository } from './member.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'workspace_members', repository: () => MemberRepository })
export class Member {
  [EntityRepositoryType]?: MemberRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // e.g. 'ln', 'sophia', 'mason'

  @Property({ type: 'string', unique: true })
  email: string;

  @Property({ type: 'string', nullable: true })
  passwordHash?: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', nullable: true })
  avatarUrl: string;

  @Property({ type: 'string', default: 'offline' })
  status: 'online' | 'offline' | 'away';

  @Property({ type: 'string', default: 'Member' })
  role: 'Member' | 'Admin' | 'Guest' | 'Application';

  @Property({ type: 'string', default: 'UTC' })
  timezone: string;

  @Property({ type: 'date', nullable: true })
  joinedDate: Date;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<Member>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/** Strips passwordHash before a Member is embedded in an API response (e.g. as assignee/owner/actor). */
export function toSafeMember<T extends Member>(member: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safe } = member;
  return safe;
}
