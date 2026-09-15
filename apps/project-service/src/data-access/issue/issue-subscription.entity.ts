import {
  Entity,
  Index,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

/** A member's persisted subscription to an accessible issue. */
@Entity({ tableName: 'issue_subscriptions' })
@Index({ properties: ['memberId'] })
@Index({ properties: ['issueIdentifier'] })
@Unique({ properties: ['issueIdentifier', 'memberId'] })
export class IssueSubscription {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  issueIdentifier: string;

  @Property({ type: 'string' })
  memberId: string;

  @Property({
    type: 'timestamp with time zone',
    onCreate: () => new Date(),
    defaultRaw: 'now()',
  })
  createdAt: Date = new Date();

  constructor(partial?: Partial<IssueSubscription>) {
    if (partial) Object.assign(this, partial);
  }
}
