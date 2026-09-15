import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'project_activities' })
@Index({ properties: ['projectId'] })
export class ProjectActivity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  projectId: string;

  @Property({ type: 'string' })
  actorId: string;

  @Property({ type: 'string' })
  event: string;

  @Property({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown> = {};

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  constructor(partial?: Partial<ProjectActivity>) {
    if (partial) Object.assign(this, partial);
  }
}
