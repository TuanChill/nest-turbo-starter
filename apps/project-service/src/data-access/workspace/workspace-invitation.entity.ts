import { EntityRepositoryType } from '@mikro-orm/core';
import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';
import { WorkspaceInvitationRepository } from './workspace-invitation.repository';

@Entity({
  tableName: 'workspace_invitations',
  repository: () => WorkspaceInvitationRepository,
})
@Index({ properties: ['workspaceId', 'email'] })
@Index({ properties: ['expiresAt'] })
@Unique({ properties: ['tokenHash'] })
export class WorkspaceInvitation {
  [EntityRepositoryType]?: WorkspaceInvitationRepository;

  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  workspaceId: string;

  @Property({ type: 'string' })
  inviterMemberId: string;

  @Property({ type: 'string' })
  email: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', default: 'Member' })
  role: 'Admin' | 'Member' | 'Guest' = 'Member';

  @Property({ type: 'jsonb', default: '[]' })
  teamIds: string[] = [];

  @Property({ type: 'string', length: 64 })
  tokenHash: string;

  @Property({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @Property({ type: 'timestamp with time zone', nullable: true })
  acceptedAt?: Date;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<WorkspaceInvitation>) {
    if (partial) Object.assign(this, partial);
  }
}
