import { NotFoundException } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../../data-access', () => ({
  Issue: class MockIssue {},
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
});
