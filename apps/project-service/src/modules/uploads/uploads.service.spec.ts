import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { FileAttachment, Issue, Project, Team } from '../../data-access';

jest.mock('../../data-access', () => {
  class EntityDouble {
    status = 'pending';

    constructor(partial?: Record<string, unknown>) {
      if (partial) Object.assign(this, partial);
    }
  }
  return {
    FileAttachment: EntityDouble,
    Issue: class Issue extends EntityDouble {},
    Project: class Project extends EntityDouble {},
    Team: class Team extends EntityDouble {},
  };
});

jest.mock('@app/core', () => ({
  AwsS3Service: class AwsS3Service {},
}));

jest.mock('../workspaces/workspaces.service', () => ({
  WorkspacesService: class WorkspacesService {},
}));

describe('UploadsService', () => {
  const em = {
    findOne: jest.fn(),
    find: jest.fn(),
    persist: jest.fn(),
    flush: jest.fn(),
  };
  const workspacesService = {
    getAccessibleTeamIds: jest.fn(),
  };
  const s3Service = {
    isConfigured: jest.fn(),
    getPresignedUploadUrl: jest.fn(),
    assertObjectExists: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    s3Service.isConfigured.mockReturnValue(true);
  });

  it('requires exactly one target and never creates an unscoped upload', async () => {
    const service = new UploadsService(
      em as any,
      workspacesService as any,
      s3Service as any,
    );

    await expect(
      service.createPresignedUpload(
        { fileName: 'x.txt', contentType: 'text/plain', fileSize: 1 } as any,
        'member-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(em.persist).not.toHaveBeenCalled();
  });

  it('rejects a project outside the member accessible teams', async () => {
    s3Service.isConfigured.mockReturnValue(true);
    workspacesService.getAccessibleTeamIds.mockResolvedValue(['team-a']);
    em.findOne.mockImplementation(async (entity: unknown) =>
      entity === Project ? new Project({ id: 'project-b', teamId: 'team-b' }) : null,
    );
    const service = new UploadsService(
      em as any,
      workspacesService as any,
      s3Service as any,
    );

    await expect(
      service.createPresignedUpload(
        {
          fileName: 'x.txt',
          contentType: 'text/plain',
          fileSize: 1,
          projectId: 'project-b',
        },
        'member-1',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(s3Service.getPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it('persists a pending issue upload with the workspace-scoped object key', async () => {
    s3Service.isConfigured.mockReturnValue(true);
    workspacesService.getAccessibleTeamIds.mockResolvedValue(['team-a']);
    s3Service.getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: 'https://storage.test/signed',
      fileUrl: 'https://storage.test/workspaces/ws-a/attachments/1-design.png',
      fileKey: 'workspaces/ws-a/attachments/1-design.png',
    });
    em.findOne.mockImplementation(async (entity: unknown) => {
      if (entity === Issue) return new Issue({ identifier: 'ENG-1', teamId: 'team-a' });
      if (entity === Team) return new Team({ id: 'team-a', workspaceId: 'ws-a' });
      return null;
    });
    const service = new UploadsService(
      em as any,
      workspacesService as any,
      s3Service as any,
    );

    const result = await service.createPresignedUpload(
      {
        fileName: '../design.png',
        contentType: 'image/png',
        fileSize: 42,
        issueIdentifier: 'ENG-1',
      },
      'member-1',
    );

    const persisted = em.persist.mock.calls[0][0] as FileAttachment;
    expect(persisted.status).toBe('pending');
    expect(persisted.workspaceId).toBe('ws-a');
    expect(persisted.teamId).toBe('team-a');
    expect(persisted.issueIdentifier).toBe('ENG-1');
    expect(persisted.fileKey).toBe('workspaces/ws-a/attachments/1-design.png');
    expect(result.uploadUrl).toBe('https://storage.test/signed');
  });

  it('does not mark an upload complete until storage confirms the object exists', async () => {
    workspacesService.getAccessibleTeamIds.mockResolvedValue(['team-a']);
    const attachment = new FileAttachment({
      id: 'attachment-1',
      workspaceId: 'ws-a',
      teamId: 'team-a',
      uploaderId: 'member-1',
      fileName: 'x.txt',
      contentType: 'text/plain',
      fileSize: 1,
      fileKey: 'workspaces/ws-a/attachments/x.txt',
      fileUrl: 'https://storage.test/x.txt',
    });
    em.findOne.mockResolvedValue(attachment);
    s3Service.assertObjectExists.mockRejectedValue(new Error('not found'));
    const service = new UploadsService(
      em as any,
      workspacesService as any,
      s3Service as any,
    );

    await expect(service.complete('attachment-1', 'member-1')).rejects.toThrow(
      'The uploaded object is not available yet',
    );
    expect(attachment.status).toBe('pending');
    expect(em.flush).not.toHaveBeenCalled();
  });
});
