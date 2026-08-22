import { EntityRepositoryType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { DocumentFolderRepository, TeamDocumentRepository } from './document.repository';

@Entity({ tableName: 'document_folders', repository: () => DocumentFolderRepository })
export class DocumentFolder {
  [EntityRepositoryType]?: DocumentFolderRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'team-documents', 'design-tokens-v2', etc.

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', default: '📁' })
  icon: string;

  @Property({ type: 'string', default: 'CORE' })
  teamId: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  constructor(partial?: Partial<DocumentFolder>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

@Entity({ tableName: 'team_documents', repository: () => TeamDocumentRepository })
export class TeamDocument {
  [EntityRepositoryType]?: TeamDocumentRepository;

  @PrimaryKey({ type: 'string' })
  id: string; // 'doc-1', 'doc-2', etc.

  @Property({ type: 'string' })
  folderId: string;

  @Property({ type: 'string' })
  name: string;

  @Property({ type: 'string', default: '📄' })
  icon: string;

  @Property({ type: 'string', default: 'ln' })
  creatorId: string;

  @Property({ type: 'boolean', default: false })
  pinned: boolean;

  @Property({ type: 'text', nullable: true })
  content?: string;

  @Property({ type: 'timestamp with time zone', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp with time zone', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(partial?: Partial<TeamDocument>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
