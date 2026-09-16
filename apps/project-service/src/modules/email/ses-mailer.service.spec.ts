import { SesMailerService } from './ses-mailer.service';

describe('SesMailerService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('does not report success when SES credentials are missing', async () => {
    delete process.env.SES_ACCESS_KEY_ID;
    delete process.env.SES_SECRET_ACCESS_KEY;
    delete process.env.AWS_SES_ACCESS_KEY_ID;
    delete process.env.AWS_SES_ACCESS_SECRET_ACCESS_KEY;

    const service = new SesMailerService();

    await expect(
      service.sendMemberInviteEmail({
        to: 'invitee@example.com',
        name: 'Invitee',
        role: 'Member',
        orgName: 'Acme',
        orgSlug: 'acme',
        inviterName: 'Owner',
      }),
    ).resolves.toBe(false);
  });
});
