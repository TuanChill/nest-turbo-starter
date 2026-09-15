import {
  Entity,
  Filter,
  Index,
  PrimaryKey,
  Property,
} from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

export type LabelGroupScope = 'issue' | 'project' | 'both';

@Filter({
  name: 'softDelete',
  cond: () => ({ deletedAt: null }),
  default: true,
})
@Entity({ tableName: 'label_groups' })
@Index({ properties: ['workspaceId'] })
export class LabelGroup {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  workspaceId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', default: 'issue' })
  scope: LabelGroupScope = 'issue';

  @Property({ type: 'boolean', default: false })
  mutuallyExclusive = false;

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  @Property({
    type: 'timestamp with time zone',
    onUpdate: () => new Date(),
    defaultRaw: 'now()',
  })
  updatedAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  constructor(partial?: Partial<LabelGroup>) {
    if (partial) Object.assign(this, partial);
  }
}
