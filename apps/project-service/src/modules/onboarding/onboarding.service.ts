import { EntityManager } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import {
  Issue,
  Member,
  Team,
  TeamMember,
  Workspace,
  WorkspaceMember,
} from '../../data-access';
import { SesMailerService } from '../email/ses-mailer.service';

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

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'CIR-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
      const email =
        currentMemberEmail ||
        (currentMemberId.includes('@')
          ? currentMemberId
          : `${currentMemberId}@circle.internal`);
      member = new Member({
        id: currentMemberId.includes('@')
          ? currentMemberId.split('@')[0]
          : currentMemberId,
        name: dto.workspaceName || 'Circle Member',
        email,
        role: 'Admin',
        status: 'online',
        timezone: 'UTC',
        joinedDate: new Date(),
      });
      this.em.persist(member);
    }

    // 1. Prepare unique Workspace Slug
    const rawSlug = dto.workspaceSlug
      ? this.slugify(dto.workspaceSlug)
      : this.slugify(dto.workspaceName);
    let finalSlug = rawSlug || `workspace-${Math.floor(1000 + Math.random() * 9000)}`;

    let counter = 1;
    // oxlint-disable-next-line no-await-in-loop -- each candidate slug depends on the previous one being taken
    while (await this.em.findOne(Workspace, { slug: finalSlug })) {
      finalSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    let inviteCode = this.generateInviteCode();
    // oxlint-disable-next-line no-await-in-loop -- each candidate code depends on the previous one being taken
    while (await this.em.findOne(Workspace, { inviteCode })) {
      inviteCode = this.generateInviteCode();
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
    let finalTeamKey = rawTeamKey || 'ENG';

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

    // 6. Create Welcome Issue
    const issueId = `${finalTeamKey}-1`;
    const welcomeIssue = new Issue({
      id: issueId,
      identifier: issueId,
      title: 'Welcome to Circle! Explore your new workspace 👋',
      description:
        'This is your first issue created in your new team. You can edit this issue, organize cycles, or press C to create new issues.',
      descriptionBlocks: [
        {
          id: uuidv4(),
          type: 'paragraph',
          text: 'This is your first issue created in your new team. You can organize cycles, invite teammates, or press C to create new issues.',
        },
      ],
      statusId: 'to-do',
      statusCategory: 'unstarted',
      priorityId: 'medium',
      assigneeId: member.id,
      creatorId: member.id,
      teamId: team.id,
    });
    this.em.persist(welcomeIssue);

    // 7. Process Invited Teammate Emails if any
    if (dto.inviteEmails && dto.inviteEmails.length > 0) {
      const cleanEmails = dto.inviteEmails
        .map((email) => email.trim().toLowerCase())
        .filter((cleanEmail) => cleanEmail && cleanEmail !== member.email);

      await Promise.all(
        cleanEmails.map(async (cleanEmail) => {
          const invitedMemberId = cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
          let invitedMember = await this.em.findOne(Member, { email: cleanEmail });
          if (!invitedMember) {
            invitedMember = new Member({
              id: invitedMemberId,
              name: cleanEmail.split('@')[0],
              email: cleanEmail,
              role: 'Member',
              status: 'offline',
              timezone: 'UTC',
              joinedDate: new Date(),
            });
            this.em.persist(invitedMember);
          }

          const invitedWm = new WorkspaceMember({
            id: uuidv4(),
            workspaceId: workspace.id,
            memberId: invitedMember.id,
            role: 'Member',
            joinedAt: new Date(),
          });
          this.em.persist(invitedWm);

          const invitedTm = new TeamMember({
            teamId: team.id,
            memberId: invitedMember.id,
            role: 'member',
            joinedAt: new Date(),
          });
          this.em.persist(invitedTm);
        }),
      );
    }

    await this.em.flush();

    // Dispatch invitation emails after the workspace and memberships are persisted.
    if (dto.inviteEmails && dto.inviteEmails.length > 0) {
      const cleanEmails = dto.inviteEmails
        .map((email) => email.trim().toLowerCase())
        .filter((cleanEmail) => cleanEmail && cleanEmail !== member.email);

      for (const cleanEmail of cleanEmails) {
        const invitedName = cleanEmail.split('@')[0];
        this.sesMailerService
          .sendMemberInviteEmail({
            to: cleanEmail,
            name: invitedName,
            role: 'Member',
            orgName: workspace.name,
            orgSlug: workspace.slug,
            inviterName: member.name,
          })
          .catch((err) =>
            this.logger.error(`Failed to send invite email to ${cleanEmail}:`, err),
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
        memberCount: 1 + (dto.inviteEmails?.length || 0),
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
      welcomeIssue: {
        id: welcomeIssue.id,
        identifier: welcomeIssue.identifier,
        title: welcomeIssue.title,
      },
    };
  }
}
