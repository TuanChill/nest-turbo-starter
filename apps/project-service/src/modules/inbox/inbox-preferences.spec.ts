import type { EntityManager } from '@mikro-orm/core';
import { InboxService } from './inbox.service';
import { NotificationPreference } from '../../data-access';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('../issues/issues.service', () => ({
  IssuesService: class MockIssuesService {},
}));

jest.mock('../../data-access', () => {
  class MockNotificationPreference {
    memberId?: string;
    desktop = true;
    mobile = false;
    email = true;
    slack = false;
    emailFormat = 'digest';
    categories = {
      comments: true,
      mentions: true,
      assignments: true,
      statusChanges: true,
      projectUpdates: true,
    };

    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  }

  return { NotificationPreference: MockNotificationPreference };
});

describe('InboxService notification preferences', () => {
  function buildService(existing: NotificationPreference | null = null) {
    let current = existing;
    const em = {
      findOne: jest.fn(async () => current),
      persist: jest.fn((value: NotificationPreference) => {
        current = value;
      }),
      flush: jest.fn(async () => undefined),
    } as unknown as EntityManager;
    return { em, service: new InboxService(em, {} as never) };
  }

  it('creates and persists explicit defaults instead of returning a fixture', async () => {
    const { em, service } = buildService();

    await expect(service.getNotificationPreferences('member-1')).resolves.toEqual({
      memberId: 'member-1',
      channels: { desktop: true, mobile: false, email: true, slack: false },
      emailFormat: 'digest',
      categories: {
        comments: true,
        mentions: true,
        assignments: true,
        statusChanges: true,
        projectUpdates: true,
      },
    });
    expect(em.persist).toHaveBeenCalledTimes(1);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('updates only the requested channel and category values', async () => {
    const existing = new NotificationPreference({ memberId: 'member-1' });
    const { em, service } = buildService(existing);

    await expect(
      service.updateNotificationPreferences('member-1', {
        slack: true,
        categories: { mentions: false },
        emailFormat: 'immediate',
      }),
    ).resolves.toEqual({
      memberId: 'member-1',
      channels: { desktop: true, mobile: false, email: true, slack: true },
      emailFormat: 'immediate',
      categories: {
        comments: true,
        mentions: false,
        assignments: true,
        statusChanges: true,
        projectUpdates: true,
      },
    });
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('does not persist unknown category keys from a loose JSON payload', async () => {
    const existing = new NotificationPreference({ memberId: 'member-1' });
    const { service } = buildService(existing);

    const result = await service.updateNotificationPreferences('member-1', {
      categories: { mentions: false, injected: true } as never,
    });

    expect(result.categories).toEqual({
      comments: true,
      mentions: false,
      assignments: true,
      statusChanges: true,
      projectUpdates: true,
    });
    expect(result.categories).not.toHaveProperty('injected');
  });
});
