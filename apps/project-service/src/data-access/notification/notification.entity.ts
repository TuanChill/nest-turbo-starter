import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { NotificationRepository } from './notification.repository';

@Entity({ tableName: 'notifications', repository: () => NotificationRepository })
@Index({ properties: ['userId', 'read', 'createdAt'] })
export class Notification {
  [EntityRepositoryType]?: NotificationRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'notification-1' or uuid

  @Property({ type: 'string' })
  issueIdentifier: string; // 'LNUI-703'

  @Property({ type: 'string', default: 'ln' })
  userId: string; // recipient

  @Property({ type: 'string' })
  actorId: string; // actor

  @Property({ type: 'string' })
  type:
    | 'comment'
    | 'mention'
    | 'assignment'
    | 'status'
    | 'reopened'
    | 'closed'
    | 'edited'
    | 'created'
    | 'upload';

  @Property({ type: 'text' })
  content: string;

  @Property({ type: 'boolean', default: false })
  read: boolean;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<Notification>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
