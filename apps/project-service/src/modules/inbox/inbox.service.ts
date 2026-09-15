import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto, MarkReadDto } from './dto/inbox.dto';
import { Issue, Member, Notification, toSafeMember } from '../../data-access';
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

  async findAll(userId: string) {
    const notifications = await this.em.find(
      Notification,
      { userId },
      { orderBy: { createdAt: 'DESC' } },
    );

    const members = await this.em.find(Member, {});
    const membersMap = new Map(members.map((m) => [m.id, toSafeMember(m)]));

    const results = await Promise.allSettled(
      notifications.map(async (notif) => {
        const issue = await this.issuesService.findOne(notif.issueIdentifier);
        const user = membersMap.get(notif.actorId) || membersMap.get('ln');
        return {
          ...issue,
          id: notif.id,
          content: notif.content,
          type: notif.type,
          user,
          timestamp: formatTimestamp(notif.createdAt),
          notificationCreatedAt: notif.createdAt.toISOString(),
          read: notif.read,
        };
      }),
    );

    // Skip orphaned notifications if their issue was deleted
    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);
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

  async create(dto: CreateNotificationDto) {
    const notif = new Notification({
      id: `notification-${Date.now()}`,
      issueIdentifier: dto.issueIdentifier,
      userId: dto.userId || 'ln',
      actorId: dto.actorId,
      type: dto.type,
      content: dto.content,
      read: dto.read || false,
    });

    this.em.persist(notif);
    await this.em.flush();
    return notif;
  }
}
