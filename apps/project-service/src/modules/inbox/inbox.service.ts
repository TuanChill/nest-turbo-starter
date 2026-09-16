import { EntityManager } from '@mikro-orm/core';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v7 } from 'uuid';
import {
  CreateNotificationDto,
  MarkReadDto,
  UpdateNotificationPreferencesDto,
} from './dto/inbox.dto';
import {
  Issue,
  Member,
  Notification,
  NotificationPreference,
  Team,
  TeamMember,
  toSafeMember,
  WorkspaceMember,
} from '../../data-access';
import type { NotificationCategories } from '../../data-access';
import { IssuesService } from '../issues/issues.service';

function formatTimestamp(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

@Injectable()
export class InboxService {
  constructor(
    private readonly em: EntityManager,
    private readonly issuesService: IssuesService,
  ) {}

  private defaultCategories() {
    return {
      comments: true,
      mentions: true,
      assignments: true,
      statusChanges: true,
      projectUpdates: true,
    };
  }

  private normalizeCategories(
    current?: Partial<NotificationCategories>,
    incoming?: Partial<NotificationCategories>,
  ): NotificationCategories {
    const currentValues = (current ?? {}) as Record<string, unknown>;
    const incomingValues = (incoming ?? {}) as Record<string, unknown>;
    const defaults = this.defaultCategories();
    const pick = (key: keyof NotificationCategories) =>
      typeof incomingValues[key] === 'boolean'
        ? incomingValues[key]
        : typeof currentValues[key] === 'boolean'
          ? currentValues[key]
          : defaults[key];
    return {
      comments: pick('comments') as boolean,
      mentions: pick('mentions') as boolean,
      assignments: pick('assignments') as boolean,
      statusChanges: pick('statusChanges') as boolean,
      projectUpdates: pick('projectUpdates') as boolean,
    };
  }

  private serializePreferences(preferences: NotificationPreference) {
    return {
      memberId: preferences.memberId,
      channels: {
        desktop: preferences.desktop,
        mobile: preferences.mobile,
        email: preferences.email,
        slack: preferences.slack,
      },
      emailFormat: preferences.emailFormat,
      categories: this.normalizeCategories(preferences.categories),
    };
  }

  async getNotificationPreferences(memberId: string) {
    let preferences = await this.em.findOne(NotificationPreference, { memberId });
    if (!preferences) {
      preferences = new NotificationPreference({
        memberId,
        categories: this.normalizeCategories(),
      });
      this.em.persist(preferences);
      await this.em.flush();
    }
    return this.serializePreferences(preferences);
  }

  async updateNotificationPreferences(
    memberId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    let preferences = await this.em.findOne(NotificationPreference, { memberId });
    if (!preferences) {
      preferences = new NotificationPreference({
        memberId,
        categories: this.defaultCategories(),
      });
      this.em.persist(preferences);
    }
    Object.assign(preferences, {
      desktop: dto.desktop ?? preferences.desktop,
      mobile: dto.mobile ?? preferences.mobile,
      email: dto.email ?? preferences.email,
      slack: dto.slack ?? preferences.slack,
      emailFormat: dto.emailFormat ?? preferences.emailFormat,
      categories: this.normalizeCategories(preferences.categories, dto.categories),
    });
    await this.em.flush();
    return this.serializePreferences(preferences);
  }

  async findAll(userId: string) {
    const notifications = await this.em.find(
      Notification,
      { userId },
      { orderBy: { createdAt: 'DESC' } },
    );

    const results = await Promise.all(
      notifications.map(async (notif) => {
        // A deleted issue leaves an old inbox row behind. That row is safe to
        // omit, but any other lookup/authorization failure must remain visible
        // to the caller instead of being silently converted to an empty inbox.
        const storedIssue = await this.em.findOne(Issue, {
          identifier: notif.issueIdentifier,
        });
        if (!storedIssue) return null;

        const issue = await this.issuesService.findOne(notif.issueIdentifier, userId);
        const team = await this.em.findOne(Team, { id: issue.teamId });
        const actor = await this.em.findOne(Member, { id: notif.actorId });
        let actorIsVisible = false;
        if (team && actor) {
          const [teamMembership, workspaceMembership] = await Promise.all([
            this.em.findOne(TeamMember, { teamId: team.id, memberId: actor.id }),
            team.workspaceId
              ? this.em.findOne(WorkspaceMember, {
                  workspaceId: team.workspaceId,
                  memberId: actor.id,
                })
              : null,
          ]);
          actorIsVisible = Boolean(teamMembership || workspaceMembership);
        }
        return {
          ...issue,
          id: notif.id,
          content: notif.content,
          type: notif.type,
          user: actorIsVisible && actor ? toSafeMember(actor) : null,
          timestamp: formatTimestamp(notif.createdAt),
          notificationCreatedAt: notif.createdAt.toISOString(),
          read: notif.read,
        };
      }),
    );

    // Skip orphaned notifications if their issue was deleted
    return results.filter(
      (result): result is NonNullable<typeof result> => result !== null,
    );
  }

  async markAsRead(userId: string, id: string, dto: MarkReadDto) {
    const notif = await this.em.findOne(Notification, { id, userId });
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);

    notif.read = dto.read;
    await this.em.flush();
    return { success: true, id, read: notif.read };
  }

  async markAllAsRead(userId: string) {
    const notifications = await this.em.find(Notification, { userId, read: false });
    for (const notif of notifications) {
      notif.read = true;
    }
    await this.em.flush();
    return { success: true, updatedCount: notifications.length };
  }

  async delete(userId: string, id: string) {
    const notif = await this.em.findOne(Notification, { id, userId });
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);

    this.em.remove(notif);
    await this.em.flush();
    return { success: true, id };
  }

  async deleteAll(userId: string) {
    const notifications = await this.em.find(Notification, { userId });
    await this.removeNotifications(notifications);
    return { success: true, deletedCount: notifications.length };
  }

  async deleteRead(userId: string) {
    const notifications = await this.em.find(Notification, { userId, read: true });
    await this.removeNotifications(notifications);
    return { success: true, deletedCount: notifications.length };
  }

  async deleteForCompletedIssues(userId: string) {
    const notifications = await this.em.find(Notification, { userId });
    const identifiers = [
      ...new Set(notifications.map((notification) => notification.issueIdentifier)),
    ];
    const completedIssues = await this.em.find(Issue, {
      identifier: { $in: identifiers },
      statusCategory: 'completed',
    });
    const completedIdentifiers = new Set(
      completedIssues.map((issue) => issue.identifier),
    );
    const completedNotifications = notifications.filter((notification) =>
      completedIdentifiers.has(notification.issueIdentifier),
    );

    await this.removeNotifications(completedNotifications);
    return { success: true, deletedCount: completedNotifications.length };
  }

  private async removeNotifications(notifications: Notification[]) {
    if (notifications.length === 0) return;
    for (const notification of notifications) this.em.remove(notification);
    await this.em.flush();
  }

  async create(dto: CreateNotificationDto, actorId: string) {
    if (dto.actorId !== actorId) {
      throw new BadRequestException(
        'Notification actor must be the authenticated member',
      );
    }
    const issue = await this.issuesService.findOne(dto.issueIdentifier, actorId);
    const recipientId = dto.userId ?? actorId;
    const recipient = await this.em.findOne(Member, { id: recipientId });
    if (!recipient) throw new NotFoundException(`Member ${recipientId} not found`);

    const team = await this.em.findOne(Team, { id: issue.teamId });
    if (!team) throw new NotFoundException(`Team ${issue.teamId} not found`);
    const [teamMembership, workspaceMembership] = await Promise.all([
      this.em.findOne(TeamMember, { teamId: team.id, memberId: recipientId }),
      team.workspaceId
        ? this.em.findOne(WorkspaceMember, {
            workspaceId: team.workspaceId,
            memberId: recipientId,
          })
        : null,
    ]);
    if (!teamMembership && !workspaceMembership) {
      throw new NotFoundException(`Member ${recipientId} not found`);
    }

    const notif = new Notification({
      id: v7(),
      issueIdentifier: dto.issueIdentifier,
      userId: recipientId,
      actorId,
      type: dto.type,
      content: dto.content,
      read: dto.read || false,
    });

    this.em.persist(notif);
    await this.em.flush();
    return notif;
  }
}
