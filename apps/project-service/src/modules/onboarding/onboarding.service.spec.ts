import { NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  Member: class MockMember {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  Team: class MockTeam {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  TeamMember: class MockTeamMember {},
  Workspace: class MockWorkspace {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  WorkspaceInvitation: class MockWorkspaceInvitation {
    id = 'invitation-1';

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
      this.id = this.id ?? 'invitation-1';
    }
  },
  WorkspaceMember: class MockWorkspaceMember {},
}));

describe('OnboardingService', () => {
  it('does not create a synthetic member when authentication context is missing', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
      persist: jest.fn(),
    };
    const service = new OnboardingService(
      em as never,
      { sendMemberInviteEmail: jest.fn().mockResolvedValue(true) } as never,
    );

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

  it('persists invitations without creating placeholder members or memberships', async () => {
    const member = {
      id: 'member-1',
      email: 'owner@example.com',
      name: 'Owner',
    };
    const persisted: unknown[] = [];
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (
          entity === (jest.requireMock('../../data-access') as { Member: unknown }).Member
        ) {
          return member;
        }
        return null;
      }),
      persist: jest.fn((entity: unknown) => persisted.push(entity)),
      flush: jest.fn().mockResolvedValue(undefined),
    };
    const mailer = { sendMemberInviteEmail: jest.fn().mockResolvedValue(true) };
    const service = new OnboardingService(em as never, mailer as never);

    const result = await service.complete(
      {
        workspaceName: 'Acme Corp',
        teamName: 'Engineering',
        teamKey: 'ENG',
        inviteEmails: ['Invitee@example.com'],
      },
      member.id,
      member.email,
    );

    expect(result.workspace.memberCount).toBe(1);
    expect(persisted).toHaveLength(5);
    expect(persisted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'invitee@example.com',
          tokenHash: expect.any(String),
          teamIds: [expect.any(String)],
        }),
      ]),
    );
    expect(mailer.sendMemberInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'invitee@example.com',
        inviteToken: expect.any(String),
      }),
    );
    expect(persisted).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'invitee@example.com',
          passwordHash: undefined,
        }),
      ]),
    );
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
