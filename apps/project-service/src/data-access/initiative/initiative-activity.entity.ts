import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'initiative_activities' })
@Index({ properties: ['initiativeId', 'createdAt'] })
export class InitiativeActivity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  initiativeId: string;

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

  constructor(partial?: Partial<InitiativeActivity>) {
    if (partial) Object.assign(this, partial);
  }
}
