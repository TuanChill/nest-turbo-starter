import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/** Persisted team-level cycle cadence and automation settings. */
@Entity({ tableName: 'cycle_settings' })
export class CycleSettings {
  @PrimaryKey({ type: 'string' })
  teamId: string;

  @Property({ type: 'boolean', default: false })
  enabled = false;

  @Property({ type: 'integer', default: 2 })
  durationWeeks = 2;

  @Property({ type: 'integer', default: 1 })
  startDayOfWeek = 1;

  @Property({ type: 'integer', default: 0 })
  cooldownDays = 0;

  @Property({ type: 'integer', default: 3 })
  upcomingCycleCount = 3;

  @Property({ type: 'boolean', default: false })
  autoAddActiveIssues = false;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<CycleSettings>) {
    if (partial) Object.assign(this, partial);
  }
}
