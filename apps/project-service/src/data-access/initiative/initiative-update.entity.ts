import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'initiative_updates' })
export class InitiativeUpdate {
  @PrimaryKey({ type: 'string' })
  id: string = v7();

  @Property({ type: 'string' })
  initiativeId: string;

  @Property({ type: 'string' })
  authorId: string;

  @Property({ type: 'string' })
  health: 'no-update' | 'on-track' | 'at-risk' | 'off-track';

  @Property({ type: 'jsonb', default: '[]' })
  blocks: any[] = [];

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  constructor(partial?: Partial<InitiativeUpdate>) {
    if (partial) Object.assign(this, partial);
  }
}
