import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { LabelRepository } from './label.repository';

export type LabelScope = 'issue' | 'project' | 'both';

@Entity({ tableName: 'labels', repository: () => LabelRepository })
export class Label {
  [EntityRepositoryType]?: LabelRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'ui', 'bug', 'feature', etc.

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  color: string;

  @Property({ type: 'string', default: 'circle-workspace' })
  workspaceId: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'uuid', nullable: true })
  groupId?: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'string', default: 'both' })
  scope: LabelScope = 'both';

  constructor(partial?: Partial<Label>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

@Entity({ tableName: 'issue_labels' })
export class IssueLabel {
  @PrimaryKey({ type: 'string' })
  issueId: string;

  @PrimaryKey({ type: 'string' })
  labelId: string;

  constructor(issueId?: string, labelId?: string) {
    if (issueId && labelId) {
      this.issueId = issueId;
      this.labelId = labelId;
    }
  }
}

@Entity({ tableName: 'project_labels' })
export class ProjectLabel {
  @PrimaryKey({ type: 'string' })
  projectId: string;

  @PrimaryKey({ type: 'string' })
  labelId: string;

  constructor(projectId?: string, labelId?: string) {
    if (projectId && labelId) {
      this.projectId = projectId;
      this.labelId = labelId;
    }
  }
}
