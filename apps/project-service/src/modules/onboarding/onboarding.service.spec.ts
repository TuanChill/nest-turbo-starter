import { NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  Member: class MockMember {},
  Team: class MockTeam {},
  TeamMember: class MockTeamMember {},
  Workspace: class MockWorkspace {},
  WorkspaceMember: class MockWorkspaceMember {},
}));

describe('OnboardingService', () => {
  it('does not create a synthetic member when authentication context is missing', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
      persist: jest.fn(),
    };
    const service = new OnboardingService(em as never, {} as never);

    await expect(
      service.complete(
        {
          workspaceName: 'Acme Corp',
          teamName: 'Engineering',
          teamKey: 'ENG',
        },
        'missing-member',
        'missing@example.com',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(em.persist).not.toHaveBeenCalled();
  });

  it('creates only the requested workspace and team, without a synthetic welcome issue', async () => {
    const member = {
      id: 'member-1',
      email: 'owner@example.com',
      name: 'Owner',
    };
    const persisted: unknown[] = [];
    const em = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      persist: jest.fn((entity: unknown) => {
        if (Array.isArray(entity)) persisted.push(...entity);
        else persisted.push(entity);
      }),
      flush: jest.fn().mockResolvedValue(undefined),
    };
    const service = new OnboardingService(em as never, {} as never);

    const result = await service.complete(
      {
        workspaceName: 'Acme Corp',
        teamName: 'Engineering',
        teamKey: 'ENG',
      },
      member.id,
      member.email,
    );

    expect(result).not.toHaveProperty('welcomeIssue');
    expect(persisted).toHaveLength(4);
    expect(em.flush).toHaveBeenCalledTimes(1);
    expect(persisted).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: expect.any(String) })]),
    );
  });

  it('rejects a workspace name that cannot produce a real slug instead of generating a random one', async () => {
    const member = { id: 'member-1', email: 'owner@example.com', name: 'Owner' };
    const em = {
      findOne: jest.fn().mockResolvedValue(member),
      persist: jest.fn(),
    };
    const service = new OnboardingService(em as never, {} as never);

    await expect(
      service.complete(
        { workspaceName: '你好', teamName: 'Engineering', teamKey: 'ENG' },
        member.id,
        member.email,
      ),
    ).rejects.toThrow('must contain at least one alphanumeric character');
    expect(em.persist).not.toHaveBeenCalled();
  });
});
