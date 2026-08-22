import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { IssueRepository } from './issue.repository';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'issues', repository: () => IssueRepository })
export class Issue {
  [EntityRepositoryType]?: IssueRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // '1', '2', or 'LNUI-701'

  @Property({ type: 'string', unique: true })
  identifier: string; // 'LNUI-701'

  @Property({ type: 'string' })
  title: string;

  @Property({ type: 'text', default: '' })
  description: string;

  @Property({ type: 'json', default: '[]' })
  descriptionBlocks: any[] = []; // ContentBlock[]

  @Property({ type: 'string', default: 'to-do' })
  statusId: string;

  @Property({ type: 'string', default: 'unstarted' })
  statusCategory: string;

  @Property({ type: 'string', default: 'no-priority' })
  priorityId: string;

  @Property({ type: 'string', nullable: true })
  assigneeId?: string;

  @Property({ type: 'string', default: 'ln' })
  creatorId: string;

  @Property({ type: 'string', default: 'CORE' })
  teamId: string;

  @Property({ type: 'string', nullable: true })
  projectId?: string;

  @Property({ type: 'string', default: '' })
  cycleId: string = '';

  @Property({ type: 'string', nullable: true })
  parentIssueId?: string;

  @Property({ type: 'string', default: '0|hzzzzz:' })
  rank: string;

  @Property({ type: 'date', nullable: true })
  dueDate?: Date;

  @Property({ type: 'string', nullable: true })
  milestone?: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<Issue>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
