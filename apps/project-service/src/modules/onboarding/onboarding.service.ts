import { EntityManager } from '@mikro-orm/core';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import {
  Member,
  Team,
  TeamMember,
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from '../../data-access';
import { SesMailerService } from '../email/ses-mailer.service';
import {
  createInvitationToken,
  createWorkspaceInviteCode,
} from '../workspaces/invitation-token';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly sesMailerService: SesMailerService,
  ) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  async complete(
    dto: OnboardingCompleteDto,
    currentMemberId: string,
    currentMemberEmail?: string,
  ): Promise<any> {
    const queryConditions: any[] = [{ id: currentMemberId }, { email: currentMemberId }];
    if (currentMemberEmail) {
      queryConditions.push({ email: currentMemberEmail }, { id: currentMemberEmail });
    }
    let member = await this.em.findOne(Member, {
      $or: queryConditions,
    });

    if (!member) {
      throw new NotFoundException(
        'Authenticated member was not found; refusing to create a synthetic account',
      );
    }

    // 1. Prepare unique Workspace Slug
    const rawSlug = dto.workspaceSlug
      ? this.slugify(dto.workspaceSlug)
      : this.slugify(dto.workspaceName);
    if (!rawSlug) {
      throw new BadRequestException(
        'Workspace name or slug must contain at least one alphanumeric character',
      );
    }
    let finalSlug = rawSlug;

    let counter = 1;
    // oxlint-disable-next-line no-await-in-loop -- each candidate slug depends on the previous one being taken
    while (await this.em.findOne(Workspace, { slug: finalSlug })) {
      finalSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    let inviteCode = createWorkspaceInviteCode();
    // oxlint-disable-next-line no-await-in-loop -- each candidate code depends on the previous one being taken
    while (await this.em.findOne(Workspace, { inviteCode })) {
      inviteCode = createWorkspaceInviteCode();
    }

    // 2. Create Workspace
    const workspace = new Workspace({
      id: finalSlug,
      name: dto.workspaceName.trim(),
      slug: finalSlug,
      icon: dto.workspaceIcon || 'from-orange-600 to-amber-500',
      description: `Organization workspace of ${dto.workspaceName}`,
      ownerId: member.id,
      inviteCode,
    });
    this.em.persist(workspace);

    // 3. Create Workspace Member (Owner)
    const wm = new WorkspaceMember({
      id: uuidv4(),
      workspaceId: workspace.id,
      memberId: member.id,
      role: 'Owner',
      joinedAt: new Date(),
    });
    this.em.persist(wm);

    // 4. Create First Team
    const rawTeamKey = (dto.teamKey || dto.teamName.slice(0, 4))
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (!rawTeamKey) {
      throw new BadRequestException(
        'A team key containing letters or numbers is required',
      );
    }
    let finalTeamKey = rawTeamKey;

    let teamCounter = 1;
    // oxlint-disable-next-line no-await-in-loop -- each candidate key depends on the previous one being taken
    while (await this.em.findOne(Team, { id: finalTeamKey })) {
      finalTeamKey = `${rawTeamKey.slice(0, 4)}${teamCounter}`;
      teamCounter++;
    }

    const team = new Team({
      id: finalTeamKey,
      name: dto.teamName.trim(),
      icon: dto.teamIcon || '⚡',
      color: dto.teamColor || '#5e6ad2',
      joined: true,
      workspaceId: workspace.id,
      description: `Primary team for ${dto.workspaceName}`,
    });
    this.em.persist(team);

    // 5. Create Team Member (Lead)
    const tm = new TeamMember({
      teamId: team.id,
      memberId: member.id,
      role: 'lead',
      joinedAt: new Date(),
    });
    this.em.persist(tm);

    // Persist invitations without creating placeholder Member or membership
    // records. The recipient becomes a real member only after accepting.
    const cleanEmails = [
      ...new Set(
        (dto.inviteEmails ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter((cleanEmail) => cleanEmail && cleanEmail !== member.email),
      ),
    ];
    const pendingInvites: Array<{ email: string; token: string }> = [];
    for (const cleanEmail of cleanEmails) {
      const { token, tokenHash } = createInvitationToken();
      // oxlint-disable-next-line no-await-in-loop -- each existing invitation is replaced with a new single-use token.
      const existingInvitation = await this.em.findOne(WorkspaceInvitation, {
        workspaceId: workspace.id,
        email: cleanEmail,
        acceptedAt: null,
      });
      const invitation =
        existingInvitation ??
        new WorkspaceInvitation({
          workspaceId: workspace.id,
          inviterMemberId: member.id,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
        });
      invitation.inviterMemberId = member.id;
      invitation.email = cleanEmail;
      invitation.name = cleanEmail.split('@')[0];
      invitation.role = 'Member';
      invitation.teamIds = [team.id];
      invitation.tokenHash = tokenHash;
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      this.em.persist(invitation);
      pendingInvites.push({ email: cleanEmail, token });
    }

    await this.em.flush();

    // Dispatch invitation emails after the workspace and memberships are persisted.
    if (pendingInvites.length > 0) {
      for (const pendingInvite of pendingInvites) {
        const invitedName = pendingInvite.email.split('@')[0];
        this.sesMailerService
          .sendMemberInviteEmail({
            to: pendingInvite.email,
            name: invitedName,
            role: 'Member',
            orgName: workspace.name,
            orgSlug: workspace.slug,
            inviterName: member.name,
            inviteToken: pendingInvite.token,
          })
          .catch((err) =>
            this.logger.error(
              `Failed to send invite email to ${pendingInvite.email}:`,
              err,
            ),
          );
      }
    }

    this.logger.log(
      `Onboarding completed for user [${member.email}] -> Workspace [${workspace.slug}], Team [${team.id}]`,
    );

    return {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
        description: workspace.description,
        ownerId: workspace.ownerId,
        role: 'Owner',
        inviteCode: workspace.inviteCode,
        memberCount: 1,
        createdAt: workspace.createdAt,
      },
      team: {
        id: team.id,
        name: team.name,
        icon: team.icon,
        color: team.color,
        joined: true,
        workspaceId: workspace.id,
      },
    };
  }
}
