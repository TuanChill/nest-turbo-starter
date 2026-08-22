import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'project_milestones' })
export class ProjectMilestone {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  projectId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'date', nullable: true })
  targetDate?: Date;

  @Property({ type: 'boolean', default: false })
  completed: boolean;

  @Property({ type: 'integer', default: 0 })
  orderIndex: number;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<ProjectMilestone>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
