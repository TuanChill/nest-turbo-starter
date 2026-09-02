import { EntityManager } from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto, MarkReadDto } from './dto/inbox.dto';
import { Member, Notification, toSafeMember } from '../../data-access';
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
