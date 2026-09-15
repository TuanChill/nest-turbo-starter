import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

/** One persisted daily point for a cycle's historical progress graph. */
@Entity({ tableName: 'cycle_history' })
@Index({ properties: ['cycleId'] })
@Unique({ properties: ['cycleId', 'recordedOn'] })
export class CycleHistory {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  cycleId: string;

  @Property({ type: 'date' })
  recordedOn: Date;

  @Property({ type: 'integer', default: 0 })
  scope: number;

  @Property({ type: 'integer', default: 0 })
  started: number;

  @Property({ type: 'integer', default: 0 })
  completed: number;

  @Property({ type: 'double', default: 0 })
  ideal: number;

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  constructor(partial?: Partial<CycleHistory>) {
    if (partial) Object.assign(this, partial);
  }
}
