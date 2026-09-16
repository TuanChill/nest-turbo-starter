import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('@mikro-orm/core', () => ({
  EntityManager: class MockEntityManager {},
}));

jest.mock('@app/common', () => ({
  hashData: jest.fn().mockResolvedValue('hashed-password'),
  verifyHashed: jest.fn(),
}));

jest.mock('../../data-access', () => ({
  Member: class MockMember {
    constructor(partial?: Record<string, unknown>) {
      Object.assign(this, partial);
    }
  },
  TeamMember: class MockTeamMember {},
  Workspace: class MockWorkspace {},
  WorkspaceMember: class MockWorkspaceMember {},
}));

describe('AuthService signup', () => {
  it('generates an opaque UUID member ID for a new password account', async () => {
    const em = {
      findOne: jest.fn().mockResolvedValue(null),
      persist: jest.fn(),
      flush: jest.fn(),
    };
    const jwtService = { sign: jest.fn().mockReturnValue('token') };
    const configService = { get: jest.fn().mockReturnValue('jwt-secret') };
    const service = new AuthService(
      em as never,
      jwtService as never,
      configService as never,
    );

    const response = await service.signUp({
      name: 'New Account',
      email: 'new.account@example.com',
      password: 'password123',
    });
    const persistedMember = em.persist.mock.calls[0][0];

    expect(persistedMember.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(persistedMember.id).not.toBe('user');
    expect(response.user.id).toBe(persistedMember.id);
  });

  it('does not activate a passwordless legacy member as a new account', async () => {
    const existingMember = {
      id: 'legacy-member',
      email: 'invitee@example.com',
      passwordHash: undefined,
      name: 'Invitee',
      role: 'Member',
      status: 'offline',
    };
    const em = {
      findOne: jest.fn().mockResolvedValue(existingMember),
      persist: jest.fn(),
      flush: jest.fn(),
    };
    const jwtService = { sign: jest.fn().mockReturnValue('token') };
    const configService = { get: jest.fn().mockReturnValue('jwt-secret') };
    const service = new AuthService(
      em as never,
      jwtService as never,
      configService as never,
    );

    await expect(
      service.signUp({
        name: 'New Invitee',
        email: 'invitee@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(existingMember).toEqual(
      expect.objectContaining({
        passwordHash: undefined,
        status: 'offline',
        name: 'Invitee',
      }),
    );
    expect(em.persist).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
