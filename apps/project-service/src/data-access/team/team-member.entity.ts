import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v7 } from 'uuid';

@Entity({ tableName: 'team_members' })
export class TeamMember {
  @PrimaryKey({ type: 'uuid' })
  id: string = v7();

  @Property({ type: 'string' })
  teamId: string;

  @Property({ type: 'string' })
  memberId: string;

  @Property({ type: 'string', default: 'member' })
  role: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  joinedAt: Date = new Date();

  constructor(partial?: Partial<TeamMember>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
