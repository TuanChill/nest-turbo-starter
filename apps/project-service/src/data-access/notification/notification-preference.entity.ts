import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';

export type NotificationEmailFormat = 'digest' | 'immediate';

export interface NotificationCategories {
  comments: boolean;
  mentions: boolean;
  assignments: boolean;
  statusChanges: boolean;
  projectUpdates: boolean;
}

@Entity({ tableName: 'notification_preferences' })
@Unique({ properties: ['memberId'] })
export class NotificationPreference {
  @PrimaryKey({ type: 'string' })
  memberId: string;

  @Property({ type: 'boolean', default: true })
  desktop = true;

  @Property({ type: 'boolean', default: false })
  mobile = false;

  @Property({ type: 'boolean', default: true })
  email = true;

  @Property({ type: 'boolean', default: false })
  slack = false;

  @Property({ type: 'string', default: 'digest' })
  emailFormat: NotificationEmailFormat = 'digest';

  @Property({ type: 'jsonb', default: '{}' })
  categories: NotificationCategories = {
    comments: true,
    mentions: true,
    assignments: true,
    statusChanges: true,
    projectUpdates: true,
  };

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<NotificationPreference>) {
    if (partial) Object.assign(this, partial);
  }
}
