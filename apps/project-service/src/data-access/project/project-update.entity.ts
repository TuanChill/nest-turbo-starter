import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'project_updates' })
export class ProjectUpdate {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  projectId: string;

  @Property({ type: 'string' })
  authorId: string;

  @Property({ type: 'string' })
  health: 'on-track' | 'at-risk' | 'off-track';

  @Property({ type: 'jsonb', default: '[]' })
  blocks: any[] = []; // ContentBlock[]

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<ProjectUpdate>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
