import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { CycleRepository } from './cycle.repository';

@Filter({ name: 'softDelete', cond: () => ({ deletedAt: null }), default: true })
@Entity({ tableName: 'cycles', repository: () => CycleRepository })
export class Cycle {
  [EntityRepositoryType]?: CycleRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // '21', '22', '23', etc.

  @Property({ type: 'integer' })
  number: number;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string' })
  teamId: string;

  @Property({ type: 'string' })
  status: 'planned' | 'upcoming' | 'current' | 'completed';

  @Property({ type: 'date' })
  startDate: Date;

  @Property({ type: 'date' })
  endDate: Date;

  @Property({ type: 'integer', default: 0 })
  /** Legacy storage field; API capacity is derived from scope and velocity. */
  capacity: number;

  @Property({ type: 'integer', default: 0 })
  scope: number;

  @Property({ type: 'double', default: 0 })
  scopeDelta: number;

  @Property({ type: 'integer', default: 0 })
  started: number;

  @Property({ type: 'integer', default: 0 })
  completed: number;

  @Property({ type: 'double', nullable: true })
  successRate?: number;

  @Property({ type: 'jsonb', nullable: true })
  burnup?: any[]; // CycleBurnupPoint[]

  @Property({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<Cycle>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
