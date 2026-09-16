import type { EntityManager } from '@mikro-orm/core';
import { TeamsService } from './teams.service';
import { Team, TeamMember, WorkspaceMember } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({ EntityManager: class MockEntityManager {} }));
jest.mock('../../data-access', () => {
  class MockTeam {
    id = '';
    name = '';
    workspaceId?: string;

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }
  return {
    Member: class MockMember {},
    Project: class MockProject {},
    Team: MockTeam,
    TeamMember: class MockTeamMember {},
    Workspace: class MockWorkspace {},
    WorkspaceMember: class MockWorkspaceMember {},
    toSafeMember: (member: unknown) => member,
  };
});

describe('TeamsService role permissions', () => {
  it('does not let a visible regular member update team settings', async () => {
    const team = new Team({
      id: 'team-1',
      name: 'Engineering',
      workspaceId: 'workspace-1',
    });
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return team;
        if (entity === WorkspaceMember) return { role: 'Member' };
        if (entity === TeamMember) return { role: 'member' };
        return null;
      }),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-1']),
    };
    const service = new TeamsService(em, workspacesService as never);

    await expect(
      service.update('team-1', { name: 'Changed' }, 'member-1'),
    ).rejects.toThrow('Team team-1 not found');
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('does not let a team lead delete the team', async () => {
    const team = new Team({
      id: 'team-1',
      name: 'Engineering',
      workspaceId: 'workspace-1',
    });
    const em = {
      findOne: jest.fn(async (entity: unknown) => {
        if (entity === Team) return team;
        if (entity === WorkspaceMember) return { role: 'Member' };
        if (entity === TeamMember) return { role: 'lead' };
        return null;
      }),
      flush: jest.fn(),
    } as unknown as EntityManager;
    const workspacesService = {
      getAccessibleTeamIds: jest.fn().mockResolvedValue(['team-1']),
    };
    const service = new TeamsService(em, workspacesService as never);

    await expect(service.delete('team-1', 'member-1')).rejects.toThrow(
      'Team team-1 not found',
    );
    expect(em.flush).not.toHaveBeenCalled();
  });
});
