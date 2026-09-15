import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'project_members' })
export class ProjectMember {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  projectId: string;

  @Property({ type: 'string' })
  memberId: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<ProjectMember>) {
    if (partial) Object.assign(this, partial);
  }
}
