import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

/** A member's persisted subscription to an accessible project. */
@Entity({ tableName: 'project_subscriptions' })
@Index({ properties: ['memberId'] })
@Index({ properties: ['projectId'] })
@Unique({ properties: ['projectId', 'memberId'] })
export class ProjectSubscription {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  projectId: string;

  @Property({ type: 'string' })
  memberId: string;

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  constructor(partial?: Partial<ProjectSubscription>) {
    if (partial) Object.assign(this, partial);
  }
}
