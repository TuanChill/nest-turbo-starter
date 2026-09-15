import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

export type ProjectTemplateScope = 'workspace' | 'team';

export interface ProjectTemplateConfig {
  project?: {
    summary?: string;
    description?: any[];
    resources?: any[];
    icon?: string;
    statusId?: string;
    statusCategory?: string;
    priorityId?: string;
    healthId?: string;
    leadId?: string;
    initiativeId?: string;
    labelIds?: string[];
    memberIds?: string[];
  };
  milestones?: Array<{
    key: string;
    name: string;
    targetDate?: string;
    orderIndex?: number;
  }>;
  issues?: Array<{
    key: string;
    title: string;
    description?: string;
    descriptionBlocks?: any[];
    statusId?: string;
    statusCategory?: string;
    priorityId?: string;
    assigneeId?: string;
    labelIds?: string[];
    milestoneKey?: string;
    parentKey?: string;
    dueDate?: string;
    rank?: string;
  }>;
}

@Filter({ name: 'softDelete', cond: () => ({ deletedAt: null }), default: true })
@Entity({ tableName: 'project_templates' })
export class ProjectTemplate {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  workspaceId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'string', default: 'workspace' })
  scope: ProjectTemplateScope = 'workspace';

  @Property({ type: 'string', nullable: true })
  teamId?: string;

  @Property({ type: 'string' })
  createdBy: string;

  @Property({ type: 'boolean', default: false })
  isDefault = false;

  @Property({ type: 'jsonb', default: '{}' })
  config: ProjectTemplateConfig = {};

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<ProjectTemplate>) {
    if (partial) Object.assign(this, partial);
  }
}
