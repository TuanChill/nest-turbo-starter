import type { EntityManager } from '@mikro-orm/core';
import { DocumentsService } from './documents.service';
import {
  DocumentFolder,
  Member,
  Team,
  TeamDocument,
  TeamMember,
  WorkspaceMember,
} from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  DocumentFolder: class MockDocumentFolder {},
  Member: class MockMember {},
  Team: class MockTeam {},
  TeamDocument: class MockTeamDocument {},
  TeamMember: class MockTeamMember {},
  WorkspaceMember: class MockWorkspaceMember {},
  toSafeMember: (member: unknown) => member,
}));

describe('DocumentsService creator scope', () => {
  it('does not expose a creator from another workspace on an accessible folder', async () => {
    const folderA = { id: 'folder-a', teamId: 'team-a' };
    const folderB = { id: 'folder-b', teamId: 'team-b' };
    const memberA = { id: 'member-a', name: 'Workspace A member' };
    const memberB = { id: 'member-b', name: 'Workspace B member' };
    const documentA = {
      id: 'document-a',
      folderId: 'folder-a',
      creatorId: 'member-a',
      createdAt: new Date('2026-09-17T00:00:00.000Z'),
      updatedAt: new Date('2026-09-17T00:00:00.000Z'),
    };
    const documentB = {
      id: 'document-b',
      folderId: 'folder-b',
      creatorId: 'member-a',
      createdAt: new Date('2026-09-17T00:00:00.000Z'),
      updatedAt: new Date('2026-09-17T00:00:00.000Z'),
    };
    const documentB2 = {
      id: 'document-b2',
      folderId: 'folder-b',
      creatorId: 'member-b',
      createdAt: new Date('2026-09-17T00:00:00.000Z'),
      updatedAt: new Date('2026-09-17T00:00:00.000Z'),
    };
    const teams = [
      { id: 'team-a', workspaceId: 'workspace-a' },
      { id: 'team-b', workspaceId: 'workspace-b' },
    ];
    const em = {
      find: jest.fn(async (entity: unknown) => {
        if (entity === DocumentFolder) return [folderA, folderB];
        if (entity === TeamDocument) return [documentA, documentB, documentB2];
        if (entity === Team) return teams;
        if (entity === TeamMember) {
          return [
            { teamId: 'team-a', memberId: 'member-a' },
            { teamId: 'team-b', memberId: 'member-b' },
          ];
        }
        if (entity === WorkspaceMember) {
          return [
            { workspaceId: 'workspace-a', memberId: 'member-a' },
            { workspaceId: 'workspace-b', memberId: 'member-b' },
          ];
        }
        if (entity === Member) return [memberA, memberB];
        return [];
      }),
    } as unknown as EntityManager;
    const service = new DocumentsService(em, {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-a', 'team-b']),
    } as never);

    const folders = await service.findAllFolders('viewer');

    expect(folders[0].documents[0].creator).toEqual(memberA);
    expect(folders[1].documents[0].creator).toBeNull();
    expect(folders[1].documents[1].creator).toEqual(memberB);
  });
});
