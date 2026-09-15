import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { ReviewRepository } from './review.repository';

@Entity({ tableName: 'reviews', repository: () => ReviewRepository })
export class Review {
  [EntityRepositoryType]?: ReviewRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'rev-101', etc.

  @Property({ type: 'string' })
  title: string;

  @Property({ type: 'string', nullable: true })
  workspaceId?: string;

  @Property({ type: 'string', default: 'ln' })
  authorId: string;

  @Property({ type: 'string', default: 'open' })
  status: 'open' | 'merged' | 'closed';

  @Property({ type: 'string', nullable: true })
  resolves?: string; // e.g. 'LNUI-703'

  @Property({ type: 'string', nullable: true })
  branch?: string;

  @Property({ type: 'jsonb', default: '[]' })
  fileStats: any[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  commits: any[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  summaryBullets: string[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  verdicts: any[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  guideSections: any[] = [];

  @Property({ type: 'jsonb', default: '[]' })
  fileDiffs: any[] = [];

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<Review>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
