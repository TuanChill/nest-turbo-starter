import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/** Team-level bearer-token subscription for an external cycle calendar feed. */
@Entity({ tableName: 'cycle_calendar_subscriptions' })
@Index({ properties: ['tokenHash'] })
export class CycleCalendarSubscription {
  @PrimaryKey({ type: 'string' })
  teamId: string;

  /** Only a digest and an encrypted copy are persisted; the plaintext token is never stored. */
  @Property({ type: 'string', length: 64, unique: true })
  tokenHash: string;

  @Property({ type: 'text' })
  tokenCiphertext: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<CycleCalendarSubscription>) {
    if (partial) Object.assign(this, partial);
  }
}
