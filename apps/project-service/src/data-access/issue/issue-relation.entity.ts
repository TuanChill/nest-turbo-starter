import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'issue_relations' })
export class IssueRelation {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  sourceIdentifier: string; // e.g. 'LNUI-703'

  @Property({ type: 'string' })
  targetIdentifier: string; // e.g. 'LNUI-707'

  @Property({ type: 'string' })
  relationType: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of';

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<IssueRelation>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

@Entity({ tableName: 'pr_links' })
export class PrLink {
  @PrimaryKey({ type: 'string' })
  id: string; // e.g. 'pr-102'

  @Property({ type: 'string' })
  issueIdentifier: string;

  @Property({ type: 'string' })
  title: string;

  @Property({ type: 'string', nullable: true })
  url?: string;

  @Property({ type: 'string', default: 'open' })
  status: 'open' | 'merged' | 'draft' | 'closed';

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<PrLink>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
