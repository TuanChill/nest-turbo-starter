import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

export type IssueTemplateScope = 'workspace' | 'team';

export interface IssueTemplateConfig {
  title?: string;
  description?: string;
  descriptionBlocks?: any[];
  statusId?: string;
  statusCategory?: string;
  priorityId?: string;
  assigneeId?: string;
  labelIds?: string[];
  projectId?: string;
  cycleId?: string;
  dueDate?: string;
}

@Filter({ name: 'softDelete', cond: () => ({ deletedAt: null }), default: true })
@Entity({ tableName: 'issue_templates' })
export class IssueTemplate {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  workspaceId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', default: 'workspace' })
  scope: IssueTemplateScope = 'workspace';

  @Property({ type: 'string', nullable: true })
  teamId?: string;

  @Property({ type: 'string' })
  createdBy: string;

  @Property({ type: 'boolean', default: false })
  isDefault = false;

  @Property({ type: 'jsonb', default: '{}' })
  config: IssueTemplateConfig = {};

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<IssueTemplate>) {
    if (partial) Object.assign(this, partial);
  }
}
